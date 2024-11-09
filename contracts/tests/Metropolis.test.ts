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
            await Metropolis.addProperty("Mediterranean Avenue", 60, 2);

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
            await Metropolis.addProperty("Mediterranean Avenue", 60, 2);

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
            const [owner, player1] = await ethers.getSigners();

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

   
});