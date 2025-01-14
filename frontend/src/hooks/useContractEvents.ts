import { useContractEvent } from 'wagmi';
import { useCallback } from 'react';
import { CASTERS_PIXELS_ABI } from '../constants/abis';

export type StatusUpdate = {
  type: 'request' | 'complete' | 'error' | 'legendary' | 'prizepool';
  address?: string;
  blockNumber?: number;
  reward?: bigint;
  prizePool?: bigint;
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
      });
    },
    [onStatus, userAddress]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'GenerationRequested',
    listener: handleGenerationRequested,
  });

  const handleGenerationComplete = useCallback(
    (user: string, isLegendary: boolean, reward: bigint) => {
      if (userAddress && user.toLowerCase() !== userAddress.toLowerCase()) return;
      onStatus?.({
        type: isLegendary ? 'legendary' : 'complete',
        address: user,
        reward,
      });
    },
    [onStatus, userAddress]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'GenerationComplete',
    listener: handleGenerationComplete,
  });

  const handlePrizePoolUpdated = useCallback(
    (newAmount: bigint) => {
      onStatus?.({
        type: 'prizepool',
        prizePool: newAmount,
      });
    },
    [onStatus]
  );

  useContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    eventName: 'PrizePoolUpdated',
    listener: handlePrizePoolUpdated,
  });
}
