// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MetropolisBase {
    mapping(uint256 => address) public propertyOwners; // Tracks property ownership
    mapping(address => uint256) public balances; // Tracks player balances

    address public gameOwner;

    event PropertyPurchased(uint256 indexed propertyId, address indexed buyer, uint256 price);
    event RentPaid(uint256 indexed propertyId, address indexed tenant, address indexed landlord, uint256 amount);
    event FundsMinted(address indexed player, uint256 amount);

    modifier onlyGameOwner() {
        require(msg.sender == gameOwner, "Only the game owner can perform this action");
        _;
    }

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(propertyOwners[propertyId] == msg.sender, "You do not own this property");
        _;
    }

    constructor() {
        gameOwner = msg.sender;
    }

    // Mint starting funds for players
    function mintFunds(address player, uint256 amount) external onlyGameOwner {
        require(player != address(0), "Invalid player address");
        balances[player] += amount;

        emit FundsMinted(player, amount);
    }

    // Buy a property (price provided by frontend)
    function buyProperty(uint256 propertyId, uint256 price) external {
        require(propertyOwners[propertyId] == address(0), "Property already owned");
        require(balances[msg.sender] >= price, "Insufficient funds");

        // Deduct funds from buyer
        balances[msg.sender] -= price;

        // Transfer ownership
        propertyOwners[propertyId] = msg.sender;

        emit PropertyPurchased(propertyId, msg.sender, price);
    }

    // Pay rent (amount provided by frontend)
    function payRent(uint256 propertyId, uint256 rentAmount) external {
        address landlord = propertyOwners[propertyId];
        require(landlord != address(0), "Property is not owned");
        require(landlord != msg.sender, "Cannot pay rent to yourself");
        require(balances[msg.sender] >= rentAmount, "Insufficient funds");

        // Transfer rent
        balances[msg.sender] -= rentAmount;
        balances[landlord] += rentAmount;

        emit RentPaid(propertyId, msg.sender, landlord, rentAmount);
    }

    // Withdraw funds (for property owners to cash out)
    function withdrawFunds() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");

        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Fallback function to prevent accidental ETH transfers
    receive() external payable {
        revert("Contract does not accept direct ETH transfers");
    }
}
