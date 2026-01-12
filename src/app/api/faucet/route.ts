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
            http: ['https://rpc.cryptoscience.in'],
        },
    },
};

// Faucet configuration
const FAUCET_AMOUNT = parseEther('10'); // 10 CSC per claim
const FAUCET_PRIVATE_KEY = '0x12d7de8621a77640c9241b2595ba78ce443d05e94090365ab3bb5e19df82c625';

// Rate limiting - Track both Address AND IP (in-memory for demo - use Redis in production)
const addressClaimHistory = new Map<string, number>();
const ipClaimHistory = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to get client IP
function getClientIP(request: NextRequest): string {
    // Check various headers for real IP (behind proxy/cloudflare)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (cfConnectingIp) return cfConnectingIp;
    if (realIp) return realIp;
    if (forwarded) return forwarded.split(',')[0].trim();

    return 'unknown';
}

// Helper to format remaining time
function formatRemainingTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.ceil((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
}

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();
        const clientIP = getClientIP(request);

        // Validate address
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
        }

        const now = Date.now();
        const addressLower = address.toLowerCase();

        // Check ADDRESS rate limit
        const lastAddressClaim = addressClaimHistory.get(addressLower);
        if (lastAddressClaim && now - lastAddressClaim < COOLDOWN_MS) {
            const remainingTime = formatRemainingTime(COOLDOWN_MS - (now - lastAddressClaim));
            return NextResponse.json({
                success: false,
                error: `This address already claimed. Please wait ${remainingTime} before claiming again.`
            }, { status: 429 });
        }

        // Check IP rate limit
        const lastIPClaim = ipClaimHistory.get(clientIP);
        if (lastIPClaim && now - lastIPClaim < COOLDOWN_MS) {
            const remainingTime = formatRemainingTime(COOLDOWN_MS - (now - lastIPClaim));
            return NextResponse.json({
                success: false,
                error: `You already claimed from this IP. Please wait ${remainingTime} before claiming again.`
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

        // Record claim for BOTH address AND IP
        addressClaimHistory.set(addressLower, now);
        ipClaimHistory.set(clientIP, now);

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
        rateLimit: 'Per address AND per IP',
        status: 'active',
    });
}
