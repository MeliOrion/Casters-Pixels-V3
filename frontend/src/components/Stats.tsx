import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useAccount } from 'wagmi';
import { CASTERS_PIXELS_ABI } from '../constants/abis';

const CONTRACT_ABI = [
  'function prizePool() view returns (uint256)',
];

export function Stats() {
  const { address } = useAccount();

  // Get prize pool
  const { data: prizePool, isLoading: isPrizePoolLoading } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'prizePool',
    watch: true,
  });

  // Get generation cost
  const { data: generationCost, isLoading: isGenerationCostLoading } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'GENERATION_COST',
    watch: true,
  });

  // Get user's CASTER balance
  const { data: userBalance, isLoading: isUserBalanceLoading } = useTokenBalance(
    process.env.NEXT_PUBLIC_CASTER_TOKEN_ADDRESS as string,
    address as string
  );

  // Get LP wallet balance (burned CASTER)
  const { data: burnedBalance, isLoading: isBurnedBalanceLoading } = useTokenBalance(
    process.env.NEXT_PUBLIC_CASTER_TOKEN_ADDRESS as string,
    process.env.NEXT_PUBLIC_LP_WALLET_ADDRESS as string
  );

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-2 text-white">Prize Pool</h2>
          <p className="text-2xl font-medium text-white">
            {isPrizePoolLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : prizePool ? (
              `${formatEther(prizePool)} CASTER`
            ) : (
              <span className="text-gray-400">0 CASTER</span>
            )}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-2 text-white">Burned CASTER</h2>
          <p className="text-2xl font-medium text-white">
            {isBurnedBalanceLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : burnedBalance ? (
              `${formatEther(burnedBalance)} CASTER`
            ) : (
              <span className="text-gray-400">0 CASTER</span>
            )}
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-2 text-white">Generation Cost</h2>
          <p className="text-2xl font-medium text-white">
            {isGenerationCostLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : generationCost ? (
              `${formatEther(generationCost)} CASTER`
            ) : (
              <span className="text-gray-400">1000 CASTER</span>
            )}
          </p>
        </div>

        {address && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-2 text-white">Your CASTER Balance</h2>
            <p className="text-2xl font-medium text-white">
              {isUserBalanceLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : userBalance ? (
                `${formatEther(userBalance)} CASTER`
              ) : (
                <span className="text-gray-400">0 CASTER</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
