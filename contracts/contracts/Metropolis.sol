// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol"; // Import AccessControl

contract Metropolis is ERC1155, Ownable, AccessControl {   

    //METROPOLIS_MINTER_ROLE = 0x88592bd859ec73467bb601bed348ec50edf7f514e3272e8cfd9e1d3f5aa0b677
    bytes32 public constant METROPOLIS_MINTER_ROLE = keccak256("METROPOLIS_MINTER_ROLE");

    uint256 private _currentTokenId = 1; // Start token IDs from 1

    uint256 public constant MONOPOLY_MONEY_ID = 0; 

    // Property struct
    struct Property {
        string name;
        uint256 price;
        uint256 rent;
    }

    mapping(uint256 => Property) public properties;

    event PropertyPurchased(address player, uint256 propertyId);

    constructor() ERC1155("ipfs://") Ownable(msg.sender) {
        _grantRole(METROPOLIS_MINTER_ROLE, _msgSender()); // Grant the minter role to the deployer
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mintMonopolyMoney(address to, uint256 amount) public {
        require(hasRole(METROPOLIS_MINTER_ROLE, _msgSender()), "Metropolis: must have minter role to mint");
        _mint(to, MONOPOLY_MONEY_ID, amount, "");
    }

    // Function to get a player's Monopoly money balance
    function getMonopolyMoneyBalance(address player) public view returns (uint256) {
        return balanceOf(player, MONOPOLY_MONEY_ID); // Correct balanceOf usage

    }

    function buyProperty(uint256 propertyId) external {
        require(
            keccak256(abi.encodePacked(properties[propertyId].name)) != keccak256(abi.encodePacked("")),
            "Property does not exist"
        );
        require(
            balanceOf(msg.sender, MONOPOLY_MONEY_ID) >= properties[propertyId].price,
            "Insufficient funds"
        );

        _burn(msg.sender, MONOPOLY_MONEY_ID, properties[propertyId].price);
        _mint(msg.sender, propertyId, 1, "");

        emit PropertyPurchased(msg.sender, propertyId);
    }

    function getRent(uint256 propertyId) public view returns (uint256) {
        return properties[propertyId].rent;
    }

    function addProperty(
        string memory name,
        uint256 price,
        uint256 rent
    ) public onlyOwner {
        uint256 tokenId = _currentTokenId; // Use the current token ID
        _currentTokenId++; // Increment for the next property

        properties[tokenId] = Property({
            name: name,
            price: price,
            rent: rent
        });
    }


    // Override supportsInterface function
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}