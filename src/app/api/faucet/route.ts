import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther } from 'viem';
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
            http: ['http://185.249.225.122:32834'],
        },
    },
};

// Faucet configuration
const FAUCET_AMOUNT = parseEther('10'); // 10 CSC per claim
const FAUCET_PRIVATE_KEY = '0x12d7de8621a77640c9241b2595ba78ce443d05e94090365ab3bb5e19df82c625';

// Rate limiting (in-memory for demo - use Redis in production)
const claimHistory = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        // Validate address
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
        }

        // Check rate limit
        const lastClaim = claimHistory.get(address.toLowerCase());
        if (lastClaim && Date.now() - lastClaim < COOLDOWN_MS) {
            const remainingTime = Math.ceil((COOLDOWN_MS - (Date.now() - lastClaim)) / 1000 / 60);
            return NextResponse.json({
                success: false,
                error: `Please wait ${remainingTime} minutes before claiming again`
            }, { status: 429 });
        }

        // Create wallet client
        const account = privateKeyToAccount(FAUCET_PRIVATE_KEY as `0x${string}`);
        const client = createWalletClient({
            account,
            chain: cscTestnet,
            transport: http(),
        });

        // Send transaction
        const hash = await client.sendTransaction({
            to: address as `0x${string}`,
            value: FAUCET_AMOUNT,
        });

        // Record claim
        claimHistory.set(address.toLowerCase(), Date.now());

        return NextResponse.json({
            success: true,
            txHash: hash,
            amount: '10',
        });
    } catch (error) {
        console.error('Faucet error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send tokens. Please try again later.'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        name: 'CSC Testnet Faucet',
        amount: '10 CSC',
        cooldown: '24 hours',
        status: 'active',
    });
}
