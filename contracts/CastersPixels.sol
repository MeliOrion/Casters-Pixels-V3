// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CastersPixels {
    uint256 public constant GENERATION_COST = 1000 ether; // 1000 CASTER tokens (assuming 18 decimals)
    uint256 public constant BLOCK_WAIT = 1; // Number of blocks to wait before generation
    uint256 public constant LEGENDARY_CHANCE = 5; // 5% chance

    uint256 public prizePool;
    address public immutable lpWallet;
    address public immutable casterToken;
    
    mapping(address => bool) public hasPendingGeneration;
    mapping(address => uint256) public userBlockNumber;

    event GenerationRequested(address indexed user, uint256 blockNumber);
    event GenerationComplete(address indexed user, bool isLegendary, uint256 reward);
    event PrizePoolUpdated(uint256 newAmount);

    constructor(address _casterToken, address _lpWallet) {
        require(_casterToken != address(0), "Invalid token address");
        require(_lpWallet != address(0), "Invalid LP wallet address");
        casterToken = _casterToken;
        lpWallet = _lpWallet;
    }

    function requestGeneration() external {
        require(!hasPendingGeneration[msg.sender], "Already has pending generation");
        require(IERC20(casterToken).balanceOf(msg.sender) >= GENERATION_COST, "Insufficient CASTER balance");
        
        // Transfer CASTER tokens from user
        require(IERC20(casterToken).transferFrom(msg.sender, address(this), GENERATION_COST), "Transfer failed");
        
        // Distribute tokens: 40% to LP wallet (burn), 60% to prize pool
        uint256 burnAmount = (GENERATION_COST * 40) / 100;
        uint256 prizeAmount = GENERATION_COST - burnAmount;
        
        require(IERC20(casterToken).transfer(lpWallet, burnAmount), "Burn transfer failed");
        prizePool += prizeAmount;

        // Mark generation as pending
        hasPendingGeneration[msg.sender] = true;
        userBlockNumber[msg.sender] = block.number;

        emit GenerationRequested(msg.sender, block.number);
        emit PrizePoolUpdated(prizePool);
    }

    function completeGeneration() external {
        require(hasPendingGeneration[msg.sender], "No pending generation");
        require(block.number > userBlockNumber[msg.sender] + BLOCK_WAIT, "Must wait for blocks");

        // Use block hash for randomness
        bytes32 blockHash = blockhash(userBlockNumber[msg.sender]);
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(blockHash, msg.sender))) % 100;
        
        bool isLegendary = randomNumber < LEGENDARY_CHANCE;
        uint256 reward = 0;

        if (isLegendary) {
            // Calculate rewards for legendary generation
            uint256 winnerReward = (prizePool * 50) / 100;
            uint256 burnReward = (prizePool * 20) / 100;
            
            // Transfer rewards
            require(IERC20(casterToken).transfer(msg.sender, winnerReward), "Winner transfer failed");
            require(IERC20(casterToken).transfer(lpWallet, burnReward), "Burn transfer failed");
            
            reward = winnerReward;
            
            // Update prize pool (30% remains)
            prizePool = (prizePool * 30) / 100;
            emit PrizePoolUpdated(prizePool);
        }

        // Reset user state
        hasPendingGeneration[msg.sender] = false;
        userBlockNumber[msg.sender] = 0;

        emit GenerationComplete(msg.sender, isLegendary, reward);
    }

    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
}
