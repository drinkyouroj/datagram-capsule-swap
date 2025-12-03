'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { ReactNode } from 'react';

const datagram = defineChain({
  id: 968,
  name: 'Datagram',
  nativeCurrency: {
    decimals: 18,
    name: 'Datagram',
    symbol: 'DGRAM',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.datagram.network/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.datagram.network' },
  },
});

export const config = createConfig({
  chains: [datagram],
  connectors: [injected()],
  transports: {
    [datagram.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

