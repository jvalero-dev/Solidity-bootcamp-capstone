import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";

describe("FairLaunchpad", function () {
    let deployer: Signer, investor1: Signer, investor2: Signer, otherAccount: Signer;
    let projectToken: Contract;
    let launchpad: Contract;
    const investmentAmount = ethers.utils.parseEther("1");
    const rewardAmount = ethers.utils.parseEther("5");
    const maxInvestors = 3;

    // Setting up the stage before each test run
    beforeEach(async function () {
        [deployer, investor1, investor2, otherAccount] = await ethers.getSigners();
        const ProjectToken = await ethers.getContractFactory("MockERC20");
        projectToken = await ProjectToken.deploy("Project Token", "PTK", ethers.utils.parseEther("1000"));
        await projectToken.deployed();

        const Launchpad = await ethers.getContractFactory("FairLaunchpad");
        launchpad = await Launchpad.deploy(
            investmentAmount,
            rewardAmount,
            maxInvestors,
            projectToken.address
        );
        await launchpad.deployed();
    });

    // Tests to check if everything's set up right
    describe("Deployment", function () {
        it("should set the right owner", async function () {
            expect(await launchpad.owner()).to.equal(await deployer.getAddress());
        });
    });

    // Check to see if the launchpad starts as expected
    describe("Start the launchpad", function () {
        it("should start the launchpad correctly", async function () {
            await projectToken.approve(launchpad.address, rewardAmount.mul(maxInvestors));
            await expect(launchpad.start(100)).to.emit(launchpad, "LaunchpadStarted");
            expect(await launchpad.started()).to.equal(true);
        });
    });

    // Testing if investors can join without issues
    describe("Joining investors", function () {
        it("should let investors join", async function () {
            await projectToken.approve(launchpad.address, rewardAmount.mul(maxInvestors));
            await launchpad.start(100);
            await expect(() => launchpad.connect(investor1).join({ value: investmentAmount }))
                .to.changeEtherBalances([investor1, launchpad], [investmentAmount.mul(-1), investmentAmount]);
            expect(await launchpad.invested(await investor1.getAddress())).to.equal(true);
        });
    });

    // Checking the winner selection process
    describe("Choosing winners", function () {
        it("should choose winners after investment round is over", async function () {
            await projectToken.approve(launchpad.address, rewardAmount.mul(maxInvestors));
            await launchpad.start(100);
            await launchpad.connect(investor1).join({ value: investmentAmount });
            await ethers.provider.send("evm_mine", [await ethers.provider.getBlockNumber() + 101]);
            await expect(launchpad.chooseWinners()).to.emit(launchpad, "WinnersChosen");
        });
    });

    // Check if the investors  can redeem thier tokens or get refunds
    describe("Redeeming by investors", function () {
        it("should allow investors to redeem their tokens or get refunds", async function () {
            await projectToken.approve(launchpad.address, rewardAmount.mul(maxInvestors));
            await launchpad.start(100);
            await launchpad.connect(investor1).join({ value: investmentAmount });
            await ethers.provider.send("evm_mine", [await ethers.provider.getBlockNumber() + 101]);
            await launchpad.chooseWinners();
            const isChosen = await launchpad.isChosen(await investor1.getAddress());
            await expect(launchpad.connect(investor1).redeem())
                .to.emit(launchpad, isChosen ? "InvestorClaimedTokens" : "InvestorRecoveredInvestment");
        });
    });

    // test if the owner can reclaim any leftovers
    describe("Owner redeeming", function () {
        it("should allow the owner to redeem leftover tokens and investments", async function () {
            await projectToken.approve(launchpad.address, rewardAmount.mul(maxInvestors));
            await launchpad.start(100);
            await ethers.provider.send("evm_mine", [await ethers.provider.getBlockNumber() + 101]);
            await launchpad.chooseWinners();
            await expect(launchpad.projectRedeem()).to.emit(launchpad, "OwnerRedeemsProject");
        });
    });
});
