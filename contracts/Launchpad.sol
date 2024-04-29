// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Launchpad is Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    event ProjectListed(
        uint256 indexed projectId,
        address indexed projectOwner,
        uint256 maxCap,
        uint256 endTimeInMinutes
    );

    event InvestmentMade(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amountInvested
    );

    struct IDOProject {
        address projectOwner;
        IERC20 token;
        uint256 maxCap;
        uint256 endTime;
        bool isActive;
        uint256 totalAmountRaised;
    }

    address public admin;
    uint256 private projectIdCounter;
    mapping(uint256 => IDOProject) public projects;
    mapping(uint256 => mapping(address => uint256)) public investments;

    constructor() {
        admin = msg.sender;
    }

    function listProject(
        IERC20 token,
        uint256 maxCap,
        uint256 endTimeInMinutes
    ) external whenNotPaused {
        require(token != IERC20(address(0)), "Invalid token address");
        require(maxCap > 0, "MaxCap must be positive");
        require(endTimeInMinutes > block.timestamp, "End time must be in the future");

        projectIdCounter += 1;
        projects[projectIdCounter] = IDOProject({
            projectOwner: msg.sender,
            token: token,
            maxCap: maxCap,
            endTime: endTimeInMinutes * 1 minutes + block.timestamp,
            isActive: true,
            totalAmountRaised: 0
        });

        emit ProjectListed(projectIdCounter, msg.sender, maxCap, endTimeInMinutes);
    }

    function invest(uint256 projectId) external payable whenNotPaused {
        IDOProject storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(block.timestamp <= project.endTime, "Project ended");
        require(msg.value > 0 && msg.value <= project.maxCap, "Investment out of allowed range");

        project.totalAmountRaised = project.totalAmountRaised.add(msg.value);
        investments[projectId][msg.sender] = investments[projectId][msg.sender].add(msg.value);

        emit InvestmentMade(projectId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 projectId) external nonReentrant {
        IDOProject storage project = projects[projectId];
        require(msg.sender == project.projectOwner, "Not project owner");
        require(block.timestamp > project.endTime, "Project still in progress");
        require(project.totalAmountRaised > 0, "No funds to withdraw");

        uint256 amount = project.totalAmountRaised;
        project.totalAmountRaised = 0;
        payable(msg.sender).transfer(amount);
    }

    function pause() external {
        require(msg.sender == admin, "Unauthorized");
        _pause();
    }

    function unpause() external {
        require(msg.sender == admin, "Unauthorized");
        _unpause();
    }

    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "Unauthorized");
        require(newAdmin != address(0), "Invalid new admin");
        admin = newAdmin;
    }
}
