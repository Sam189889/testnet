'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEther, formatGwei } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface TransactionDetails {
    hash: string;
    blockNumber: string;
    blockHash: string;
    from: string;
    to: string | null;
    value: string;
    gas: string;
    gasPrice: string;
    nonce: string;
    transactionIndex: string;
    input: string;
    type: string;
    v: string;
    r: string;
    s: string;
}

interface TransactionReceipt {
    status: string;
    gasUsed: string;
    effectiveGasPrice: string;
    contractAddress: string | null;
    logs: Array<{
        address: string;
        topics: string[];
        data: string;
        logIndex: string;
    }>;
}

interface BlockInfo {
    timestamp: string;
}

export default function TransactionDetailPage() {
    const params = useParams();
    const hash = params.hash as string;

    const [tx, setTx] = useState<TransactionDetails | null>(null);
    const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
    const [blockTimestamp, setBlockTimestamp] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (hash) {
            fetchTransactionDetails();
        }
    }, [hash]);

    const fetchTransactionDetails = async () => {
        try {
            // Fetch transaction
            const txRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionByHash',
                    params: [hash],
                    id: 1,
                }),
            });
            const txData = await txRes.json();

            if (!txData.result) {
                setError('Transaction not found');
                setLoading(false);
                return;
            }

            setTx(txData.result);

            // Fetch receipt
            const receiptRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [hash],
                    id: 2,
                }),
            });
            const receiptData = await receiptRes.json();
            if (receiptData.result) {
                setReceipt(receiptData.result);
            }

            // Fetch block for timestamp
            if (txData.result.blockNumber) {
                const blockRes = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_getBlockByNumber',
                        params: [txData.result.blockNumber, false],
                        id: 3,
                    }),
                });
                const blockData = await blockRes.json();
                if (blockData.result) {
                    setBlockTimestamp(parseInt(blockData.result.timestamp, 16));
                }
            }
        } catch (err) {
            setError('Failed to fetch transaction details');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;

        let ago = '';
        if (diff < 60) ago = `${diff} secs ago`;
        else if (diff < 3600) ago = `${Math.floor(diff / 60)} mins ago`;
        else if (diff < 86400) ago = `${Math.floor(diff / 3600)} hrs ago`;
        else ago = `${Math.floor(diff / 86400)} days ago`;

        return `${ago} (${date.toLocaleString()})`;
    };

    const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{
            display: 'flex',
            padding: '16px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
            <div style={{ width: '200px', color: '#888', fontSize: '14px', flexShrink: 0 }}>
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
                        <span className="text-xl font-bold text-white">Transaction Details</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/txs" className="text-gray-400 hover:text-white transition-colors">
                            All Transactions
                        </Link>
                        <Link href="/blocks" className="text-gray-400 hover:text-white transition-colors">
                            Blocks
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
                        ⏳ Loading transaction details...
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
                ) : tx && (
                    <>
                        {/* Status Banner */}
                        <div style={{
                            background: receipt?.status === '0x1'
                                ? 'rgba(0, 255, 136, 0.1)'
                                : receipt?.status === '0x0'
                                    ? 'rgba(255, 100, 100, 0.1)'
                                    : 'rgba(255, 215, 0, 0.1)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: `1px solid ${receipt?.status === '0x1'
                                    ? 'rgba(0, 255, 136, 0.3)'
                                    : receipt?.status === '0x0'
                                        ? 'rgba(255, 100, 100, 0.3)'
                                        : 'rgba(255, 215, 0, 0.3)'
                                }`,
                        }}>
                            <span style={{ fontSize: '24px' }}>
                                {receipt?.status === '0x1' ? '✅' : receipt?.status === '0x0' ? '❌' : '⏳'}
                            </span>
                            <div>
                                <div style={{
                                    color: receipt?.status === '0x1' ? '#00FF88' : receipt?.status === '0x0' ? '#ff6464' : '#FFD700',
                                    fontWeight: 'bold',
                                }}>
                                    {receipt?.status === '0x1' ? 'Success' : receipt?.status === '0x0' ? 'Failed' : 'Pending'}
                                </div>
                                {blockTimestamp && (
                                    <div style={{ color: '#888', fontSize: '12px' }}>
                                        {formatTime(blockTimestamp)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transaction Info */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '24px',
                        }}>
                            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                📋 Transaction Information
                            </h2>

                            <InfoRow label="Transaction Hash">
                                <span style={{ fontFamily: 'monospace', color: '#00D4FF' }}>{tx.hash}</span>
                            </InfoRow>

                            <InfoRow label="Status">
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    background: receipt?.status === '0x1' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 100, 100, 0.2)',
                                    color: receipt?.status === '0x1' ? '#00FF88' : '#ff6464',
                                    fontSize: '12px',
                                }}>
                                    {receipt?.status === '0x1' ? '✓ Success' : receipt?.status === '0x0' ? '✗ Failed' : 'Pending'}
                                </span>
                            </InfoRow>

                            <InfoRow label="Block">
                                <Link href={`/block/${parseInt(tx.blockNumber, 16)}`} style={{ color: '#00FF88' }}>
                                    {parseInt(tx.blockNumber, 16).toLocaleString()}
                                </Link>
                            </InfoRow>

                            <InfoRow label="From">
                                <Link href={`/address/${tx.from}`} style={{ color: '#FFD700', fontFamily: 'monospace' }}>
                                    {tx.from}
                                </Link>
                            </InfoRow>

                            <InfoRow label="To">
                                {tx.to ? (
                                    <Link href={`/address/${tx.to}`} style={{ color: '#FF69B4', fontFamily: 'monospace' }}>
                                        {tx.to}
                                    </Link>
                                ) : (
                                    <span style={{ color: '#888' }}>
                                        📄 Contract Creation
                                        {receipt?.contractAddress && (
                                            <>
                                                {' → '}
                                                <Link href={`/address/${receipt.contractAddress}`} style={{ color: '#00D4FF' }}>
                                                    {receipt.contractAddress}
                                                </Link>
                                            </>
                                        )}
                                    </span>
                                )}
                            </InfoRow>

                            <InfoRow label="Value">
                                <span style={{ color: '#00D4FF', fontWeight: 'bold' }}>
                                    {formatEther(BigInt(tx.value))} CSC
                                </span>
                            </InfoRow>

                            <InfoRow label="Transaction Fee">
                                {receipt && (
                                    <span>
                                        {formatEther(BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice || tx.gasPrice))} CSC
                                    </span>
                                )}
                            </InfoRow>

                            <InfoRow label="Gas Price">
                                {formatGwei(BigInt(tx.gasPrice))} Gwei
                            </InfoRow>

                            <InfoRow label="Gas Limit">
                                {parseInt(tx.gas, 16).toLocaleString()}
                            </InfoRow>

                            {receipt && (
                                <InfoRow label="Gas Used">
                                    {parseInt(receipt.gasUsed, 16).toLocaleString()} ({((parseInt(receipt.gasUsed, 16) / parseInt(tx.gas, 16)) * 100).toFixed(2)}%)
                                </InfoRow>
                            )}

                            <InfoRow label="Nonce">
                                {parseInt(tx.nonce, 16)}
                            </InfoRow>

                            <InfoRow label="Position in Block">
                                {parseInt(tx.transactionIndex, 16)}
                            </InfoRow>
                        </div>

                        {/* Input Data */}
                        {tx.input && tx.input !== '0x' && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                marginBottom: '24px',
                            }}>
                                <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                    📝 Input Data
                                </h2>
                                <pre style={{
                                    background: '#0d0d0d',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    color: '#00FF88',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    wordBreak: 'break-all',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {tx.input}
                                </pre>
                            </div>
                        )}

                        {/* Logs */}
                        {receipt && receipt.logs.length > 0 && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                    📊 Transaction Logs ({receipt.logs.length})
                                </h2>
                                {receipt.logs.map((log, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginBottom: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                        }}
                                    >
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ color: '#888', fontSize: '12px' }}>Log #{i}: </span>
                                            <Link href={`/address/${log.address}`} style={{ color: '#00D4FF', fontSize: '12px', fontFamily: 'monospace' }}>
                                                {log.address}
                                            </Link>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            Topics: {log.topics.length}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
