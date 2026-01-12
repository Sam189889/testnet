'use client';

import { useState } from 'react';
import Link from 'next/link';

const NETWORK_CONFIG = {
    name: 'Crypto Science Testnet',
    chainId: 2151908,
    chainIdHex: '0x20d5e4',
    rpcUrl: 'https://rpc.cryptoscience.in',
    wsUrl: 'wss://rpc.cryptoscience.in',
    explorer: 'https://testnet.cryptoscience.in',
    symbol: 'CSC',
    decimals: 18,
};

const CODE_SNIPPETS = {
    hardhat: `// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    cscTestnet: {
      url: "${NETWORK_CONFIG.rpcUrl}",
      chainId: ${NETWORK_CONFIG.chainId},
      accounts: [process.env.PRIVATE_KEY!],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      cscTestnet: "any-string" // verification API coming soon
    },
    customChains: [{
      network: "cscTestnet",
      chainId: ${NETWORK_CONFIG.chainId},
      urls: {
        apiURL: "${NETWORK_CONFIG.explorer}/api",
        browserURL: "${NETWORK_CONFIG.explorer}"
      }
    }]
  }
};

export default config;

// Deploy command:
// npx hardhat run scripts/deploy.ts --network cscTestnet`,

    forge: `// foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.19"

[rpc_endpoints]
csc_testnet = "${NETWORK_CONFIG.rpcUrl}"

[etherscan]
csc_testnet = { key = "any-string", chain = ${NETWORK_CONFIG.chainId}, url = "${NETWORK_CONFIG.explorer}/api" }

# Deploy command:
# forge create --rpc-url csc_testnet \\
#   --private-key $PRIVATE_KEY \\
#   src/MyContract.sol:MyContract

# Verify command (coming soon):
# forge verify-contract --chain-id ${NETWORK_CONFIG.chainId} \\
#   --etherscan-api-key any-string \\
#   <CONTRACT_ADDRESS> src/MyContract.sol:MyContract`,

    ethersjs: `// ethers.js v6
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('${NETWORK_CONFIG.rpcUrl}');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Deploy contract
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

console.log('Contract deployed at:', await contract.getAddress());`,

    viem: `// viem
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const cscTestnet = {
  id: ${NETWORK_CONFIG.chainId},
  name: '${NETWORK_CONFIG.name}',
  nativeCurrency: { name: 'CSC', symbol: 'CSC', decimals: 18 },
  rpcUrls: {
    default: { http: ['${NETWORK_CONFIG.rpcUrl}'] }
  },
  blockExplorers: {
    default: { name: 'CSC Explorer', url: '${NETWORK_CONFIG.explorer}' }
  }
};

const account = privateKeyToAccount('0x...');
const client = createWalletClient({
  account,
  chain: cscTestnet,
  transport: http()
});

// Deploy contract
const hash = await client.deployContract({
  abi,
  bytecode,
  args: []
});`,

    web3js: `// web3.js
const Web3 = require('web3');

const web3 = new Web3('${NETWORK_CONFIG.rpcUrl}');
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Deploy contract
const contract = new web3.eth.Contract(abi);
const deployed = await contract.deploy({ data: bytecode })
  .send({ from: account.address, gas: 3000000 });

console.log('Contract deployed at:', deployed.options.address);`,

    truffle: `// truffle-config.js
module.exports = {
  networks: {
    cscTestnet: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        '${NETWORK_CONFIG.rpcUrl}'
      ),
      network_id: ${NETWORK_CONFIG.chainId},
      gas: 5000000,
      gasPrice: 1000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.19"
    }
  }
};

// Deploy command:
// truffle migrate --network cscTestnet`,

    metamask: `// Add to MetaMask programmatically
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '${NETWORK_CONFIG.chainIdHex}',
    chainName: '${NETWORK_CONFIG.name}',
    nativeCurrency: {
      name: 'Crypto Science Coin',
      symbol: '${NETWORK_CONFIG.symbol}',
      decimals: ${NETWORK_CONFIG.decimals}
    },
    rpcUrls: ['${NETWORK_CONFIG.rpcUrl}'],
    blockExplorerUrls: ['${NETWORK_CONFIG.explorer}']
  }]
});`,

    curl: `# Get latest block number
curl -X POST ${NETWORK_CONFIG.rpcUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get account balance
curl -X POST ${NETWORK_CONFIG.rpcUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS","latest"],"id":1}'

# Get gas price
curl -X POST ${NETWORK_CONFIG.rpcUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'`
};

type TabKey = keyof typeof CODE_SNIPPETS;

export default function DocsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('hardhat');
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'hardhat', label: 'Hardhat', icon: '🔨' },
        { key: 'forge', label: 'Forge', icon: '🔥' },
        { key: 'ethersjs', label: 'ethers.js', icon: '📦' },
        { key: 'viem', label: 'viem', icon: '⚡' },
        { key: 'web3js', label: 'web3.js', icon: '🌐' },
        { key: 'truffle', label: 'Truffle', icon: '🍫' },
        { key: 'metamask', label: 'MetaMask', icon: '🦊' },
        { key: 'curl', label: 'cURL', icon: '💻' },
    ];

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
                        <span className="text-xl font-bold text-white">Developer Docs</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/faucet" className="text-gray-400 hover:text-white transition-colors">
                            Faucet
                        </Link>
                        <Link href="/deploy" className="text-gray-400 hover:text-white transition-colors">
                            Deploy
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px',
                    textAlign: 'center',
                }}>
                    📚 Developer Documentation
                </h1>
                <p style={{ color: '#888', textAlign: 'center', marginBottom: '32px' }}>
                    Integrate CSC Testnet with your favorite tools
                </p>

                {/* Network Info Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }}>
                    {[
                        { label: 'Network Name', value: NETWORK_CONFIG.name },
                        { label: 'Chain ID', value: `${NETWORK_CONFIG.chainId} (${NETWORK_CONFIG.chainIdHex})` },
                        { label: 'RPC URL', value: NETWORK_CONFIG.rpcUrl, copy: true },
                        { label: 'Symbol', value: NETWORK_CONFIG.symbol },
                        { label: 'Explorer', value: NETWORK_CONFIG.explorer, link: true },
                        { label: 'Decimals', value: String(NETWORK_CONFIG.decimals) },
                    ].map((item, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>{item.label}</div>
                            {item.link ? (
                                <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: '#00D4FF', fontSize: '14px', wordBreak: 'break-all' }}>
                                    {item.value}
                                </a>
                            ) : item.copy ? (
                                <div
                                    onClick={() => copyToClipboard(item.value)}
                                    style={{ color: '#00FF88', fontSize: '14px', cursor: 'pointer', wordBreak: 'break-all' }}
                                    title="Click to copy"
                                >
                                    {item.value} 📋
                                </div>
                            ) : (
                                <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{item.value}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingBottom: '16px',
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    background: activeTab === tab.key ? 'linear-gradient(135deg, #00D4FF, #00FF88)' : 'rgba(255, 255, 255, 0.05)',
                                    border: activeTab === tab.key ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    color: activeTab === tab.key ? 'black' : '#888',
                                    fontSize: '14px',
                                    fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Code Block */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => copyToClipboard(CODE_SNIPPETS[activeTab])}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'rgba(0, 212, 255, 0.2)',
                                border: '1px solid rgba(0, 212, 255, 0.3)',
                                color: '#00D4FF',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                        <pre style={{
                            background: '#0d0d0d',
                            borderRadius: '12px',
                            padding: '24px',
                            paddingTop: '48px',
                            color: '#00FF88',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxHeight: '500px',
                            lineHeight: '1.6',
                        }}>
                            {CODE_SNIPPETS[activeTab]}
                        </pre>
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{
                    marginTop: '32px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                }}>
                    <Link href="/faucet" style={{
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1))',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        textDecoration: 'none',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>💧</div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Get Test CSC</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>Free testnet tokens</div>
                    </Link>
                    <Link href="/deploy" style={{
                        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(147, 51, 234, 0.3)',
                        textDecoration: 'none',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Deploy Contract</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>Browser-based deploy</div>
                    </Link>
                    <Link href="/rewards" style={{
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        textDecoration: 'none',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎁</div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Earn Rewards</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>0.1 CSC per transaction</div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
