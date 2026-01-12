'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface Transaction {
    hash: string;
    blockNumber: string;
    from: string;
    to: string | null;
    value: string;
    gas: string;
    gasPrice: string;
    timestamp?: number;
}

interface Block {
    number: string;
    timestamp: string;
    transactions: string[] | Transaction[];
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [latestBlock, setLatestBlock] = useState(0);
    const txsPerPage = 25;

    useEffect(() => {
        fetchTransactions();
        const interval = setInterval(fetchTransactions, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [currentPage]);

    const fetchTransactions = async () => {
        try {
            // Get latest block number
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
            const currentBlock = parseInt(blockNumData.result, 16);
            setLatestBlock(currentBlock);

            // Fetch last N blocks to get transactions
            const startBlock = Math.max(0, currentBlock - (currentPage - 1) * 5 - 10);
            const endBlock = currentBlock - (currentPage - 1) * 5;

            const allTxs: Transaction[] = [];

            for (let i = endBlock; i >= startBlock && allTxs.length < txsPerPage; i--) {
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
                    const block = blockData.result as Block;
                    const blockTimestamp = parseInt(block.timestamp, 16);

                    for (const tx of block.transactions as Transaction[]) {
                        if (allTxs.length < txsPerPage) {
                            allTxs.push({
                                ...tx,
                                timestamp: blockTimestamp,
                            });
                        }
                    }
                }
            }

            setTransactions(allTxs);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAddress = (addr: string | null) => {
        if (!addr) return 'Contract Creation';
        return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
    };

    const formatValue = (value: string) => {
        try {
            const eth = formatEther(BigInt(value));
            return parseFloat(eth).toFixed(4);
        } catch {
            return '0';
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
                        <span className="text-xl font-bold text-white">Transactions</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/blocks" className="text-gray-400 hover:text-white transition-colors">
                            Blocks
                        </Link>
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                            Explorer
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ color: '#888', fontSize: '14px' }}>Latest Block</div>
                        <div style={{ color: '#00D4FF', fontSize: '24px', fontWeight: 'bold' }}>
                            #{latestBlock.toLocaleString()}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ color: '#888', fontSize: '14px' }}>Showing</div>
                        <div style={{ color: '#00FF88', fontSize: '24px', fontWeight: 'bold' }}>
                            {transactions.length} Transactions
                        </div>
                    </div>
                </div>

                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '24px',
                }}>
                    📋 Transaction List
                </h1>

                {/* Transactions Table */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            ⏳ Loading transactions...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            No transactions found
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Tx Hash</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Block</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>From</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>To</th>
                                        <th style={{ padding: '16px', textAlign: 'right', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Value (CSC)</th>
                                        <th style={{ padding: '16px', textAlign: 'right', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, index) => (
                                        <tr
                                            key={tx.hash}
                                            style={{
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                            }}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/tx/${tx.hash}`}
                                                    style={{ color: '#00D4FF', fontSize: '14px', fontFamily: 'monospace' }}
                                                >
                                                    {tx.hash.slice(0, 16)}...
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/block/${parseInt(tx.blockNumber, 16)}`}
                                                    style={{ color: '#00FF88', fontSize: '14px' }}
                                                >
                                                    {parseInt(tx.blockNumber, 16).toLocaleString()}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/address/${tx.from}`}
                                                    style={{ color: '#FFD700', fontSize: '13px', fontFamily: 'monospace' }}
                                                >
                                                    {formatAddress(tx.from)}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {tx.to ? (
                                                    <Link
                                                        href={`/address/${tx.to}`}
                                                        style={{ color: '#FF69B4', fontSize: '13px', fontFamily: 'monospace' }}
                                                    >
                                                        {formatAddress(tx.to)}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: '#888', fontSize: '13px' }}>📄 Contract</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: 'white', fontSize: '14px' }}>
                                                {formatValue(tx.value)}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888', fontSize: '13px' }}>
                                                {tx.timestamp ? formatTime(tx.timestamp) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '24px',
                }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            background: currentPage === 1 ? 'rgba(100, 100, 100, 0.3)' : 'rgba(0, 212, 255, 0.2)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: currentPage === 1 ? '#666' : '#00D4FF',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        ← Previous
                    </button>
                    <span style={{
                        padding: '10px 20px',
                        color: 'white',
                    }}>
                        Page {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            background: 'rgba(0, 212, 255, 0.2)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: '#00D4FF',
                            cursor: 'pointer',
                        }}
                    >
                        Next →
                    </button>
                </div>
            </main>
        </div>
    );
}
