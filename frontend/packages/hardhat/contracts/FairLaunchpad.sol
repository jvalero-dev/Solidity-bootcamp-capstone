// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FairLaunchpad is Ownable {
    using SafeMath for uint256;

    uint256 public investmentAmount;
    uint256 public rewardAmount;

    uint256 public maxInvestors;
    uint256 public endBlock;

    bool public winnersChosen;

    mapping(address => bool) public invested;
    mapping(address => bool) public isChosen;

    address[] private candidates;

    IERC20 public projectToken;
    bool public projectRedeemed;

    constructor(uint256 _investmentAmount, uint256 _rewardAmount, uint256 _maxInvestors, uint256 _durationBlocks, IERC20 _projectToken) {
        investmentAmount = _investmentAmount;
        rewardAmount = _rewardAmount;
        maxInvestors = _maxInvestors;
        endBlock = block.number + _durationBlocks;
        winnersChosen = false;
        projectToken = _projectToken;
        require(projectToken.transfer(address(this), rewardAmount * maxInvestors), "Token transfer failed");
        projectRedeemed = false;
    }

    function join() external payable {
        require(block.number < endBlock, "Investment round is over");
        require(msg.value == investmentAmount, "Invalid investment amount");
        require(!invested[msg.sender], "Already invested");

        invested[msg.sender] = true;
        candidates.push(msg.sender);
    }

    function chooseWinners() external {
        require(block.number >= endBlock + 100, "Too early to choose winners");
        require(!winnersChosen, "Winners already chosen");
        require(candidates.length > 0, "No candidates to choose from");

        winnersChosen = true;

        address[] memory memoryCandidates = candidates;
        uint256 candidateCount = memoryCandidates.length;
        uint256 randomSeed = uint256(block.prevrandao);

        uint256 idx;
        for (uint256 i = 0; i < maxInvestors && candidateCount > 0; i++) {
            idx = uint256(keccak256(abi.encode(randomSeed, i))) % candidateCount;

            address winner = memoryCandidates[idx];
            isChosen[winner] = true;

            memoryCandidates[idx] = memoryCandidates[candidateCount - 1];
            candidateCount--;
        }
    }

    function redeem() external {
        require(block.number < endBlock || block.number >= endBlock + 100, "Redeeming not possible between investment round and choosing winners");
        require(invested[msg.sender], "No investments made or already redeemed");
        invested[msg.sender] = false;

        if (isChosen[msg.sender]) {
            require(projectToken.transfer(msg.sender, rewardAmount), "Token transfer failed");
        } else {
            require(payable(msg.sender).send(investmentAmount), "Refund failed");
        }
    }

    function projectRedeemUnsoldTokens() external onlyOwner {
        require(block.number >= endBlock + 100, "Redeeming not possible before choosing winners");
        require(!projectRedeemed, "Already redeemed");
        require(candidates.length < maxInvestors, "All tokens sold out");
        projectRedeemed = true;
        require(projectToken.transfer(msg.sender, (maxInvestors - candidates.length) * rewardAmount), "Token transfer failed");
    }
}
