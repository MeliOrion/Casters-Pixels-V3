import { useContractRead } from 'wagmi';
import { ERC20_ABI } from '../constants/abis';
import { CASTER_TOKEN_ADDRESS } from '../constants/addresses';

export function useTokenBalance(tokenAddress: `0x${string}` = CASTER_TOKEN_ADDRESS as `0x${string}`, userAddress?: `0x${string}`) {
  const { data: balance, isLoading } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!tokenAddress && !!userAddress,
    watch: true,
  });

  return { balance, isLoading };
}
