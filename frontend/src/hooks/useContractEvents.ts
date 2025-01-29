import { useContractEvent } from 'wagmi';
import { useCallback } from 'react';
import { CASTERS_PIXELS_ABI } from '../constants/abis';
import { formatEther } from 'viem';

export type StatusUpdate = {
  type: 'request' | 'complete' | 'error' | 'legendary' | 'prizepool';
  address?: string;
  blockNumber?: number;
  reward?: bigint;
  prizePool?: bigint;
  timestamp: number;
  message: string;
};

export function useContractEvents(
  contractAddress: string,
  userAddress?: string,
  onStatus?: (update: StatusUpdate) => void
) {
  const handleGenerationRequested = useCallback(
    (user: string, blockNumber: bigint) => {
      if (userAddress && user.toLowerCase() !== userAddress.toLowerCase()) return;
      onStatus?.({
        type: 'request',
        address: user,
        blockNumber: Number(blockNumber),
        timestamp: Date.now(),
        message: `Generation requested by ${user.slice(0, 6)}...${user.slice(-4)}`,
      });
    },
    [onStatus, userAddress]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'GenerationRequested',
    listener: handleGenerationRequested as (user: string, blockNumber: bigint) => void,
  });

  const handleGenerationComplete = useCallback(
    (user: string, isLegendary: boolean, reward: bigint) => {
      if (userAddress && user.toLowerCase() !== userAddress.toLowerCase()) return;
      onStatus?.({
        type: isLegendary ? 'legendary' : 'complete',
        address: user,
        reward,
        timestamp: Date.now(),
        message: isLegendary 
          ? `🎉 LEGENDARY generation by ${user.slice(0, 6)}...${user.slice(-4)}! Won ${formatEther(reward)} CASTER!`
          : `Generation completed by ${user.slice(0, 6)}...${user.slice(-4)}`,
      });
    },
    [onStatus, userAddress]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'GenerationComplete',
    listener: handleGenerationComplete as (user: string, isLegendary: boolean, reward: bigint) => void,
  });

  const handlePrizePoolUpdated = useCallback(
    (newAmount: bigint) => {
      onStatus?.({
        type: 'prizepool',
        prizePool: newAmount,
        timestamp: Date.now(),
        message: `Prize pool updated to ${formatEther(newAmount)} CASTER`,
      });
    },
    [onStatus]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'PrizePoolUpdated',
    listener: handlePrizePoolUpdated as (newAmount: bigint) => void,
  });
}
