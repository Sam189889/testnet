'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatUnits } from 'viem';

const RPC_URL = 'https://rpc.cryptoscience.in';
const ERC20_ABI = { name: '0x06fdde03', symbol: '0x95d89b41', decimals: '0x313ce567', totalSupply: '0x18160ddd' };

export default function TokenDetailPage() {
    const params = useParams();
    const tokenAddress = (params.addr as string)?.toLowerCase();
    const [token, setToken] = useState<{ name: string; symbol: string; decimals: number; totalSupply: string; isERC20: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { if (tokenAddress) fetchTokenInfo(); }, [tokenAddress]);

    const callContract = async (data: string) => {
        try {
            const res = await fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to: tokenAddress, data }, 'latest'], id: 1 }) });
            return (await res.json()).result;
        } catch { return null; }
    };

    const decodeString = (hex: string) => {
        if (!hex || hex === '0x') return '';
        try { const data = hex.slice(130); let result = ''; for (let i = 0; i < data.length; i += 2) { const c = parseInt(data.substr(i, 2), 16); if (c === 0) break; result += String.fromCharCode(c); } return result; } catch { return ''; }
    };

    const fetchTokenInfo = async () => {
        try {
            const codeRes = await fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getCode', params: [tokenAddress, 'latest'], id: 1 }) });
            const codeData = await codeRes.json();
            if (!codeData.result || codeData.result === '0x') { setError('Not a contract'); setLoading(false); return; }

            const [nameRes, symbolRes, decimalsRes, supplyRes] = await Promise.all([callContract(ERC20_ABI.name), callContract(ERC20_ABI.symbol), callContract(ERC20_ABI.decimals), callContract(ERC20_ABI.totalSupply)]);
            const decimals = decimalsRes ? parseInt(decimalsRes, 16) : 18;
            setToken({ name: decodeString(nameRes || '') || 'Unknown', symbol: decodeString(symbolRes || '') || '???', decimals, totalSupply: formatUnits(supplyRes ? BigInt(supplyRes) : BigInt(0), decimals), isERC20: !!(nameRes && symbolRes) });
        } catch { setError('Failed to fetch'); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}>
            <header style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3"><div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00D4FF, #00FF88)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>CSC</div><span className="text-xl font-bold text-white">Token</span></Link>
                    <Link href="/tokens" className="text-gray-400 hover:text-white">All Tokens</Link>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#888' }}>⏳ Loading...</div> : error ? <div style={{ background: 'rgba(255, 100, 100, 0.1)', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#ff6464', border: '1px solid rgba(255, 100, 100, 0.3)' }}>❌ {error}<br /><Link href={`/address/${tokenAddress}`} style={{ color: '#00D4FF' }}>View as address</Link></div> : token && (
                    <>
                        <div style={{ background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #00FF88, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🪙</div>
                                <div><h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>{token.name}</h1><div style={{ color: '#888' }}>{token.symbol}</div></div>
                                <span style={{ padding: '6px 14px', borderRadius: '20px', background: token.isERC20 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 215, 0, 0.2)', color: token.isERC20 ? '#00FF88' : '#FFD700', fontSize: '12px', fontWeight: 'bold', marginLeft: 'auto' }}>{token.isERC20 ? 'ERC-20' : 'Contract'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#888' }}>{tokenAddress}</span>
                                <button onClick={() => { navigator.clipboard.writeText(tokenAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}><div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Total Supply</div><div style={{ color: '#00D4FF', fontSize: '20px', fontWeight: 'bold' }}>{parseFloat(token.totalSupply).toLocaleString()}</div><div style={{ color: '#888', fontSize: '14px' }}>{token.symbol}</div></div>
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}><div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Decimals</div><div style={{ color: '#00FF88', fontSize: '20px', fontWeight: 'bold' }}>{token.decimals}</div></div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Link href={`/address/${tokenAddress}`} style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', color: '#00D4FF', textDecoration: 'none' }}>📋 View Contract</Link>
                            <Link href="/tokens" style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', color: '#00FF88', textDecoration: 'none' }}>🪙 All Tokens</Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
