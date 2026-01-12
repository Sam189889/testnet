'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEther } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface BlockDetails {
    number: string;
    hash: string;
    parentHash: string;
    timestamp: string;
    miner: string;
    gasUsed: string;
    gasLimit: string;
    baseFeePerGas?: string;
    difficulty: string;
    totalDifficulty: string;
    size: string;
    nonce: string;
    extraData: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    transactions: Transaction[];
}

interface Transaction {
    hash: string;
    from: string;
    to: string | null;
    value: string;
}

export default function BlockDetailPage() {
    const params = useParams();
    const blockNumber = params.number as string;

    const [block, setBlock] = useState<BlockDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTxs, setShowTxs] = useState(true);

    useEffect(() => {
        if (blockNumber) {
            fetchBlockDetails();
        }
    }, [blockNumber]);

    const fetchBlockDetails = async () => {
        try {
            const blockHex = `0x${parseInt(blockNumber).toString(16)}`;

            const res = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBlockByNumber',
                    params: [blockHex, true], // true = include full transactions
                    id: 1,
                }),
            });
            const data = await res.json();

            if (!data.result) {
                setError('Block not found');
                setLoading(false);
                return;
            }

            setBlock(data.result);
        } catch (err) {
            setError('Failed to fetch block details');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const ts = parseInt(timestamp, 16);
        const date = new Date(ts * 1000);
        const now = Math.floor(Date.now() / 1000);
        const diff = now - ts;

        let ago = '';
        if (diff < 60) ago = `${diff} secs ago`;
        else if (diff < 3600) ago = `${Math.floor(diff / 60)} mins ago`;
        else if (diff < 86400) ago = `${Math.floor(diff / 3600)} hrs ago`;
        else ago = `${Math.floor(diff / 86400)} days ago`;

        return `${ago} (${date.toLocaleString()})`;
    };

    const formatAddress = (addr: string | null) => {
        if (!addr) return 'Contract Creation';
        return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
    };

    const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{
            display: 'flex',
            padding: '14px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
            <div style={{ width: '180px', color: '#888', fontSize: '14px', flexShrink: 0 }}>
                {label}
            </div>
            <div style={{ flex: 1, color: 'white', fontSize: '14px', wordBreak: 'break-all' }}>
                {children}
            </div>
        </div>
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
                        <span className="text-xl font-bold text-white">Block Details</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/blocks" className="text-gray-400 hover:text-white transition-colors">
                            All Blocks
                        </Link>
                        <Link href="/txs" className="text-gray-400 hover:text-white transition-colors">
                            Transactions
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '48px',
                        textAlign: 'center',
                        color: '#888',
                    }}>
                        ⏳ Loading block details...
                    </div>
                ) : error ? (
                    <div style={{
                        background: 'rgba(255, 100, 100, 0.1)',
                        borderRadius: '16px',
                        padding: '48px',
                        textAlign: 'center',
                        color: '#ff6464',
                        border: '1px solid rgba(255, 100, 100, 0.3)',
                    }}>
                        ❌ {error}
                    </div>
                ) : block && (
                    <>
                        {/* Block Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1))',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px',
                        }}>
                            <div>
                                <div style={{ color: '#888', fontSize: '14px' }}>Block Number</div>
                                <div style={{ color: '#00D4FF', fontSize: '32px', fontWeight: 'bold' }}>
                                    #{parseInt(block.number, 16).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link
                                    href={`/block/${parseInt(block.number, 16) - 1}`}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#888',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                    }}
                                >
                                    ← Previous
                                </Link>
                                <Link
                                    href={`/block/${parseInt(block.number, 16) + 1}`}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#888',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                    }}
                                >
                                    Next →
                                </Link>
                            </div>
                        </div>

                        {/* Block Info */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '24px',
                        }}>
                            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                📦 Block Information
                            </h2>

                            <InfoRow label="Block Hash">
                                <span style={{ fontFamily: 'monospace', color: '#00D4FF', fontSize: '12px' }}>{block.hash}</span>
                            </InfoRow>

                            <InfoRow label="Timestamp">
                                {formatTime(block.timestamp)}
                            </InfoRow>

                            <InfoRow label="Transactions">
                                <span style={{ color: '#00FF88', fontWeight: 'bold' }}>
                                    {block.transactions.length} transactions
                                </span>
                            </InfoRow>

                            <InfoRow label="Validated By">
                                <Link href={`/address/${block.miner}`} style={{ color: '#FFD700', fontFamily: 'monospace' }}>
                                    {block.miner}
                                </Link>
                            </InfoRow>

                            <InfoRow label="Gas Used">
                                {parseInt(block.gasUsed, 16).toLocaleString()}
                                <span style={{ color: '#888' }}>
                                    {' '}({((parseInt(block.gasUsed, 16) / parseInt(block.gasLimit, 16)) * 100).toFixed(2)}%)
                                </span>
                            </InfoRow>

                            <InfoRow label="Gas Limit">
                                {parseInt(block.gasLimit, 16).toLocaleString()}
                            </InfoRow>

                            {block.baseFeePerGas && (
                                <InfoRow label="Base Fee">
                                    {(parseInt(block.baseFeePerGas, 16) / 1e9).toFixed(4)} Gwei
                                </InfoRow>
                            )}

                            <InfoRow label="Block Size">
                                {parseInt(block.size, 16).toLocaleString()} bytes
                            </InfoRow>

                            <InfoRow label="Parent Hash">
                                <Link href={`/block/${parseInt(block.number, 16) - 1}`} style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {block.parentHash}
                                </Link>
                            </InfoRow>

                            <InfoRow label="State Root">
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{block.stateRoot}</span>
                            </InfoRow>
                        </div>

                        {/* Transactions in Block */}
                        {block.transactions.length > 0 && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                            }}>
                                <div
                                    onClick={() => setShowTxs(!showTxs)}
                                    style={{
                                        padding: '20px 24px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                                        📋 Transactions ({block.transactions.length})
                                    </h2>
                                    <span style={{ color: '#888' }}>{showTxs ? '▼' : '►'}</span>
                                </div>

                                {showTxs && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Tx Hash</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>From</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>To</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {block.transactions.map((tx, i) => (
                                                    <tr
                                                        key={tx.hash}
                                                        style={{
                                                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                            background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                                        }}
                                                    >
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <Link href={`/tx/${tx.hash}`} style={{ color: '#00D4FF', fontSize: '13px', fontFamily: 'monospace' }}>
                                                                {tx.hash.slice(0, 16)}...
                                                            </Link>
                                                        </td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <Link href={`/address/${tx.from}`} style={{ color: '#FFD700', fontSize: '12px', fontFamily: 'monospace' }}>
                                                                {formatAddress(tx.from)}
                                                            </Link>
                                                        </td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            {tx.to ? (
                                                                <Link href={`/address/${tx.to}`} style={{ color: '#FF69B4', fontSize: '12px', fontFamily: 'monospace' }}>
                                                                    {formatAddress(tx.to)}
                                                                </Link>
                                                            ) : (
                                                                <span style={{ color: '#888', fontSize: '12px' }}>📄 Contract</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontSize: '13px' }}>
                                                            {parseFloat(formatEther(BigInt(tx.value))).toFixed(4)} CSC
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
