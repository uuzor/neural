// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface INeuralCreatorTrading {
    function tradingAgents(address agent) external view returns (
        address creator,
        string memory strategyName,
        uint256 alignmentScore,
        uint256 totalVolume,
        int256 totalPnL,
        bool isActive,
        uint256 createdAt
    );
}

contract RevenueSharing is Ownable {
    struct RevenueShare {
        uint256 creatorShare;    // 70%
        uint256 developerShare;  // 15%
        uint256 nodeShare;       // 10%
        uint256 platformShare;   // 5%
    }

    RevenueShare public shares = RevenueShare({
        creatorShare: 70,
        developerShare: 15,
        nodeShare: 10,
        platformShare: 5
    });

    address public tradingContract;
    address public platformTreasury;
    mapping(address => uint256) public creatorEarnings;
    mapping(address => uint256) public developerEarnings;
    mapping(address => uint256) public nodeEarnings;

    event RevenueDistributed(address indexed agent, uint256 total, uint256 creatorAmount, uint256 developerAmount, uint256 nodeAmount, uint256 platformAmount);
    event TradingContractUpdated(address indexed trading);
    event PlatformTreasuryUpdated(address indexed treasury);

    constructor(address _trading, address _platformTreasury) {
        tradingContract = _trading;
        platformTreasury = _platformTreasury;
    }

    function setTradingContract(address _trading) external onlyOwner {
        tradingContract = _trading;
        emit TradingContractUpdated(_trading);
    }

    function setPlatformTreasury(address _treasury) external onlyOwner {
        platformTreasury = _treasury;
        emit PlatformTreasuryUpdated(_treasury);
    }

    function setShares(uint256 creator, uint256 developer, uint256 node, uint256 platform) external onlyOwner {
        require(creator + developer + node + platform == 100, "Shares must sum to 100");
        shares = RevenueShare(creator, developer, node, platform);
    }

    // Called by trading contract when fees are accrued
    function recordRevenue(address agent, uint256 totalRevenue) external {
        require(msg.sender == tradingContract, "Only trading contract");

        (address creator,,,,,,) = INeuralCreatorTrading(tradingContract).tradingAgents(agent);

        uint256 creatorAmount = (totalRevenue * shares.creatorShare) / 100;
        uint256 developerAmount = (totalRevenue * shares.developerShare) / 100;
        uint256 nodeAmount = (totalRevenue * shares.nodeShare) / 100;
        uint256 platformAmount = (totalRevenue * shares.platformShare) / 100;

        creatorEarnings[creator] += creatorAmount;

        // Simplified: developer equals creator in v1
        developerEarnings[creator] += developerAmount;

        // Node distribution pooled; distribution to individual nodes can be handled off-chain or by a separate claim function
        nodeEarnings[address(0)] += nodeAmount;

        // Transfer to platform treasury if set; funds are virtual in v1 since we do not handle ERC20 flows here
        // In production, this contract should be ERC20-aware and receive protocol fees in token.
        emit RevenueDistributed(agent, totalRevenue, creatorAmount, developerAmount, nodeAmount, platformAmount);
    }
}