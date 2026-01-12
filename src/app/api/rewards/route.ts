import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, formatEther, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// CSC Testnet chain config
const cscTestnet = {
    id: 2151908,
    name: 'Crypto Science Testnet',
    nativeCurrency: {
        name: 'Crypto Science Coin',
        symbol: 'CSC',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.cryptoscience.in'],
        },
    },
};

// Reward configuration
const REWARD_AMOUNT = parseEther('0.1'); // 0.1 CSC per transaction
const DAILY_LIMIT = parseEther('10'); // 10 CSC max per day per address
const REWARD_PRIVATE_KEY = '0x12d7de8621a77640c9241b2595ba78ce443d05e94090365ab3bb5e19df82c625';

// Rate limiting - Track rewards per address per day
interface RewardHistory {
    totalRewards: bigint;
    transactionCount: number;
    lastRewardTime: number;
    dayStart: number;
}

const rewardHistory = new Map<string, RewardHistory>();

// Helper to get day start timestamp
function getDayStart(): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
}

// Reset daily rewards if new day
function getOrCreateRewardHistory(address: string): RewardHistory {
    const addressLower = address.toLowerCase();
    const dayStart = getDayStart();

    let history = rewardHistory.get(addressLower);

    // Reset if new day
    if (!history || history.dayStart !== dayStart) {
        history = {
            totalRewards: BigInt(0),
            transactionCount: 0,
            lastRewardTime: 0,
            dayStart: dayStart,
        };
        rewardHistory.set(addressLower, history);
    }

    return history;
}

// Claim reward for a transaction
export async function POST(request: NextRequest) {
    try {
        const { address, txHash } = await request.json();

        // Validate address
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
        }

        // Validate transaction hash (optional but recommended)
        if (txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            return NextResponse.json({ success: false, error: 'Invalid transaction hash' }, { status: 400 });
        }

        const addressLower = address.toLowerCase();
        const history = getOrCreateRewardHistory(addressLower);

        // Check daily limit
        if (history.totalRewards >= DAILY_LIMIT) {
            return NextResponse.json({
                success: false,
                error: 'Daily reward limit reached (10 CSC). Try again tomorrow!',
                dailyTotal: formatEther(history.totalRewards),
                transactionCount: history.transactionCount,
            }, { status: 429 });
        }

        // Calculate reward amount (might be less if near limit)
        const remainingAllowance = DAILY_LIMIT - history.totalRewards;
        const actualReward = remainingAllowance < REWARD_AMOUNT ? remainingAllowance : REWARD_AMOUNT;

        // Create wallet client
        const account = privateKeyToAccount(REWARD_PRIVATE_KEY as `0x${string}`);
        const client = createWalletClient({
            account,
            chain: cscTestnet,
            transport: http(),
        });

        // Send reward
        const rewardTxHash = await client.sendTransaction({
            to: address as `0x${string}`,
            value: actualReward,
        });

        // Update history
        history.totalRewards = history.totalRewards + actualReward;
        history.transactionCount += 1;
        history.lastRewardTime = Date.now();
        rewardHistory.set(addressLower, history);

        return NextResponse.json({
            success: true,
            rewardTxHash: rewardTxHash,
            rewardAmount: formatEther(actualReward),
            dailyTotal: formatEther(history.totalRewards),
            dailyRemaining: formatEther(DAILY_LIMIT - history.totalRewards),
            transactionCount: history.transactionCount,
        });
    } catch (error) {
        console.error('Reward error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send reward. Please try again later.'
        }, { status: 500 });
    }
}

// Get reward status for an address
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return NextResponse.json({
            name: 'CSC Transaction Rewards',
            rewardPerTx: '0.1 CSC',
            dailyLimit: '10 CSC',
            status: 'active',
        });
    }

    const history = getOrCreateRewardHistory(address);

    return NextResponse.json({
        name: 'CSC Transaction Rewards',
        rewardPerTx: '0.1 CSC',
        dailyLimit: '10 CSC',
        status: 'active',
        address: address.toLowerCase(),
        dailyTotal: formatEther(history.totalRewards),
        dailyRemaining: formatEther(DAILY_LIMIT - history.totalRewards),
        transactionCount: history.transactionCount,
        canClaimMore: history.totalRewards < DAILY_LIMIT,
    });
}
