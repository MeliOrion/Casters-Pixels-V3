import { useContractRead } from 'wagmi';
import { ERC20_ABI } from '../constants/abis';

export function useTokenBalance(
  tokenAddress: string,
  walletAddress: string | undefined,
  spenderAddress?: string
) {
  const { data: balance, isLoading } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: spenderAddress ? 'allowance' : 'balanceOf',
    args: spenderAddress ? 
      [walletAddress, spenderAddress] : 
      walletAddress ? [walletAddress] : undefined,
    enabled: !!walletAddress && (!spenderAddress || !!spenderAddress),
    watch: true,
  });

  return { data: balance, isLoading };
}
