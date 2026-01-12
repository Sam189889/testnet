'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { cscTestnet } from '../providers';

// Type for window with ethereum
interface WindowWithEthereum extends Window {
    ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
}

// Chain config for MetaMask - must match exact format
const CHAIN_CONFIG = {
    chainId: '0x20d5e4', // 2151908 in hex
    chainName: 'Crypto Science Testnet',
    nativeCurrency: {
        name: 'Crypto Science Coin',
        symbol: 'CSC',
        decimals: 18,
    },
    rpcUrls: ['http://185.249.225.122:32834'],
    blockExplorerUrls: ['https://cryptoscience.in'],
};

export default function FaucetPage() {
    const { address, isConnected, chain } = useAccount();

    const [faucetLoading, setFaucetLoading] = useState(false);
    const [faucetMessage, setFaucetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [canClaim, setCanClaim] = useState(true);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);

    // Switch network function using direct wallet API
    const switchToCSCNetwork = useCallback(async () => {
        if (typeof window === 'undefined' || !(window as WindowWithEthereum).ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        const ethereum = (window as WindowWithEthereum).ethereum!;
        setSwitching(true);

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_CONFIG.chainId }],
            });
        } catch (switchError: unknown) {
            const error = switchError as { code?: number; message?: string };
            console.log('Switch error:', error);

            if (error.code === 4902 || error.code === -32603 || error.message?.includes('wallet_addEthereumChain')) {
                try {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [CHAIN_CONFIG],
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    alert(`Cannot add network automatically.\n\nPlease add manually:\n- Network: Crypto Science Testnet\n- RPC: http://185.249.225.122:32834\n- Chain ID: 2151908\n- Symbol: CSC`);
                }
            } else if (error.code !== 4001) {
                console.error('Failed to switch network:', switchError);
            }
        } finally {
            setSwitching(false);
        }
    }, []);

    // Auto switch on connect
    useEffect(() => {
        if (isConnected && chain?.id !== cscTestnet.id) {
            switchToCSCNetwork();
        }
    }, [isConnected, chain, switchToCSCNetwork]);

    // Check faucet cooldown
    useEffect(() => {
        if (address) {
            const lastClaim = localStorage.getItem(`faucet_${address}`);
            if (lastClaim) {
                const timePassed = Date.now() - parseInt(lastClaim);
                const cooldown = 24 * 60 * 60 * 1000; // 24 hours
                if (timePassed < cooldown) {
                    setCanClaim(false);
                    setCooldownTime(Math.ceil((cooldown - timePassed) / 1000 / 60));

                    // Update cooldown every minute
                    const interval = setInterval(() => {
                        const newTimePassed = Date.now() - parseInt(lastClaim);
                        if (newTimePassed >= cooldown) {
                            setCanClaim(true);
                            setCooldownTime(0);
                            clearInterval(interval);
                        } else {
                            setCooldownTime(Math.ceil((cooldown - newTimePassed) / 1000 / 60));
                        }
                    }, 60000);

                    return () => clearInterval(interval);
                }
            }
        }
    }, [address]);

    // Claim from faucet
    const claimFaucet = async () => {
        if (!address || !canClaim) return;

        setFaucetLoading(true);
        setFaucetMessage(null);
        setTxHash(null);

        try {
            const response = await fetch('/api/faucet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });

            const data = await response.json();

            if (data.success) {
                setFaucetMessage({ type: 'success', text: 'Successfully sent 10 CSC to your wallet!' });
                setTxHash(data.txHash);
                localStorage.setItem(`faucet_${address}`, Date.now().toString());
                setCanClaim(false);
                setCooldownTime(24 * 60);
            } else {
                setFaucetMessage({ type: 'error', text: data.error || 'Failed to claim tokens' });
            }
        } catch (error) {
            setFaucetMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setFaucetLoading(false);
        }
    };

    const isWrongNetwork = isConnected && chain?.id !== cscTestnet.id;

    return (
        <div className="min-h-screen bg-[#030014] overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0728] via-[#030014] to-[#0a0a1f]" />
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-white/5 backdrop-blur-xl bg-black/20">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur-md opacity-75" />
                                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                                        <span className="text-xl font-black text-white">CS</span>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Crypto Science
                                    </h1>
                                    <p className="text-xs text-gray-500">Testnet Faucet</p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-4">
                                <Link
                                    href="/"
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
                                >
                                    ← Explorer
                                </Link>
                                <ConnectButton
                                    chainStatus="icon"
                                    showBalance={false}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-2xl mx-auto px-4 py-16">
                    {/* Faucet Card */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-6">
                            <span className="text-4xl">💧</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3">CSC Testnet Faucet</h1>
                        <p className="text-gray-400 text-lg">Get free test tokens for the Crypto Science Testnet</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        {/* Faucet Info */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-2xl bg-white/5">
                                <p className="text-gray-500 text-sm mb-1">Amount per claim</p>
                                <p className="text-2xl font-bold text-emerald-400">10 CSC</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5">
                                <p className="text-gray-500 text-sm mb-1">Cooldown</p>
                                <p className="text-2xl font-bold text-cyan-400">24 Hours</p>
                            </div>
                        </div>

                        {/* Connection State */}
                        {!isConnected ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-6">Connect your wallet to claim test CSC</p>
                                <ConnectButton />
                            </div>
                        ) : isWrongNetwork ? (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 mb-6">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                    Wrong Network
                                </div>
                                <p className="text-gray-400 mb-4">Please switch to CSC Testnet</p>
                                <button
                                    onClick={switchToCSCNetwork}
                                    disabled={switching}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {switching ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Switching...
                                        </>
                                    ) : (
                                        'Switch to CSC Testnet'
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                {/* Connected Address */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 mb-6">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                                </div>

                                {/* Claim Button or Cooldown */}
                                {canClaim ? (
                                    <button
                                        onClick={claimFaucet}
                                        disabled={faucetLoading}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25"
                                    >
                                        {faucetLoading ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending CSC...
                                            </>
                                        ) : (
                                            <>
                                                💧 Claim 10 CSC
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-gray-400 mb-2">You can claim again in</p>
                                        <p className="text-3xl font-bold text-cyan-400">
                                            {Math.floor(cooldownTime / 60)}h {cooldownTime % 60}m
                                        </p>
                                    </div>
                                )}

                                {/* Success/Error Message */}
                                {faucetMessage && (
                                    <div className={`mt-6 p-4 rounded-xl ${faucetMessage.type === 'success'
                                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                                        : 'bg-red-500/20 border border-red-500/30'
                                        }`}>
                                        <p className={faucetMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                                            {faucetMessage.text}
                                        </p>
                                        {txHash && (
                                            <p className="text-gray-500 text-sm mt-2 font-mono">
                                                TX: {txHash.slice(0, 20)}...{txHash.slice(-8)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">How to use</h3>
                        <ol className="space-y-3 text-gray-400">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">1</span>
                                Connect your wallet (MetaMask, WalletConnect, etc.)
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">2</span>
                                Network will be added automatically if not present
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">3</span>
                                Click "Claim 10 CSC" to receive test tokens
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">4</span>
                                Wait 24 hours for your next claim
                            </li>
                        </ol>
                    </div>
                </main>
            </div>
        </div>
    );
}
