'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEther, formatUnits } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';

// ERC20 ABI for basic queries
const ERC20_ABI = {
    name: '0x06fdde03',
    symbol: '0x95d89b41',
    decimals: '0x313ce567',
    totalSupply: '0x18160ddd',
    balanceOf: '0x70a08231',
};

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    isERC20: boolean;
}

interface Transfer {
    txHash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp?: number;
}

export default function TokenDetailPage() {
    const params = useParams();
    const tokenAddress = (params.addr as string)?.toLowerCase();

    const [token, setToken] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (tokenAddress) {
            fetchTokenInfo();
        }
    }, [tokenAddress]);

    const callContract = async (data: string): Promise<string | null> => {
        try {
            const res = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{ to: tokenAddress, data }, 'latest'],
                    id: 1,
                }),
            });
            const result = await res.json();
            return result.result;
        } catch {
            return null;
        }
    };

    const decodeString = (hex: string): string => {
        if (!hex || hex === '0x') return '';
        try {
            // Remove 0x and decode
            const data = hex.slice(2);
            // Skip offset and length (first 64 + 64 chars)
            const strData = data.slice(128);
            let result = '';
            for (let i = 0; i < strData.length; i += 2) {
                const charCode = parseInt(strData.substr(i, 2), 16);
                if (charCode === 0) break;
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch {
            return '';
        }
    };

    const fetchTokenInfo = async () => {
        try {
            // Check if it's a contract
            const codeRes = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getCode',
                    params: [tokenAddress, 'latest'],
                    id: 1,
                }),
            });
            const codeData = await codeRes.json();

            if (!codeData.result || codeData.result === '0x') {
                setError('Not a contract address');
                setLoading(false);
                return;
            }

            // Try to get ERC20 info
            const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.all([
                callContract(ERC20_ABI.name),
                callContract(ERC20_ABI.symbol),
                callContract(ERC20_ABI.decimals),
                callContract(ERC20_ABI.totalSupply),
            ]);

            const name = decodeString(nameResult || '') || 'Unknown Token';
            const symbol = decodeString(symbolResult || '') || '???';
            const decimals = decimalsResult ? parseInt(decimalsResult, 16) : 18;
            const totalSupply = totalSupplyResult ? BigInt(totalSupplyResult) : BigInt(0);

            setToken({
                address: tokenAddress,
                name,
                symbol,
                decimals,
                totalSupply: formatUnits(totalSupply, decimals),
                isERC20: !!(nameResult && symbolResult),
            });
        } catch (err) {
            setError('Failed to fetch token info');
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(tokenAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <span className="text-xl font-bold text-white">Token Details</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/tokens" className="text-gray-400 hover:text-white transition-colors">
                            All Tokens
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
                        ⏳ Loading token info...
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
                        <div style={{ marginTop: '16px' }}>
                            <Link href={`/address/${tokenAddress}`} style={{ color: '#00D4FF' }}>
                                View as address →
                            </Link>
                        </div>
                    </div>
                ) : token && (
                    <>
                        {/* Token Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px',
                            border: '1px solid rgba(0, 255, 136, 0.3)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                }}>
                                    🪙
                                </div>
                                <div>
                                    <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                                        {token.name}
                                    </h1>
                                    <div style={{ color: '#888', fontSize: '16px' }}>
                                        {token.symbol}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: token.isERC20 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 215, 0, 0.2)',
                                    color: token.isERC20 ? '#00FF88' : '#FFD700',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginLeft: 'auto',
                                }}>
                                    {token.isERC20 ? 'ERC-20' : 'Contract'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    color: '#888',
                                    wordBreak: 'break-all',
                                }}>
                                    {tokenAddress}
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

                        {/* Token Stats */}
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
                                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Total Supply</div>
                                <div style={{ color: '#00D4FF', fontSize: '24px', fontWeight: 'bold' }}>
                                    {parseFloat(token.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </div>
                                <div style={{ color: '#888', fontSize: '14px' }}>{token.symbol}</div>
                            </div>

                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Decimals</div>
                                <div style={{ color: '#00FF88', fontSize: '24px', fontWeight: 'bold' }}>
                                    {token.decimals}
                                </div>
                                <div style={{ color: '#888', fontSize: '14px' }}>Precision</div>
                            </div>

                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Token Type</div>
                                <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>
                                    {token.isERC20 ? 'ERC-20' : 'Unknown'}
                                </div>
                                <div style={{ color: '#888', fontSize: '14px' }}>Standard</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                🔗 Quick Links
                            </h2>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <Link href={`/address/${tokenAddress}`} style={{
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    background: 'rgba(0, 212, 255, 0.1)',
                                    border: '1px solid rgba(0, 212, 255, 0.3)',
                                    color: '#00D4FF',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}>
                                    📋 View Contract
                                </Link>
                                <Link href="/tokens" style={{
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    background: 'rgba(0, 255, 136, 0.1)',
                                    border: '1px solid rgba(0, 255, 136, 0.3)',
                                    color: '#00FF88',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}>
                                    🪙 All Tokens
                                </Link>
                                <Link href="/deploy" style={{
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    background: 'rgba(147, 51, 234, 0.1)',
                                    border: '1px solid rgba(147, 51, 234, 0.3)',
                                    color: '#a855f7',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}>
                                    🚀 Deploy Token
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
