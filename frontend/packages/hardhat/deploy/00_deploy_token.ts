import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers";
import fs from "fs";

const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const { deploy } = hre.deployments;

  const initialTokenSupply = parseEther('1000000'); // Initial supply for MyToken in wei

  const tokenDeployment = await deploy("MyToken", {
    from: deployer,
    args: [initialTokenSupply],
    log: true,
    autoMine: true,
  });

  const tokenAddress = tokenDeployment.address;

  fs.writeFileSync("tokenAddress.txt", tokenAddress);
  console.log("Token deployed at:", tokenAddress);
}

export default deployToken;

deployToken.tags = ["Token"];