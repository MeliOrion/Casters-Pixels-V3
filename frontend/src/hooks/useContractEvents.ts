import { useContractEvent } from 'wagmi';
import { useCallback } from 'react';

const CONTRACT_ABI = [
  'event GenerationRequested(address indexed user, uint256 blockNumber)',
  'event GenerationComplete(address indexed user, bool isLegendary, uint256 reward)',
  'event PrizePoolUpdated(uint256 newAmount)'
];

export type StatusUpdate = {
  type: 'request' | 'complete' | 'error' | 'legendary' | 'prizepool';
  message: string;
  timestamp: number;
};

export function useContractEvents(
  contractAddress: string,
  userAddress?: string,
  onStatus?: (update: StatusUpdate) => void
) {
  const handleStatus = useCallback((update: StatusUpdate) => {
    onStatus?.(update);
  }, [onStatus]);

  // Listen for generation requests
  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    eventName: 'GenerationRequested',
    listener(user: string, blockNumber: bigint) {
      if (user === userAddress) {
        handleStatus({
          type: 'request',
          message: `Generation requested at block ${blockNumber.toString()}`,
          timestamp: Date.now(),
        });
      }
    },
  });

  // Listen for completed generations
  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    eventName: 'GenerationComplete',
    listener(user: string, isLegendary: boolean, reward: bigint) {
      if (user === userAddress) {
        handleStatus({
          type: isLegendary ? 'legendary' : 'complete',
          message: isLegendary 
            ? `🎉 Legendary generation! Reward: ${reward.toString()} CASTER` 
            : 'Generation complete!',
          timestamp: Date.now(),
        });
      }
    },
  });

  // Listen for prize pool updates
  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    eventName: 'PrizePoolUpdated',
    listener(newAmount: bigint) {
      handleStatus({
        type: 'prizepool',
        message: `Prize pool updated to ${newAmount.toString()} CASTER`,
        timestamp: Date.now(),
      });
    },
  });
}
