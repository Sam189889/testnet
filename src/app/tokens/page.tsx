'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

// Known tokens on CSC Testnet (can be expanded via API later)
const KNOWN_TOKENS = [
    {
        address: '0x0000000000000000000000000000000000000000',
        name: 'Crypto Science Coin',
        symbol: 'CSC',
        decimals: 18,
        type: 'Native',
        logo: '🪙',
    },
];

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    type: string;
    logo: string;
    totalSupply?: string;
    holders?: number;
}

interface RecentTransfer {
    txHash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp?: number;
}

export default function TokensPage() {
    const [tokens, setTokens] = useState<TokenInfo[]>(KNOWN_TOKENS);
    const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRecentTransfers();
    }, []);

    const fetchRecentTransfers = async () => {
        try {
            // Get latest block
            const blockNumRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1,
                }),
            });
            const blockNumData = await blockNumRes.json();
            const latestBlock = parseInt(blockNumData.result, 16);

            // Fetch recent blocks for CSC transfers
            const transfers: RecentTransfer[] = [];

            for (let i = latestBlock; i > latestBlock - 20 && transfers.length < 10; i--) {
                const blockRes = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_getBlockByNumber',
                        params: [`0x${i.toString(16)}`, true],
                        id: i,
                    }),
                });
                const blockData = await blockRes.json();

                if (blockData.result && blockData.result.transactions) {
                    const block = blockData.result;
                    const blockTimestamp = parseInt(block.timestamp, 16);

                    for (const tx of block.transactions) {
                        if (tx.value && BigInt(tx.value) > 0 && transfers.length < 10) {
                            transfers.push({
                                txHash: tx.hash,
                                from: tx.from,
                                to: tx.to || 'Contract',
                                value: tx.value,
                                blockNumber: parseInt(tx.blockNumber, 16),
                                timestamp: blockTimestamp,
                            });
                        }
                    }
                }
            }

            setRecentTransfers(transfers);
        } catch (error) {
            console.error('Failed to fetch transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const formatAddr = (addr: string) => {
        if (addr === 'Contract') return addr;
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    const filteredTokens = tokens.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}>
            {/* Header */}
            <header style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                        }}>
                            CSC
                        </div>
                        <span className="text-xl font-bold text-white">Tokens</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/txs" className="text-gray-400 hover:text-white transition-colors">
                            Transactions
                        </Link>
                        <Link href="/blocks" className="text-gray-400 hover:text-white transition-colors">
                            Blocks
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '24px',
                }}>
                    🪙 Token Tracker
                </h1>

                {/* Search */}
                <div style={{ marginBottom: '24px' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by token name, symbol, or address..."
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '14px',
                        }}
                    />
                </div>

                {/* Token List */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    marginBottom: '32px',
                }}>
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                    }}>
                        <h2 style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                            📋 Token List ({filteredTokens.length})
                        </h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>#</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Token</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Type</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTokens.map((token, i) => (
                                    <tr
                                        key={token.address}
                                        style={{
                                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                        }}
                                    >
                                        <td style={{ padding: '14px 16px', color: '#888', fontSize: '14px' }}>
                                            {i + 1}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '24px' }}>{token.logo}</span>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{token.name}</div>
                                                    <div style={{ color: '#888', fontSize: '12px' }}>{token.symbol}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                background: token.type === 'Native' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                                                color: token.type === 'Native' ? '#00D4FF' : '#00FF88',
                                            }}>
                                                {token.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {token.address === '0x0000000000000000000000000000000000000000' ? (
                                                <span style={{ color: '#888', fontSize: '13px' }}>Native Token</span>
                                            ) : (
                                                <Link href={`/token/${token.address}`} style={{ color: '#00D4FF', fontSize: '13px', fontFamily: 'monospace' }}>
                                                    {formatAddr(token.address)}
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Token Transfers */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                    }}>
                        <h2 style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                            📊 Recent CSC Transfers
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            ⏳ Loading transfers...
                        </div>
                    ) : recentTransfers.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            No recent transfers found
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Tx Hash</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>From</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>To</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Value</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransfers.map((tx, i) => (
                                        <tr
                                            key={tx.txHash}
                                            style={{
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                            }}
                                        >
                                            <td style={{ padding: '12px 16px' }}>
                                                <Link href={`/tx/${tx.txHash}`} style={{ color: '#00D4FF', fontSize: '13px', fontFamily: 'monospace' }}>
                                                    {tx.txHash.slice(0, 14)}...
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <Link href={`/address/${tx.from}`} style={{ color: '#FFD700', fontSize: '12px', fontFamily: 'monospace' }}>
                                                    {formatAddr(tx.from)}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <Link href={`/address/${tx.to}`} style={{ color: '#FF69B4', fontSize: '12px', fontFamily: 'monospace' }}>
                                                    {formatAddr(tx.to)}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontSize: '13px' }}>
                                                {parseFloat(formatEther(BigInt(tx.value))).toFixed(4)} CSC
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '12px' }}>
                                                {tx.timestamp ? formatTime(tx.timestamp) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(0, 212, 255, 0.05)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                }}>
                    <h3 style={{ color: '#00D4FF', marginBottom: '8px', fontSize: '14px' }}>
                        💡 Deploy Your Token
                    </h3>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>
                        Want to create your own ERC-20 token on CSC Testnet?
                    </p>
                    <Link href="/deploy" style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                        color: 'black',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 'bold',
                    }}>
                        🚀 Deploy Contract
                    </Link>
                </div>
            </main>
        </div>
    );
}
