'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEther } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

interface Transaction {
    hash: string;
    blockNumber: string;
    from: string;
    to: string | null;
    value: string;
    timestamp?: number;
    type: 'in' | 'out' | 'self';
}

export default function AddressPage() {
    const params = useParams();
    const address = (params.addr as string)?.toLowerCase();

    const [balance, setBalance] = useState<string>('0');
    const [txCount, setTxCount] = useState<number>(0);
    const [isContract, setIsContract] = useState<boolean>(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (address) {
            fetchAddressInfo();
            fetchTransactions();
        }
    }, [address]);

    const fetchAddressInfo = async () => {
        try {
            // Get balance
            const balanceRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                    id: 1,
                }),
            });
            const balanceData = await balanceRes.json();
            if (balanceData.result) {
                setBalance(formatEther(BigInt(balanceData.result)));
            }

            // Get transaction count
            const txCountRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionCount',
                    params: [address, 'latest'],
                    id: 2,
                }),
            });
            const txCountData = await txCountRes.json();
            if (txCountData.result) {
                setTxCount(parseInt(txCountData.result, 16));
            }

            // Check if contract
            const codeRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getCode',
                    params: [address, 'latest'],
                    id: 3,
                }),
            });
            const codeData = await codeRes.json();
            setIsContract(codeData.result && codeData.result !== '0x');
        } catch (error) {
            console.error('Failed to fetch address info:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
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

            // Search more blocks to find transactions (up to 500 blocks)
            const addressTxs: Transaction[] = [];
            const blocksToSearch = Math.min(500, latestBlock);
            const batchSize = 10; // Fetch 10 blocks at a time

            for (let start = latestBlock; start > latestBlock - blocksToSearch && addressTxs.length < 50; start -= batchSize) {
                // Create batch RPC request for multiple blocks
                const batchRequests = [];
                for (let i = 0; i < batchSize && (start - i) > 0; i++) {
                    const blockNum = start - i;
                    batchRequests.push({
                        jsonrpc: '2.0',
                        method: 'eth_getBlockByNumber',
                        params: [`0x${blockNum.toString(16)}`, true],
                        id: blockNum,
                    });
                }

                try {
                    const batchRes = await fetch(RPC_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(batchRequests),
                    });
                    const batchData = await batchRes.json();

                    // Handle both array and single response
                    const results = Array.isArray(batchData) ? batchData : [batchData];

                    for (const blockData of results) {
                        if (blockData.result && blockData.result.transactions) {
                            const block = blockData.result;
                            const blockTimestamp = parseInt(block.timestamp, 16);

                            for (const tx of block.transactions) {
                                const fromMatch = tx.from?.toLowerCase() === address;
                                const toMatch = tx.to?.toLowerCase() === address;

                                if (fromMatch || toMatch) {
                                    addressTxs.push({
                                        ...tx,
                                        timestamp: blockTimestamp,
                                        type: fromMatch && toMatch ? 'self' : fromMatch ? 'out' : 'in',
                                    });
                                    if (addressTxs.length >= 50) break;
                                }
                            }
                        }
                    }
                } catch (batchError) {
                    // If batch fails, try individual requests
                    for (let i = 0; i < batchSize && (start - i) > 0 && addressTxs.length < 50; i++) {
                        const blockNum = start - i;
                        try {
                            const blockRes = await fetch(RPC_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    method: 'eth_getBlockByNumber',
                                    params: [`0x${blockNum.toString(16)}`, true],
                                    id: blockNum,
                                }),
                            });
                            const blockData = await blockRes.json();

                            if (blockData.result && blockData.result.transactions) {
                                const block = blockData.result;
                                const blockTimestamp = parseInt(block.timestamp, 16);

                                for (const tx of block.transactions) {
                                    const fromMatch = tx.from?.toLowerCase() === address;
                                    const toMatch = tx.to?.toLowerCase() === address;

                                    if (fromMatch || toMatch) {
                                        addressTxs.push({
                                            ...tx,
                                            timestamp: blockTimestamp,
                                            type: fromMatch && toMatch ? 'self' : fromMatch ? 'out' : 'in',
                                        });
                                        if (addressTxs.length >= 50) break;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Block fetch error:', err);
                        }
                    }
                }
            }

            // Sort by timestamp descending (newest first)
            addressTxs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setTransactions(addressTxs);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setTxLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (timestamp: number) => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const formatAddr = (addr: string | null) => {
        if (!addr) return 'Contract Creation';
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
                        <span className="text-xl font-bold text-white">Address</span>
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
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Address Header */}
                <div style={{
                    background: isContract
                        ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))'
                        : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1))',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: `1px solid ${isContract ? 'rgba(147, 51, 234, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px' }}>{isContract ? '📄' : '👤'}</span>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: isContract ? 'rgba(147, 51, 234, 0.2)' : 'rgba(0, 212, 255, 0.2)',
                            color: isContract ? '#a855f7' : '#00D4FF',
                            fontSize: '12px',
                            fontWeight: 'bold',
                        }}>
                            {isContract ? 'CONTRACT' : 'ADDRESS'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '18px',
                            color: 'white',
                            wordBreak: 'break-all',
                        }}>
                            {address}
                        </span>
                        <button
                            onClick={copyAddress}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                fontSize: '12px',
                            }}
                        >
                            {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Balance</div>
                        <div style={{ color: '#00D4FF', fontSize: '28px', fontWeight: 'bold' }}>
                            {loading ? '...' : parseFloat(balance).toFixed(4)}
                        </div>
                        <div style={{ color: '#888', fontSize: '14px' }}>CSC</div>
                    </div>

                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Transactions</div>
                        <div style={{ color: '#00FF88', fontSize: '28px', fontWeight: 'bold' }}>
                            {loading ? '...' : txCount.toLocaleString()}
                        </div>
                        <div style={{ color: '#888', fontSize: '14px' }}>Total Nonce</div>
                    </div>

                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Type</div>
                        <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: 'bold' }}>
                            {loading ? '...' : isContract ? 'Contract' : 'EOA'}
                        </div>
                        <div style={{ color: '#888', fontSize: '14px' }}>
                            {isContract ? 'Smart Contract' : 'Externally Owned'}
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                            📋 Recent Transactions
                        </h2>
                    </div>

                    {txLoading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            ⏳ Loading transactions...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                            No transactions found in recent blocks
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Tx Hash</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Block</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Type</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>From/To</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Value</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '13px', fontWeight: 'normal' }}>Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, i) => (
                                        <tr
                                            key={tx.hash}
                                            style={{
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                            }}
                                        >
                                            <td style={{ padding: '12px 16px' }}>
                                                <Link href={`/tx/${tx.hash}`} style={{ color: '#00D4FF', fontSize: '13px', fontFamily: 'monospace' }}>
                                                    {tx.hash.slice(0, 14)}...
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <Link href={`/block/${parseInt(tx.blockNumber, 16)}`} style={{ color: '#00FF88', fontSize: '13px' }}>
                                                    {parseInt(tx.blockNumber, 16).toLocaleString()}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    background: tx.type === 'in' ? 'rgba(0, 255, 136, 0.2)' : tx.type === 'out' ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 215, 0, 0.2)',
                                                    color: tx.type === 'in' ? '#00FF88' : tx.type === 'out' ? '#ff6464' : '#FFD700',
                                                }}>
                                                    {tx.type === 'in' ? 'IN' : tx.type === 'out' ? 'OUT' : 'SELF'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {tx.type === 'in' ? (
                                                    <span style={{ color: '#888', fontSize: '12px' }}>
                                                        From: <Link href={`/address/${tx.from}`} style={{ color: '#FFD700', fontFamily: 'monospace' }}>{formatAddr(tx.from)}</Link>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#888', fontSize: '12px' }}>
                                                        To: <Link href={`/address/${tx.to}`} style={{ color: '#FF69B4', fontFamily: 'monospace' }}>{formatAddr(tx.to)}</Link>
                                                    </span>
                                                )}
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

                {/* Quick Links */}
                {!isContract && (
                    <div style={{
                        marginTop: '24px',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <Link href="/faucet" style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'rgba(0, 212, 255, 0.1)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: '#00D4FF',
                            textDecoration: 'none',
                            fontSize: '14px',
                        }}>
                            💧 Get Free CSC
                        </Link>
                        <Link href="/rewards" style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            color: '#FFD700',
                            textDecoration: 'none',
                            fontSize: '14px',
                        }}>
                            🎁 Claim Rewards
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
