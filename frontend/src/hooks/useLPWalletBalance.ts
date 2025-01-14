import { useContractRead } from 'wagmi';
import { ERC20_ABI } from '../constants/abis';
import { CASTER_TOKEN_ADDRESS } from '../constants/addresses';

const LP_MANAGEMENT_WALLET = '0x92333d0864820066aB42784b8ce391F753a30277';

export function useLPWalletBalance() {
  const { data: balance } = useContractRead({
    address: CASTER_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [LP_MANAGEMENT_WALLET as `0x${string}`],
    watch: true,
  });

  return { balance };
}
