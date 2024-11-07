import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();




  // 3. Deploy MonopolyGameFactory contract (no constructor arguments needed)
  await deploy("MonopolyGameFactory", {
    from: deployer,
    log: true,
  });

  // Get the deployed contracts
  const monopolyGameFactory = await ethers.getContract("MonopolyGameFactory");
console.log(monopolyGameFactory)

  console.log("MonopolyGameFactory deployed at:", monopolyGameFactory.target);
};

export default func;
func.tags = ["MonopolyGameFactory"];