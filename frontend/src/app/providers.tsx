'use client';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('WalletConnect Project ID is required');
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '' }),
    publicProvider(),
  ],
  {
    batch: { multicall: false }, 
    pollingInterval: 12_000, 
    retryCount: 1, 
  }
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const appName = "Casters Pixels";

const { connectors } = getDefaultWallets({
  appName,
  projectId,
  chains,
});

const config = createConfig({
  autoConnect: false, 
  connectors,
  publicClient,
  webSocketPublicClient,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
