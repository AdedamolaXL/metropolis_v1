import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

 console.log("deploying wallet: ",deployer)

  // 3. Deploy Metropolis contract (no constructor arguments needed)
  await deploy("Metropolis", {
    from: deployer,
    log: true,
  });

  // Get the deployed contracts
  const Metropolis = await ethers.getContract("Metropolis");
console.log(Metropolis)

  console.log("Metropolis deployed at:", Metropolis.target);
};

export default func;
func.tags = ["Metropolis"];