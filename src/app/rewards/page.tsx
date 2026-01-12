'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

interface RewardStatus {
    dailyTotal: string;
    dailyRemaining: string;
    transactionCount: number;
    canClaimMore: boolean;
}

interface ClaimResult {
    success: boolean;
    rewardTxHash?: string;
    rewardAmount?: string;
    dailyTotal?: string;
    dailyRemaining?: string;
    error?: string;
}

export default function RewardsPage() {
    const { address, isConnected } = useAccount();
    const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
    const [txHash, setTxHash] = useState('');

    // Fetch reward status
    const fetchRewardStatus = useCallback(async () => {
        if (!address) return;

        try {
            const res = await fetch(`/api/rewards?address=${address}`);
            const data = await res.json();
            setRewardStatus({
                dailyTotal: data.dailyTotal || '0',
                dailyRemaining: data.dailyRemaining || '10',
                transactionCount: data.transactionCount || 0,
                canClaimMore: data.canClaimMore !== false,
            });
        } catch (error) {
            console.error('Failed to fetch reward status:', error);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected && address) {
            fetchRewardStatus();
        }
    }, [isConnected, address, fetchRewardStatus]);

    // Claim reward
    const claimReward = async () => {
        if (!address) return;

        setClaiming(true);
        setClaimResult(null);

        try {
            const res = await fetch('/api/rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    txHash: txHash || undefined,
                }),
            });

            const data = await res.json();
            setClaimResult(data);

            if (data.success) {
                fetchRewardStatus();
                setTxHash('');
            }
        } catch (error) {
            setClaimResult({ success: false, error: 'Network error. Please try again.' });
        } finally {
            setClaiming(false);
        }
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
                        <span className="text-xl font-bold text-white">Transaction Rewards</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/faucet" className="text-gray-400 hover:text-white transition-colors">
                            Faucet
                        </Link>
                        <ConnectButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-12">
                {/* Hero Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1))',
                    borderRadius: '24px',
                    padding: '40px',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    marginBottom: '32px',
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '16px',
                    }}>
                        🎁 Transaction Rewards
                    </h1>
                    <p style={{ color: '#888', fontSize: '18px', marginBottom: '24px' }}>
                        Earn <span style={{ color: '#00D4FF', fontWeight: 'bold' }}>0.1 CSC</span> for every transaction!
                    </p>

                    {/* Reward Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '32px',
                    }}>
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Per Transaction</div>
                            <div style={{ color: '#00D4FF', fontSize: '24px', fontWeight: 'bold' }}>0.1 CSC</div>
                        </div>
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Daily Limit</div>
                            <div style={{ color: '#00FF88', fontSize: '24px', fontWeight: 'bold' }}>10 CSC</div>
                        </div>
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Reward Type</div>
                            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>Instant</div>
                        </div>
                    </div>
                </div>

                {/* Claim Section */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '24px',
                    padding: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    {!isConnected ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#888', marginBottom: '24px', fontSize: '18px' }}>
                                Connect your wallet to claim transaction rewards
                            </p>
                            <ConnectButton />
                        </div>
                    ) : (
                        <>
                            {/* User Status */}
                            {rewardStatus && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '16px',
                                    marginBottom: '24px',
                                }}>
                                    <div style={{
                                        background: 'rgba(0, 212, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ color: '#888', fontSize: '14px' }}>Today&apos;s Rewards</div>
                                        <div style={{ color: '#00D4FF', fontSize: '28px', fontWeight: 'bold' }}>
                                            {rewardStatus.dailyTotal} CSC
                                        </div>
                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                            {rewardStatus.transactionCount} transactions
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(0, 255, 136, 0.1)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ color: '#888', fontSize: '14px' }}>Remaining Today</div>
                                        <div style={{ color: '#00FF88', fontSize: '28px', fontWeight: 'bold' }}>
                                            {rewardStatus.dailyRemaining} CSC
                                        </div>
                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                            {rewardStatus.canClaimMore ? 'Can claim more!' : 'Limit reached'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TX Hash Input (Optional) */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    Transaction Hash (optional)
                                </label>
                                <input
                                    type="text"
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value)}
                                    placeholder="0x..."
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>

                            {/* Claim Button */}
                            <button
                                onClick={claimReward}
                                disabled={claiming || !!(rewardStatus && !rewardStatus.canClaimMore)}
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    background: claiming || (rewardStatus && !rewardStatus.canClaimMore)
                                        ? 'rgba(100, 100, 100, 0.5)'
                                        : 'linear-gradient(135deg, #00D4FF, #00FF88)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: claiming || (rewardStatus && !rewardStatus.canClaimMore) ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                            >
                                {claiming ? '⏳ Claiming...' :
                                    rewardStatus && !rewardStatus.canClaimMore ? '🚫 Daily Limit Reached' :
                                        '🎁 Claim 0.1 CSC Reward'}
                            </button>

                            {/* Claim Result */}
                            {claimResult && (
                                <div style={{
                                    marginTop: '24px',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: claimResult.success ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 100, 100, 0.1)',
                                    border: `1px solid ${claimResult.success ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 100, 100, 0.3)'}`,
                                }}>
                                    {claimResult.success ? (
                                        <>
                                            <div style={{ color: '#00FF88', fontWeight: 'bold', marginBottom: '8px' }}>
                                                ✅ Reward Claimed!
                                            </div>
                                            <div style={{ color: '#888', fontSize: '14px' }}>
                                                +{claimResult.rewardAmount} CSC
                                            </div>
                                            {claimResult.rewardTxHash && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <a
                                                        href={`https://testnet.cryptoscience.in/tx/${claimResult.rewardTxHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#00D4FF', fontSize: '12px' }}
                                                    >
                                                        View Transaction →
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ color: '#ff6464' }}>
                                            ❌ {claimResult.error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* How It Works */}
                <div style={{
                    marginTop: '32px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    padding: '24px',
                }}>
                    <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '20px' }}>
                        📖 How It Works
                    </h3>
                    <ol style={{ color: '#888', lineHeight: '2', paddingLeft: '20px' }}>
                        <li>Make any transaction on CSC Testnet</li>
                        <li>Come here and click &quot;Claim Reward&quot;</li>
                        <li>Receive 0.1 CSC instantly!</li>
                        <li>Claim up to 10 CSC per day</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}
