'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface NetworkStats {
    latestBlock: number;
    totalTxs: number;
    avgGasPrice: string;
    avgBlockTime: number;
    tps: number;
}

interface ChartData {
    name: string;
    value: number;
}

interface TopAccount {
    address: string;
    balance: string;
    txCount: number;
}

async function rpcCall(method: string, params: unknown[] = []) {
    const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });
    const data = await res.json();
    return data.result;
}

export default function StatsPage() {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [txChart, setTxChart] = useState<ChartData[]>([]);
    const [gasChart, setGasChart] = useState<ChartData[]>([]);
    const [blockChart, setBlockChart] = useState<ChartData[]>([]);
    const [topAccounts, setTopAccounts] = useState<TopAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Get latest block
                const blockNumHex = await rpcCall('eth_blockNumber');
                const latestBlock = parseInt(blockNumHex, 16);

                // Get gas price
                const gasPriceHex = await rpcCall('eth_gasPrice');
                const gasPrice = parseInt(gasPriceHex, 16) / 1e9;

                // Get recent blocks for data
                const blocksData: ChartData[] = [];
                const txData: ChartData[] = [];
                const gasData: ChartData[] = [];
                let totalTxs = 0;
                let totalBlockTime = 0;
                let prevTimestamp = 0;

                // Fetch last 7 blocks for charts
                const numBlocks = Math.min(7, latestBlock);
                for (let i = 0; i < numBlocks; i++) {
                    const blockNum = latestBlock - i;
                    const block = await rpcCall('eth_getBlockByNumber', ['0x' + blockNum.toString(16), false]);
                    if (block) {
                        const txCount = block.transactions?.length || 0;
                        const timestamp = parseInt(block.timestamp, 16);
                        const blockGas = parseInt(block.gasUsed || '0x0', 16);

                        txData.unshift({ name: `#${blockNum}`, value: txCount });
                        gasData.unshift({ name: `#${blockNum}`, value: Math.round(blockGas / 1000) });
                        totalTxs += txCount;

                        if (prevTimestamp > 0) {
                            const blockTime = prevTimestamp - timestamp;
                            blocksData.unshift({ name: `#${blockNum}`, value: blockTime });
                            totalBlockTime += blockTime;
                        }
                        prevTimestamp = timestamp;
                    }
                }

                const avgBlockTime = numBlocks > 1 ? totalBlockTime / (numBlocks - 1) : 2;
                const tps = avgBlockTime > 0 ? (totalTxs / numBlocks) / avgBlockTime : 0;

                setStats({
                    latestBlock,
                    totalTxs,
                    avgGasPrice: gasPrice.toFixed(2),
                    avgBlockTime: Math.round(avgBlockTime),
                    tps: parseFloat(tps.toFixed(2)),
                });

                setTxChart(txData);
                setGasChart(gasData);
                setBlockChart(blocksData);

                // Mock top accounts (would need indexer for real data)
                setTopAccounts([
                    { address: '0xf563...d7a3', balance: '1,000,000 CSC', txCount: 500 },
                    { address: '0x742d...35cc', balance: '500,000 CSC', txCount: 250 },
                    { address: '0x8ba1...9012', balance: '100,000 CSC', txCount: 120 },
                    { address: '0x1234...5678', balance: '50,000 CSC', txCount: 80 },
                    { address: '0xabcd...ef01', balance: '25,000 CSC', txCount: 45 },
                ]);

            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                }}>
                    {icon}
                </div>
                <span style={{ color: '#888', fontSize: '14px' }}>{label}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{value}</div>
        </div>
    );

    const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '18px' }}>{title}</h3>
            <div style={{ height: '200px' }}>{children}</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #141428 100%)', color: 'white', fontFamily: 'system-ui' }}>
            {/* Header */}
            <header style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'white' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #00D4FF, #00FF88)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>CSC</div>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Network Stats</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/deploy" style={{ color: '#00D4FF', textDecoration: 'none' }}>🚀 Deploy</Link>
                    <Link href="/txs" style={{ color: '#00D4FF', textDecoration: 'none' }}>📋 Transactions</Link>
                    <Link href="/blocks" style={{ color: '#00D4FF', textDecoration: 'none' }}>📦 Blocks</Link>
                    <ConnectButton />
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '36px', marginBottom: '8px', background: 'linear-gradient(135deg, #00D4FF, #00FF88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        📊 Network Analytics
                    </h1>
                    <p style={{ color: '#888' }}>Real-time CSC Testnet statistics and charts</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                        <p style={{ color: '#888' }}>Loading network stats...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            <StatCard icon="📦" label="Latest Block" value={stats?.latestBlock?.toLocaleString() || '0'} color="#00D4FF" />
                            <StatCard icon="💸" label="Recent TXs" value={stats?.totalTxs || 0} color="#00FF88" />
                            <StatCard icon="⛽" label="Gas Price" value={`${stats?.avgGasPrice || '0'} Gwei`} color="#FFD700" />
                            <StatCard icon="⏱️" label="Avg Block Time" value={`${stats?.avgBlockTime || 0}s`} color="#FF6B6B" />
                            <StatCard icon="⚡" label="TPS" value={stats?.tps || 0} color="#9B59B6" />
                            <StatCard icon="🔗" label="Chain ID" value="2151908" color="#E91E63" />
                        </div>

                        {/* Charts Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            <ChartCard title="📈 Transactions per Block">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={txChart}>
                                        <defs>
                                            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                        <YAxis stroke="#666" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                                        <Area type="monotone" dataKey="value" stroke="#00D4FF" fill="url(#txGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="⛽ Gas Used (thousands)">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={gasChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                        <YAxis stroke="#666" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                                        <Bar dataKey="value" fill="#FFD700" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="⏱️ Block Time (seconds)">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={blockChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                        <YAxis stroke="#666" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                                        <Line type="monotone" dataKey="value" stroke="#00FF88" strokeWidth={2} dot={{ fill: '#00FF88' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        {/* Top Accounts */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '18px' }}>🏆 Top Accounts</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontWeight: 'normal' }}>Rank</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontWeight: 'normal' }}>Address</th>
                                            <th style={{ textAlign: 'right', padding: '12px', color: '#888', fontWeight: 'normal' }}>Balance</th>
                                            <th style={{ textAlign: 'right', padding: '12px', color: '#888', fontWeight: 'normal' }}>Txn Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topAccounts.map((acc, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ background: i < 3 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#333', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        #{i + 1}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#00D4FF' }}>{acc.address}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: '#00FF88', fontWeight: 'bold' }}>{acc.balance}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: '#888' }}>{acc.txCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Network Info */}
                        <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(0,212,255,0.05)', borderRadius: '16px', border: '1px solid rgba(0,212,255,0.2)' }}>
                            <h4 style={{ color: 'white', marginBottom: '16px' }}>🔗 Network Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>Chain ID</span>
                                    <span style={{ color: 'white', fontFamily: 'monospace' }}>2151908</span>
                                </div>
                                <div>
                                    <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>RPC URL</span>
                                    <span style={{ color: '#00D4FF', fontFamily: 'monospace', fontSize: '14px' }}>https://rpc.cryptoscience.in</span>
                                </div>
                                <div>
                                    <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>Native Token</span>
                                    <span style={{ color: 'white' }}>CSC (Crypto Science Coin)</span>
                                </div>
                                <div>
                                    <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>Explorer</span>
                                    <span style={{ color: '#00D4FF', fontSize: '14px' }}>testnet.cryptoscience.in</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
