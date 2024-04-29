import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployLaunchpad: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Launchpad", {
    from: deployer,
    log: true,
    autoMine: true,
  });
};

export default deployLaunchpad;

deployLaunchpad.tags = ["Launchpad"];