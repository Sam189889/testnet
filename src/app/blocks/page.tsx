'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface BlockInfo {
    number: string;
    hash: string;
    timestamp: string;
    miner: string;
    gasUsed: string;
    gasLimit: string;
    transactions: string[];
    size: string;
}

export default function BlocksPage() {
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [latestBlock, setLatestBlock] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const blocksPerPage = 25;

    useEffect(() => {
        fetchBlocks();
        const interval = setInterval(fetchBlocks, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [currentPage]);

    const fetchBlocks = async () => {
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

            // Fetch blocks for current page
            const startBlock = currentBlock - (currentPage - 1) * blocksPerPage;
            const endBlock = Math.max(0, startBlock - blocksPerPage + 1);

            const blockPromises = [];
            for (let i = startBlock; i >= endBlock; i--) {
                blockPromises.push(
                    fetch(RPC_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBlockByNumber',
                            params: [`0x${i.toString(16)}`, false],
                            id: i,
                        }),
                    }).then(res => res.json())
                );
            }

            const blockResults = await Promise.all(blockPromises);
            const fetchedBlocks = blockResults
                .filter(r => r.result)
                .map(r => r.result as BlockInfo);

            setBlocks(fetchedBlocks);
        } catch (error) {
            console.error('Failed to fetch blocks:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const ts = parseInt(timestamp, 16);
        const now = Math.floor(Date.now() / 1000);
        const diff = now - ts;
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
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
                        <span className="text-xl font-bold text-white">Blocks</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/txs" className="text-gray-400 hover:text-white transition-colors">
                            Transactions
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
                            {blocks.length} Blocks
                        </div>
                    </div>
                </div>

                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '24px',
                }}>
                    📦 Block List
                </h1>

                {/* Blocks Table */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            ⏳ Loading blocks...
                        </div>
                    ) : blocks.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            No blocks found
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Block</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Age</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Txns</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Validator</th>
                                        <th style={{ padding: '16px', textAlign: 'right', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Gas Used</th>
                                        <th style={{ padding: '16px', textAlign: 'right', color: '#888', fontSize: '14px', fontWeight: 'normal' }}>Gas Limit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((block, index) => (
                                        <tr
                                            key={block.hash}
                                            style={{
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                            }}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/block/${parseInt(block.number, 16)}`}
                                                    style={{ color: '#00D4FF', fontSize: '14px', fontWeight: 'bold' }}
                                                >
                                                    {parseInt(block.number, 16).toLocaleString()}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#888', fontSize: '14px' }}>
                                                {formatTime(block.timestamp)}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/block/${parseInt(block.number, 16)}`}
                                                    style={{
                                                        color: block.transactions.length > 0 ? '#00FF88' : '#666',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    {block.transactions.length}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link
                                                    href={`/address/${block.miner}`}
                                                    style={{ color: '#FFD700', fontSize: '13px', fontFamily: 'monospace' }}
                                                >
                                                    {formatAddress(block.miner)}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: 'white', fontSize: '14px' }}>
                                                {parseInt(block.gasUsed, 16).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888', fontSize: '14px' }}>
                                                {parseInt(block.gasLimit, 16).toLocaleString()}
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
                        ← Newer
                    </button>
                    <span style={{
                        padding: '10px 20px',
                        color: 'white',
                    }}>
                        Page {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={blocks.length < blocksPerPage}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            background: blocks.length < blocksPerPage ? 'rgba(100, 100, 100, 0.3)' : 'rgba(0, 212, 255, 0.2)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: blocks.length < blocksPerPage ? '#666' : '#00D4FF',
                            cursor: blocks.length < blocksPerPage ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Older →
                    </button>
                </div>
            </main>
        </div>
    );
}
