// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FairLaunchpad is Ownable {
	using SafeMath for uint256;

	event LaunchpadStarted();

	event InvestorJoined(address indexed investor);

	event InvestorClaimedTokens(address indexed investor, uint256 amount);

	event InvestorRecoveredInvestment(
		address indexed investor,
		uint256 investmentAmount
	);

	event OwnerRedeemsProject(address indexed owner);

	event WinnersChosen(uint256 investors, uint256 candidates);

	bool public started;

	uint256 public investmentAmount;
	uint256 public rewardAmount;

	uint256 public maxInvestors;
	uint256 public endBlock;

	bool public winnersChosen;
	bool public projectRedeemed;

	mapping(address => bool) public invested;
	mapping(address => bool) public isChosen;

	address[] private candidates;

	IERC20 public projectToken;

	constructor(
		uint256 _investmentAmount,
		uint256 _rewardAmount,
		uint256 _maxInvestors,
		IERC20 _projectToken
	) Ownable() {
		investmentAmount = _investmentAmount;
		rewardAmount = _rewardAmount;
		maxInvestors = _maxInvestors;
		winnersChosen = false;
		projectRedeemed = false;
		projectToken = _projectToken;

		started = false;
	}

	modifier postStarted() {
		require(started, "Launchpad not initialized");
		_;
	}

	modifier postWinnersChosen() {
		require(winnersChosen, "Winners not chosen yet");
		_;
	}

	function start(uint256 _durationBlocks) external onlyOwner {
		require(!started, "Already started");
		started = true;
		endBlock = block.number + _durationBlocks;
		require(
			projectToken.transferFrom(
				msg.sender,
				address(this),
				rewardAmount.mul(maxInvestors)
			),
			"Token transfer failed"
		);
		emit LaunchpadStarted();
	}

	function join() external payable postStarted {
		require(block.number < endBlock, "Investment round is over");
		require(msg.value == investmentAmount, "Invalid investment amount");
		require(!invested[msg.sender], "Already joined");

		invested[msg.sender] = true;
		candidates.push(msg.sender);
		emit InvestorJoined(msg.sender);
	}

	function chooseWinners() external postStarted {
		require(block.number >= endBlock, "Too early to choose winners");
		require(!winnersChosen, "Winners already chosen");
		require(candidates.length > 0, "No candidates to choose from");

		winnersChosen = true;

		address[] memory tempCandidates = candidates;
		uint256 candidateCount = tempCandidates.length;
		uint256 randomSeed = uint256(block.prevrandao);

		for (uint256 i = 0; i < maxInvestors && candidateCount > 0; i++) {
			uint256 idx = uint256(keccak256(abi.encode(randomSeed, i))) %
				candidateCount;
			address winner = tempCandidates[idx];

			isChosen[winner] = true;

			tempCandidates[idx] = tempCandidates[candidateCount - 1];
			candidateCount--;
		}
		emit WinnersChosen(maxInvestors, candidates.length);
	}

	function redeem() external postWinnersChosen {
		require(
			invested[msg.sender],
			"No investments made or already redeemed"
		);

		invested[msg.sender] = false;

		if (isChosen[msg.sender]) {
			require(
				projectToken.transfer(msg.sender, rewardAmount),
				"Token transfer failed"
			);
			emit InvestorClaimedTokens(msg.sender, rewardAmount);
		} else {
			require(
				payable(msg.sender).send(investmentAmount),
				"Refund failed"
			);
			emit InvestorRecoveredInvestment(msg.sender, investmentAmount);
		}
	}

	function projectRedeem() external onlyOwner postWinnersChosen {
		require(
			winnersChosen,
			"Redeeming not possible before choosing winners"
		);
		require(!projectRedeemed, "Already redeemed");

		projectRedeemed = true;

		if (candidates.length < maxInvestors) {
			require(
				projectToken.transfer(
					msg.sender,
					(maxInvestors - candidates.length) * rewardAmount
				),
				"Token transfer failed"
			);
		}

		if (candidates.length > 0) {
			uint256 investorsCount = maxInvestors <= candidates.length
				? maxInvestors
				: candidates.length;

			require(
				payable(msg.sender).send(investorsCount * investmentAmount),
				"Refund failed."
			);
		}

		emit OwnerRedeemsProject(msg.sender);
	}

	function getCandidatesCount()
		public
		view
		returns (uint256 candidatesNumber)
	{
		candidatesNumber = candidates.length;
	}
}
