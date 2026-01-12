'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { cscTestnet } from './providers';

interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
}

interface NetworkStats {
  blockNumber: number;
  gasPrice: string;
  isConnected: boolean;
}

const RPC_URL = 'https://rpc.cryptoscience.in';
const CHAIN_ID = 2151908;

// Chain config for MetaMask - must match exact format
const CHAIN_CONFIG = {
  chainId: '0x20d5e4', // 2151908 in hex
  chainName: 'Crypto Science Testnet',
  nativeCurrency: {
    name: 'Crypto Science Coin',
    symbol: 'CSC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.cryptoscience.in'],
  blockExplorerUrls: ['https://testnet.cryptoscience.in'],
};

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    blockNumber: 0,
    gasPrice: '0',
    isConnected: false,
  });
  const [latestBlocks, setLatestBlocks] = useState<BlockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [switching, setSwitching] = useState(false);

  // Switch network function using direct wallet API
  const switchToCSCNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    setSwitching(true);
    try {
      // First try to switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: unknown) {
      const error = switchError as { code?: number; message?: string };
      console.log('Switch error:', error);

      // Chain doesn't exist, add it
      if (error.code === 4902 || error.code === -32603 || error.message?.includes('wallet_addEthereumChain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_CONFIG],
          });
          console.log('Network added successfully');
        } catch (addError: unknown) {
          const err = addError as { message?: string };
          console.error('Failed to add network:', addError);
          // Show more helpful error
          alert(`Cannot add network automatically.\n\nPlease add manually:\n- Network: Crypto Science Testnet\n- RPC: http://185.249.225.122:32834\n- Chain ID: 2151908\n- Symbol: CSC`);
        }
      } else if (error.code !== 4001) {
        // 4001 = user rejected, ignore that
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

  // Fetch network data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 },
            { jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 2 },
          ]),
        });

        const results = await response.json();
        const blockNumber = parseInt(results[0]?.result || '0', 16);
        const gasPrice = parseInt(results[1]?.result || '0', 16);

        setNetworkStats({
          blockNumber,
          gasPrice: (gasPrice / 1e9).toFixed(2),
          isConnected: true,
        });

        // Fetch latest blocks
        const blocks: BlockInfo[] = [];
        for (let i = blockNumber; i > Math.max(0, blockNumber - 6); i--) {
          const blockRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [`0x${i.toString(16)}`, false],
              id: 1,
            }),
          });
          const blockData = await blockRes.json();
          if (blockData.result) {
            blocks.push({
              number: parseInt(blockData.result.number, 16),
              hash: blockData.result.hash,
              timestamp: parseInt(blockData.result.timestamp, 16),
              transactions: blockData.result.transactions?.length || 0,
            });
          }
        }
        setLatestBlocks(blocks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setNetworkStats(prev => ({ ...prev, isConnected: false }));
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const isWrongNetwork = isConnected && chain?.id !== cscTestnet.id;

  return (
    <div className="min-h-screen bg-[#030014] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0728] via-[#030014] to-[#0a0a1f]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                  <p className="text-xs text-gray-500">Testnet Explorer</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Faucet Link */}
                <Link
                  href="/faucet"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 hover:border-emerald-400/50 transition-all text-sm font-medium"
                >
                  💧 Faucet
                </Link>
                {/* Rewards Link */}
                <Link
                  href="/rewards"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:border-amber-400/50 transition-all text-sm font-medium"
                >
                  🎁 Rewards
                </Link>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <span className={`w-2 h-2 rounded-full ${networkStats.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-400">{networkStats.isConnected ? 'Live' : 'Offline'}</span>
                </div>

                <ConnectButton
                  chainStatus="icon"
                  showBalance={false}
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-yellow-400 font-medium">Wrong Network</p>
                  <p className="text-yellow-300/70 text-sm">Please switch to CSC Testnet</p>
                </div>
              </div>
              <button
                onClick={switchToCSCNetwork}
                disabled={switching}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {switching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Switch Network'
                )}
              </button>
            </div>
          )}

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Chain ID', value: CHAIN_ID.toLocaleString(), icon: '🔗' },
              { label: 'Latest Block', value: `#${networkStats.blockNumber.toLocaleString()}`, icon: '📦' },
              { label: 'Gas Price', value: `${networkStats.gasPrice} Gwei`, icon: '⛽' },
              { label: 'Token', value: 'CSC', icon: '🪙' },
            ].map((stat, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Wallet & Balance + Faucet CTA */}
          {isConnected && !isWrongNetwork && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Your Balance</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0'} CSC
                  </p>
                </div>
                <Link
                  href="/faucet"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  💧 Get Free CSC
                </Link>
              </div>
            </div>
          )}

          {/* Not Connected CTA */}
          {!isConnected && (
            <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm text-center">
              <h2 className="text-2xl font-bold text-white mb-2">🪙 Get Free Test CSC</h2>
              <p className="text-gray-400 mb-4">Connect your wallet and visit the faucet to claim 10 CSC</p>
              <div className="flex items-center justify-center gap-4">
                <ConnectButton />
                <Link
                  href="/faucet"
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
                >
                  Visit Faucet →
                </Link>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input
                type="text"
                placeholder="🔍 Search by Address / Txn Hash / Block"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur-sm transition-all"
              />
            </div>
          </div>

          {/* Latest Blocks */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📦 Latest Blocks
              </h2>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                Live
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading blocks...</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {latestBlocks.map((block) => (
                  <div key={block.number} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-purple-500/30 transition-colors">
                          <span className="text-cyan-400 text-sm font-bold">Bk</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Block #{block.number.toLocaleString()}</p>
                          <p className="text-gray-500 text-xs">{formatTime(block.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 font-medium">{block.transactions} txns</p>
                        <p className="text-gray-600 text-xs font-mono">{block.hash.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-600 text-sm">
            <p>RPC: {RPC_URL}</p>
            <p className="mt-1">Powered by <span className="text-cyan-500">Polygon CDK</span> with <span className="text-purple-400">CSC</span> native gas token</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
