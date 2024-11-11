
const hre = require("hardhat");
const { deployments, getNamedAccounts } = hre;
const { ethers_hardhat } = require('hardhat');
import { ethers } from "hardhat";
const timers = require('timers-promises')
import fs from 'fs';



async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  //let accounts = await ethers_hardhat.getSigners()


  //const deployer = accounts[0].address
  //const accounts = await getNamedAccounts();
  //console.log("deployer address: ", accounts.deployer)

  let token_contract;

  const token_Factory = await hre.ethers.getContractFactory("Metropolis");
  console.log("network name", hre.network.name)
  const providerAddress = hre.network.config.url
  const provider = new ethers.JsonRpcProvider(providerAddress);;

  if (hre.network.name == 'localhost') {
    // const TOKEN_proxyFactory = await ethers.getContractFactory("NVMToken");
    // token_contract = await upgrades.deployProxy(TOKEN_proxyFactory, ['300000000000000000000000000'], { initializer: "__initializeNVM" });
    token_contract = await ethers.getContract("Metropolis");
    //providerAddress = 'http://localhost:8545'
  } else if (hre.network.name == 'testnet') {
    console.log("on testnet")
    token_contract = await token_Factory.attach("")

  } else if (hre.network.name == 'mainnet') {
    console.log("on mainnet")
    token_contract = await token_Factory.attach("")

  }
  console.log("token_contract address: ", token_contract.target)

  const gameBlocks = JSON.parse(fs.readFileSync('../backend/shared/data/gameBlocks.json', 'utf8'));
  let counter = 0;

  // Add properties from JSON data
  for (const block of gameBlocks) {
    if (block.type === 'AVENUE' || block.type === 'RAILROAD' || block.type === 'ELECTRIC' || block.type === 'WATER') {
      

      // Check if property already exists on the contract
      const propertyExists = await checkPropertyExists(token_contract, block.name);

      if (propertyExists) {
        console.log(`Property ${block.name} already exists on the contract. Skipping...`);
        continue;
      }

      try {
        if (counter >= 3) {
          console.log(`Simulating a fail for property ${block.name}`);
          throw new Error("Simulated transaction failure");
        }
        const txResult = await token_contract.addProperty(
          block.name,
          block.price,
          block.baserent ? [block.baserent, block.rent1, block.rent2, block.rent3, block.rent4, block.rent5] : [] ,
        );
        console.log("waiting for transaction to complete", txResult)
        await waitUntilTransactionMined(txResult.hash, provider)
        await timers.setTimeout(1000);
      } catch (error) {
        console.error(`Error adding property ${block.name}:`, error);
      }
    }
  }

}

async function checkPropertyExists(contract, propertyName) {
  try {
    // Get all properties from the contract
    const allProperties = await contract.getAllProperties();

    // Check if a property with the given name exists
    for (const property of allProperties) {
      if (property.name === propertyName) {
        return true; // Property exists
      }
    }

    return false; // Property does not exist
  } catch (error) {
    console.error("Error checking property existence:", error);
    throw error; // Re-throw the error 
  }
}

function checkTransactionStatus(transactionHash, provider) {
  return new Promise((resolve, reject) => {
    provider.getTransactionReceipt(transactionHash)
      .then((receipt) => {
        if (receipt && receipt.status === 1) {
          console.log('Transaction completed successfully!');
          console.log('Gas used:', receipt.gasUsed.toString());
          console.log('Transaction hash:', receipt.transactionHash);
          console.log('Block number:', receipt.blockNumber);
          console.log('Block timestamp:', receipt.timestamp);
          // You can access more properties of the receipt, if needed
          resolve(receipt.status); // Resolve the promise with the receipt status
        } else if (receipt && receipt.status === 0) {
          console.log('Transaction failed!');
          resolve(receipt.status); // Resolve the promise with the receipt status
        } else {
          console.log('Transaction is still pending.');
          resolve(null); // Resolve the promise with null for pending status
        }
      })
      .catch((error) => {
        console.error('Error fetching transaction receipt:', error);
        reject(error); // Reject the promise if there's an error
      });
  });
}



async function waitUntilTransactionMined(transactionHash, provider) {
  let transactionStatus = null;
  while (transactionStatus == null) {
    try {
      transactionStatus = await checkTransactionStatus(transactionHash, provider);
      console.log("Transaction status:", transactionStatus);
      await timers.setTimeout(5000);
      console.log("Waited 5 seconds.");
    } catch (error) {
      console.error('Error checking transaction status:', error);
      break; // Exit the loop if there's an error to avoid infinite loop
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
