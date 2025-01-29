import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ERC20_ABI } from '../constants/abis';
import { CASTER_TOKEN_ADDRESS } from '../constants/addresses';
import { parseEther } from 'viem';

export function useTokenApprove(
  tokenAddress: `0x${string}` = CASTER_TOKEN_ADDRESS as `0x${string}`,
  spenderAddress?: `0x${string}`,
  amount?: bigint
) {
  const { config } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: spenderAddress && amount ? [spenderAddress, amount] : undefined,
    enabled: !!tokenAddress && !!spenderAddress && !!amount,
  });

  const { write: approve, data, isLoading } = useContractWrite(config);

  return { approve, data, isLoading };
}
