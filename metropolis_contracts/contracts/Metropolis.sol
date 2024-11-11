// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol"; // Import AccessControl

contract Metropolis is ERC1155, Ownable, AccessControl {
	//METROPOLIS_MINTER_ROLE = 0x88592bd859ec73467bb601bed348ec50edf7f514e3272e8cfd9e1d3f5aa0b677
	bytes32 public constant METROPOLIS_MINTER_ROLE =
		keccak256("METROPOLIS_MINTER_ROLE");

	uint256 private _currentTokenId = 1; // Start token IDs from 1

	uint256 public constant MONOPOLY_MONEY_ID = 0;

	// Property struct
	struct Property {
		string name;
		uint256 price;
		uint256[] rentLevels;
	}

	mapping(uint256 => Property) public properties;

	event PropertyPurchased(address player, uint256 propertyId);
	event PropertyAdded(uint256 propertyId, string name); // Define the event

	constructor() ERC1155("ipfs://") Ownable(msg.sender) {
		_grantRole(METROPOLIS_MINTER_ROLE, _msgSender()); // Grant the minter role to the deployer
	}

	function setURI(string memory newuri) public onlyOwner {
		_setURI(newuri);
	}

	function mintMonopolyMoney(address to, uint256 amount) public {
		require(
			hasRole(METROPOLIS_MINTER_ROLE, _msgSender()),
			"Metropolis: must have minter role to mint"
		);
		_mint(to, MONOPOLY_MONEY_ID, amount, "");
	}

	// Function to get a player's Monopoly money balance
	function getMonopolyMoneyBalance(
		address player
	) public view returns (uint256) {
		return balanceOf(player, MONOPOLY_MONEY_ID); // Correct balanceOf usage
	}

	function buyProperty(uint256 propertyId) external {
		require(
			keccak256(abi.encodePacked(properties[propertyId].name)) !=
				keccak256(abi.encodePacked("")),
			"Property does not exist"
		);
		require(
			balanceOf(msg.sender, MONOPOLY_MONEY_ID) >=
				properties[propertyId].price,
			"Insufficient funds"
		);

		_burn(msg.sender, MONOPOLY_MONEY_ID, properties[propertyId].price);
		_mint(msg.sender, propertyId, 1, "");

		emit PropertyPurchased(msg.sender, propertyId);
	}

	function getRent(
		uint256 propertyId,
		uint256 level
	) public view returns (uint256) {
		require(
			keccak256(abi.encodePacked(properties[propertyId].name)) !=
				keccak256(abi.encodePacked("")),
			"Property does not exist"
		);
		require(
			level < properties[propertyId].rentLevels.length,
			"Invalid rent level"
		);
		return properties[propertyId].rentLevels[level];
	}

	function addProperty(
		string memory name,
		uint256 price,
		uint256[] memory rentLevels
	) public onlyOwner {
		uint256 tokenId = _currentTokenId;
		_currentTokenId++;

		properties[tokenId] = Property({
			name: name,
			price: price,
			rentLevels: rentLevels // Store the rent levels array
		});
		emit PropertyAdded(tokenId, name); // Emit the event with property ID and name
	}

	function updateProperty(
		uint256 propertyId,
		string memory name,
		uint256 price,
		uint256[] memory rentLevels
	) public onlyOwner {
		require(
			keccak256(abi.encodePacked(properties[propertyId].name)) !=
				keccak256(abi.encodePacked("")),
			"Property does not exist"
		);

		properties[propertyId] = Property({
			name: name,
			price: price,
			rentLevels: rentLevels
		});
	}

	// Function to get an individual property by ID
	function getProperty(
		uint256 propertyId
	) public view returns (Property memory) {
		require(
			keccak256(abi.encodePacked(properties[propertyId].name)) !=
				keccak256(abi.encodePacked("")),
			"Property does not exist"
		);
		return properties[propertyId];
	}

	// Function to get all properties
	function getAllProperties() public view returns (Property[] memory) {
		uint256 totalProperties = _currentTokenId - 1; // Exclude token ID 0 (Monopoly money)
		Property[] memory allProps = new Property[](totalProperties);

		for (uint256 i = 1; i <= totalProperties; i++) {
			allProps[i - 1] = properties[i];
		}

		return allProps;
	}

	// Override supportsInterface function
	function supportsInterface(
		bytes4 interfaceId
	) public view virtual override(ERC1155, AccessControl) returns (bool) {
		return super.supportsInterface(interfaceId);
	}
}
