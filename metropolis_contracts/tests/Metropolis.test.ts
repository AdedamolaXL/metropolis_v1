// Contracts/tests/Metropolis.test.ts
import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { Metropolis } from "../typechain-types";

const setup = deployments.createFixture(async () => {
    await deployments.fixture("Metropolis");

    const contracts = {
        Metropolis: <Metropolis>await ethers.getContract("Metropolis"),
    };
    return {
        ...contracts,
    };
});


describe("Metropolis", function () {
    describe("Minting and Buying", function () {
        it("should mint Monopoly money to a player", async function () {
            const { Metropolis } = await setup();
            const [owner, player1] = await ethers.getSigners();

            // Mint 1000 Monopoly money to player1
            await Metropolis.mintMonopolyMoney(player1.address, 1000);

            expect(await Metropolis.getMonopolyMoneyBalance(player1.address)).to.equal(1000);
        });

        it("should allow a player to buy a property", async function () {
            const { Metropolis } = await setup();
            const [owner, player1] = await ethers.getSigners();

            // Add a property
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]);

            // Mint Monopoly money to player1
            await Metropolis.mintMonopolyMoney(player1.address, 1000);

            // Buy the property
            await Metropolis.connect(player1).buyProperty(1);

            // Check if the property is owned by player1
            expect(await Metropolis.balanceOf(player1.address, 1)).to.equal(1);

            // Check if the player's balance is updated
            expect(await Metropolis.getMonopolyMoneyBalance(player1.address)).to.equal(940);
        });

        it("should prevent buying a non-existent property", async function () {
            const { Metropolis } = await setup();
            const [owner, player1] = await ethers.getSigners();

            // Mint Monopoly money to player1
            await Metropolis.mintMonopolyMoney(player1.address, 1000);

            // Try to buy a non-existent property (ID 10)
            await expect(Metropolis.connect(player1).buyProperty(10)).to.be.revertedWith(
                "Property does not exist"
            );
        });

        it("should prevent buying a property with insufficient funds", async function () {
            const { Metropolis } = await setup();
            const [owner, player1] = await ethers.getSigners();

            // Add a property
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]);

            // Mint insufficient Monopoly money to player1
            await Metropolis.mintMonopolyMoney(player1.address, 50);

            // Try to buy the property
            await expect(Metropolis.connect(player1).buyProperty(1)).to.be.revertedWith(
                "Insufficient funds"
            );
        });
    });

    describe("Roles and Minting", function () {
        it("should have the minter role assigned to the deployer", async function () {
            const { Metropolis } = await setup();
            const [owner] = await ethers.getSigners();

            expect(await Metropolis.hasRole(Metropolis.METROPOLIS_MINTER_ROLE(), owner.address)).to.be.true;
        });

        it("should allow the minter to mint Monopoly money", async function () {
            const { Metropolis } = await setup();
            const [, player1] = await ethers.getSigners();

            // Mint 1000 Monopoly money to player1
            await Metropolis.mintMonopolyMoney(player1.address, 1000);

            expect(await Metropolis.balanceOf(player1.address, 0)).to.equal(1000);
        });

        it("should prevent non-minters from minting Monopoly money", async function () {
            const { Metropolis } = await setup();
            const [, , player2] = await ethers.getSigners(); // Get a non-minter account

            // Try to mint Monopoly money from player2 (non-minter)
            await expect(Metropolis.connect(player2).mintMonopolyMoney(player2.address, 1000))
                .to.be.revertedWith("Metropolis: must have minter role to mint");
        });
    });

    describe("Updating Property", function () {
        it("should allow the owner to update a property", async function () {
            const { Metropolis } = await setup();
        
            // Add a property with rent levels
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]); 
        
            // Update the property with new rent levels
            await Metropolis.updateProperty(1, "Updated Name", 100, [5, 25, 75, 225, 400, 625]); 
        
            const property = await Metropolis.properties(1);
            expect(property.name).to.equal("Updated Name");
            expect(property.price).to.equal(100);
        
            // Check the updated rent levels
            expect(await Metropolis.getRent(1, 0)).to.equal(5); 
            expect(await Metropolis.getRent(1, 1)).to.equal(25);
            expect(await Metropolis.getRent(1, 2)).to.equal(75);
            expect(await Metropolis.getRent(1, 3)).to.equal(225);
            expect(await Metropolis.getRent(1, 4)).to.equal(400);
            expect(await Metropolis.getRent(1, 5)).to.equal(625);
        });

        
        it("should prevent non-owners from updating a property", async function () {
            const { Metropolis } = await setup();
            const [, player1] = await ethers.getSigners();

            // Add a property
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]);

            // Try to update the property from a non-owner account
            await expect(Metropolis.connect(player1).updateProperty(1, "Updated Name", 100, [5, 25, 75, 225, 400, 625]))
                .to.be.revertedWithCustomError(Metropolis, "OwnableUnauthorizedAccount")  // Updated 
                .withArgs(player1.address); // Add expected arguments for the custom error
        });

        it("should prevent updating a non-existent property", async function () {
            const { Metropolis } = await setup();

            // Try to update a non-existent property (ID 10)
            await expect(Metropolis.updateProperty(10, "Updated Name", 100, [5, 25, 75, 225, 400, 625]))
                .to.be.revertedWith("Property does not exist");
        });
    });

    describe("Getting Properties", function () {
        it("should get an individual property by ID", async function () {
            const { Metropolis } = await setup();

            // Add some properties
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]);
            await Metropolis.addProperty("Baltic Avenue", 60, [4, 20, 60, 180, 320, 450]);

            // Get property with ID 1
            const property = await Metropolis.getProperty(1);

            expect(property.name).to.equal("Mediterranean Avenue");
            expect(property.price).to.equal(60);
            expect(property.rentLevels).to.deep.equal([2, 10, 30, 90, 160, 250]);
        });

        it("should revert when getting a non-existent property", async function () {
            const { Metropolis } = await setup();

            // Try to get a non-existent property (ID 5)
            await expect(Metropolis.getProperty(5)).to.be.revertedWith("Property does not exist");
        });

        it("should get all properties", async function () {
            const { Metropolis } = await setup();

            // Add some properties
            await Metropolis.addProperty("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250]);
            await Metropolis.addProperty("Baltic Avenue", 60, [4, 20, 60, 180, 320, 450]);
            await Metropolis.addProperty("Oriental Avenue", 100, [6, 30, 90, 270, 400, 550]);

            // Get all properties
            const properties = await Metropolis.getAllProperties();

            expect(properties.length).to.equal(3);
            expect(properties[0].name).to.equal("Mediterranean Avenue");
            expect(properties[1].name).to.equal("Baltic Avenue");
            expect(properties[2].name).to.equal("Oriental Avenue");
        });
    });

   
});