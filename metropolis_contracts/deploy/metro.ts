
import { ethers } from "hardhat";
async function main() {
  // Get the contract factory
  const Metropolis = await ethers.getContractFactory("MetropolisBase");

  // Deploy the contract
  console.log("Deploying Metropolis contract...");
  const metropolis = await Metropolis.deploy();

  // Wait for the deployment to complete
  await metropolis.waitForDeployment();
  const tx = await metropolis.deploymentTransaction();

  console.log("Metropolis deployed to:", metropolis.target, "transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
