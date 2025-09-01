// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IRevenueSharing {
    function recordRevenue(address agent, uint256 amount) external;
}

contract NeuralCreatorTrading is Ownable, ReentrancyGuard {
    struct TradingAgent {
        address creator;
        string strategyName;
        uint256 alignmentScore;
        uint256 totalVolume;
        int256 totalPnL;
        bool isActive;
        uint256 createdAt;
    }

    struct Trade {
        address agent;
        address asset;
        uint256 amount;
        uint256 price;
        bool isBuy;
        uint256 timestamp;
        bytes32 aiDecisionHash;
    }

    mapping(address => TradingAgent) public tradingAgents;
    mapping(address => Trade[]) public tradeHistory;
    mapping(address => uint256) public alignmentScores;
    mapping(address => bool) public isAlignmentNode;

    IRevenueSharing public revenueContract;

    event AgentCreated(address indexed agent, address indexed creator, string strategy);
    event TradeExecuted(address indexed agent, address indexed asset, uint256 amount, uint256 price, bool isBuy, bytes32 aiDecisionHash);
    event AlignmentScoreUpdated(address indexed agent, uint256 newScore);
    event AgentPaused(address indexed agent, string reason);
    event AlignmentNodeUpdated(address indexed node, bool allowed);

    modifier onlyAlignedAgent(address agent) {
        require(alignmentScores[agent] >= 80, "Agent not properly aligned");
        require(tradingAgents[agent].isActive, "Agent is not active");
        _;
    }

    modifier onlyAlignmentNode() {
        require(isAlignmentNode[msg.sender], "Only alignment nodes");
        _;
    }

    constructor() {
        // Owner can later assign alignment nodes
    }

    function setRevenueContract(address _revenue) external onlyOwner {
        revenueContract = IRevenueSharing(_revenue);
    }

    function setAlignmentNode(address node, bool allowed) external onlyOwner {
        isAlignmentNode[node] = allowed;
        emit AlignmentNodeUpdated(node, allowed);
    }

    function createTradingAgent(
        string memory strategyName
    ) external returns (address agentAddress) {
        // v1: model agents by a pseudo-address derived from creator+nonce
        // For simplicity we use msg.sender as key to a single agent instance.
        // Multi-agent per user can be modeled with an emitted event and off-chain indexing.
        agentAddress = address(uint160(uint256(keccak256(abi.encodePacked(msg.sender, strategyName, block.timestamp, block.prevrandao)))));
        require(tradingAgents[agentAddress].createdAt == 0, "Agent exists");

        tradingAgents[agentAddress] = TradingAgent({
            creator: msg.sender,
            strategyName: strategyName,
            alignmentScore: 100,
            totalVolume: 0,
            totalPnL: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        alignmentScores[agentAddress] = 100;

        emit AgentCreated(agentAddress, msg.sender, strategyName);
    }

    function executeTrade(
        address agent,
        address asset,
        uint256 amount,
        uint256 price,
        bool isBuy,
        bytes32 aiDecisionHash,
        bytes calldata aiProof // opaque proof bytes; verified off-chain/TEE and referenced by hash
    ) external onlyAlignedAgent(agent) nonReentrant {
        // Minimal on-chain validation. Off-chain service must verify aiProof and provide aiDecisionHash commitment.
        require(tradingAgents[agent].createdAt != 0, "Unknown agent");
        require(amount > 0 && price > 0, "Invalid trade");

        // Record trade
        tradeHistory[agent].push(Trade({
            agent: agent,
            asset: asset,
            amount: amount,
            price: price,
            isBuy: isBuy,
            timestamp: block.timestamp,
            aiDecisionHash: aiDecisionHash
        }));

        // Update stats
        tradingAgents[agent].totalVolume += amount;

        emit TradeExecuted(agent, asset, amount, price, isBuy, aiDecisionHash);

        // Optional: account revenue for distribution (simplified: fee = 10 bps of notional)
        uint256 fee = (amount * price) / 10000;
        if (address(revenueContract) != address(0) && fee > 0) {
            revenueContract.recordRevenue(agent, fee);
        }
    }

    function reportAlignmentViolation(
        address agent,
        bytes calldata /* evidence */,
        uint256 severityScore
    ) external onlyAlignmentNode {
        uint256 currentScore = alignmentScores[agent];
        uint256 penalty = severityScore * 10;

        if (currentScore <= penalty) {
            alignmentScores[agent] = 0;
            tradingAgents[agent].isActive = false;
            emit AgentPaused(agent, "Critical alignment violation");
        } else {
            uint256 newScore = currentScore - penalty;
            alignmentScores[agent] = newScore;
            emit AlignmentScoreUpdated(agent, newScore);
        }
    }

    function emergencyPause(address agent, string calldata reason) external onlyOwner {
        require(tradingAgents[agent].isActive, "Already paused");
        tradingAgents[agent].isActive = false;
        emit AgentPaused(agent, reason);
    }
}