import { useContractRead } from 'wagmi';
import { ERC20_ABI } from '../constants/abis';
import { CASTER_TOKEN_ADDRESS } from '../constants/addresses';

export function useTokenAllowance(
  tokenAddress: `0x${string}` = CASTER_TOKEN_ADDRESS as `0x${string}`,
  ownerAddress?: `0x${string}`,
  spenderAddress?: `0x${string}`
) {
  const { data: allowance, isLoading } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
    watch: true,
  });

  return { allowance, isLoading };
}
