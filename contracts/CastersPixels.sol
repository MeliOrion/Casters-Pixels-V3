// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CastersPixels {
    uint256 public constant GENERATION_COST = 1000 ether; // 1000 CASTER tokens
    uint256 public constant LEGENDARY_CHANCE = 5; // 5% chance
    uint256 private constant WINNER_SHARE = 50; // 50% to winner
    uint256 private constant BURN_SHARE = 20;   // 20% to burn
    // 30% remains in pool

    uint256 public prizePool;
    address public immutable lpWallet;
    address public immutable casterToken;

    event GenerationRequested(address indexed user);
    event GenerationComplete(address indexed user, bool isLegendary, uint256 reward);
    event PrizePoolUpdated(uint256 newAmount);

    constructor(address _casterToken, address _lpWallet) {
        require(_casterToken != address(0), "Invalid token address");
        require(_lpWallet != address(0), "Invalid LP wallet address");
        casterToken = _casterToken;
        lpWallet = _lpWallet;
    }

    function requestGeneration() external {
        // Cache token interface to save gas
        IERC20 token = IERC20(casterToken);
        require(token.balanceOf(msg.sender) >= GENERATION_COST, "Insufficient CASTER balance");
        
        // Transfer CASTER tokens from user
        require(token.transferFrom(msg.sender, address(this), GENERATION_COST), "Transfer failed");
        
        // Calculate amounts
        uint256 burnAmount = (GENERATION_COST * BURN_SHARE) / 100;
        uint256 prizeAmount = GENERATION_COST - burnAmount;
        
        // Transfer burn amount to LP wallet
        require(token.transfer(lpWallet, burnAmount), "Burn transfer failed");
        
        // Add remaining to prize pool
        prizePool += prizeAmount;
        
        emit GenerationRequested(msg.sender);
        
        // Determine if legendary (5% chance)
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            msg.sender
        ))) % 100;
        
        bool isLegendary = randomNumber < LEGENDARY_CHANCE;
        uint256 reward = 0;
        
        if (isLegendary) {
            reward = (prizePool * WINNER_SHARE) / 100;
            prizePool -= reward;
            require(token.transfer(msg.sender, reward), "Reward transfer failed");
        }
        
        emit GenerationComplete(msg.sender, isLegendary, reward);
        emit PrizePoolUpdated(prizePool);
    }
}
