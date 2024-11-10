
const hre = require("hardhat");
const { deployments, getNamedAccounts } = hre;
const { ethers_hardhat } = require('hardhat');
const ethers = require("ethers");
const { BN } = require('@openzeppelin/test-helpers');
import { func } from '../deploy/00_deploy_your_contract.ts';
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

  if (hre.network.name == 'hardhat') {
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

/*
  for (const whitelistAddress of whitelistAddresses) {
    console.log(`Whitelisting address: ${whitelistAddress}`);
    const txResult = await token_contract.grantRole(FEE_EXCLUDED_ROLE, whitelistAddress);
    console.log("waiting for transaction to complete", txResult)
    await waitUntilTransactionMined(txResult.hash, provider)
    await timers.setTimeout(5000);
    console.log("has whitelist role: ", await token_contract.hasRole(FEE_EXCLUDED_ROLE, whitelistAddress));
  }
*/
  const gameBlocks = JSON.parse(fs.readFileSync('../../backend/shared/data/gameBlocks.json', 'utf8'));

  // Add properties from JSON data
  for (const block of gameBlocks) {
    if (block.type === 'AVENUE' || block.type === 'RAILROAD' || block.type === 'ELECTRIC' || block.type === 'WATER') {
      await monopolyGameFactory.addProperty(
        block.name,
        block.price,
        [block.baserent, block.rent1, block.rent2, block.rent3, block.rent4, block.rent5],
      );
    }
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
