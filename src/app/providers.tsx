'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

// Define CSC Testnet chain
export const cscTestnet = defineChain({
    id: 2151908,
    name: 'Crypto Science Testnet',
    nativeCurrency: {
        name: 'Crypto Science Coin',
        symbol: 'CSC',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.cryptoscience.in'],
        },
    },
    blockExplorers: {
        default: {
            name: 'CSC Explorer',
            url: 'https://testnet.cryptoscience.in',
        },
    },
    testnet: true,
});

// Wagmi config
const config = getDefaultConfig({
    appName: 'CSC Explorer',
    projectId: '3519ecbf5f01ff81edd7a6463f7657a3', // WalletConnect project ID (get from cloud.walletconnect.com)
    chains: [cscTestnet],
    ssr: true,
});

// React Query client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#00D4FF',
                        accentColorForeground: 'white',
                        borderRadius: 'large',
                        fontStack: 'system',
                        overlayBlur: 'small',
                    })}
                    modalSize="compact"
                    coolMode
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
