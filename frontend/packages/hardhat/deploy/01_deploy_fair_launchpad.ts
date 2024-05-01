import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";


const deployLaunchpad: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
 
    const tokenAddress = fs.readFileSync("tokenAddress.txt", "utf-8");

    const tokenContract = await ethers.getContractAt("MyToken", tokenAddress);
    const deployerBalance = await tokenContract.balanceOf(deployer);
    console.log("Deployer Token Balance:", deployerBalance.toString());
 
    const investmentAmount = parseEther('0.1'); // Ether investment amount for Launchpad in wei
    const rewardAmount = parseEther('10'); // Reward amount in tokens in wei
    const maxInvestors = 5; // Maximum number of investors for the Launchpad
    const durationBlocks = 100; // Duration in blocks for the Launchpad investment round
 
    const launchpadDeployment = await deploy("FairLaunchpad", {
        from: deployer,
        args: [
          investmentAmount,
          rewardAmount,
          maxInvestors,
          tokenAddress
        ],
        log: true,
        autoMine: true,  
    });
    const launchpadAddress = launchpadDeployment.address;
    const launchpadContract = await ethers.getContractAt("FairLaunchpad", launchpadAddress);

    await tokenContract.approve(launchpadAddress, rewardAmount * BigInt(maxInvestors))
    
    await launchpadContract.start(durationBlocks);

    const launchpadBalance = await tokenContract.balanceOf(launchpadAddress);
    console.log("Launchpad Token Balance:", launchpadBalance.toString());

    fs.unlinkSync("tokenAddress.txt");
}

export default deployLaunchpad;

deployLaunchpad.tags = ["FairLaunchpad"];