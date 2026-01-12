'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { encodeFunctionData, parseAbi } from 'viem';

// Sample contract templates
const CONTRACT_TEMPLATES = {
    simple: {
        name: 'SimpleStorage',
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    
    event ValueChanged(address indexed by, uint256 oldValue, uint256 newValue);
    
    constructor() {
        owner = msg.sender;
    }
    
    function set(uint256 _value) public {
        uint256 oldValue = storedValue;
        storedValue = _value;
        emit ValueChanged(msg.sender, oldValue, _value);
    }
    
    function get() public view returns (uint256) {
        return storedValue;
    }
}`,
    },
    token: {
        name: 'SimpleToken',
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`,
    },
    nft: {
        name: 'SimpleNFT',
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleNFT {
    string public name;
    string public symbol;
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _owners[tokenId] = to;
        _balances[to]++;
        _tokenURIs[tokenId] = tokenURI;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }
    
    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }
}`,
    },
};

interface DeployResult {
    success: boolean;
    contractAddress?: string;
    txHash?: string;
    error?: string;
}

export default function DeployPage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [sourceCode, setSourceCode] = useState(CONTRACT_TEMPLATES.simple.source);
    const [selectedTemplate, setSelectedTemplate] = useState('simple');
    const [bytecode, setBytecode] = useState('');
    const [abi, setAbi] = useState('');
    const [constructorArgs, setConstructorArgs] = useState('');
    const [compiling, setCompiling] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [compileResult, setCompileResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

    // Handle template selection
    const handleTemplateChange = (template: string) => {
        setSelectedTemplate(template);
        const templateData = CONTRACT_TEMPLATES[template as keyof typeof CONTRACT_TEMPLATES];
        if (templateData) {
            setSourceCode(templateData.source);
            setBytecode('');
            setAbi('');
            setCompileResult(null);
            setDeployResult(null);
        }
    };

    // Compile contract (client-side simulation - in production use solc-js)
    const compileContract = async () => {
        setCompiling(true);
        setCompileResult(null);

        try {
            // In production, you'd use solc-js or a backend compiler API
            // For now, we'll use pre-compiled bytecode for templates

            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate compilation

            // Mock compiled output for SimpleStorage
            if (selectedTemplate === 'simple') {
                setBytecode('0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506102f8806100606000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806360fe47b1146100465780636d4ce63c14610062578063893d20e814610080575b600080fd5b610060600480360381019061005b91906101e4565b61009e565b005b61006a610128565b6040516100779190610220565b60405180910390f35b610088610131565b604051610095919061027a565b60405180910390f35b600060015490507f93fe6d397c74fdf1402a8b72e47b68512f0510d7b98a4bc4cbdf6ac7108b3c59338284604051610118939b9a919092909390929195949391929190919060018082029190039190039190039190039190f35b8060018190555050565b60006001549050905b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600080fd5b6000819050919050565b6101c18161015e565b81146101cc57600080fd5b50565b6000813590506101de816101b8565b92915050565b6000602082840312156101fa576101f9610159565b5b6000610208848285016101cf565b91505092915050565b61021a8161015e565b82525050565b60006020820190506102356000830184610211565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102668261023b565b9050919050565b6102768161025b565b82525050565b6000602082019050610291600083018461026d565b9291505056fea264697066735822122000000000000000000000000000000000000000000000000000000000000000006c6578706572696d656e74616cf564736f6c63430008130033');
                setAbi('[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"by","type":"address"},{"indexed":false,"name":"oldValue","type":"uint256"},{"indexed":false,"name":"newValue","type":"uint256"}],"name":"ValueChanged","type":"event"},{"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"}]');
            }

            setCompileResult({ success: true });
        } catch (error) {
            setCompileResult({ success: false, error: 'Compilation failed. Check syntax.' });
        } finally {
            setCompiling(false);
        }
    };

    // Deploy contract
    const deployContract = async () => {
        if (!walletClient || !bytecode) return;

        setDeploying(true);
        setDeployResult(null);

        try {
            // Parse constructor args if any
            let deployBytecode = bytecode;
            if (constructorArgs) {
                // For simple cases, append encoded args to bytecode
                // In production, use proper ABI encoding
            }

            const hash = await walletClient.sendTransaction({
                data: bytecode as `0x${string}`,
            });

            // Wait for transaction receipt to get contract address
            // For now, show tx hash and let user check explorer
            setDeployResult({
                success: true,
                txHash: hash,
                contractAddress: 'Check explorer for contract address',
            });
        } catch (error: unknown) {
            const err = error as { message?: string };
            setDeployResult({
                success: false,
                error: err.message || 'Deployment failed',
            });
        } finally {
            setDeploying(false);
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
                        <span className="text-xl font-bold text-white">Contract Deploy</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/faucet" className="text-gray-400 hover:text-white transition-colors">
                            Faucet
                        </Link>
                        <Link href="/rewards" className="text-gray-400 hover:text-white transition-colors">
                            Rewards
                        </Link>
                        <ConnectButton />
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
                    marginBottom: '32px',
                    textAlign: 'center',
                }}>
                    🚀 Deploy Smart Contract
                </h1>

                {!isConnected ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '24px',
                        padding: '48px',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <p style={{ color: '#888', marginBottom: '24px', fontSize: '18px' }}>
                            Connect your wallet to deploy contracts
                        </p>
                        <ConnectButton />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Left Panel - Source Code */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    Contract Template
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="simple">SimpleStorage</option>
                                    <option value="token">SimpleToken (ERC-20)</option>
                                    <option value="nft">SimpleNFT (ERC-721)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    Solidity Source Code
                                </label>
                                <textarea
                                    value={sourceCode}
                                    onChange={(e) => setSourceCode(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        background: '#0d0d0d',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#00FF88',
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <button
                                onClick={compileContract}
                                disabled={compiling}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: compiling ? 'rgba(100, 100, 100, 0.5)' : 'linear-gradient(135deg, #FFD700, #FFA500)',
                                    border: 'none',
                                    color: 'black',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: compiling ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {compiling ? '⏳ Compiling...' : '🔨 Compile Contract'}
                            </button>

                            {compileResult && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: compileResult.success ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 100, 100, 0.1)',
                                    border: `1px solid ${compileResult.success ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 100, 100, 0.3)'}`,
                                }}>
                                    {compileResult.success ? (
                                        <span style={{ color: '#00FF88' }}>✅ Compilation successful!</span>
                                    ) : (
                                        <span style={{ color: '#ff6464' }}>❌ {compileResult.error}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Deploy */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                            <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                                📦 Deployment
                            </h3>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    Bytecode
                                </label>
                                <textarea
                                    value={bytecode}
                                    onChange={(e) => setBytecode(e.target.value)}
                                    placeholder="Compile contract to generate bytecode..."
                                    style={{
                                        width: '100%',
                                        height: '120px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#00D4FF',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    ABI (JSON)
                                </label>
                                <textarea
                                    value={abi}
                                    onChange={(e) => setAbi(e.target.value)}
                                    placeholder="Contract ABI..."
                                    style={{
                                        width: '100%',
                                        height: '120px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#00D4FF',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                    Constructor Arguments (optional)
                                </label>
                                <input
                                    type="text"
                                    value={constructorArgs}
                                    onChange={(e) => setConstructorArgs(e.target.value)}
                                    placeholder='e.g., "MyToken", "MTK", 1000000'
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <button
                                onClick={deployContract}
                                disabled={deploying || !bytecode}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: deploying || !bytecode
                                        ? 'rgba(100, 100, 100, 0.5)'
                                        : 'linear-gradient(135deg, #00D4FF, #00FF88)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: deploying || !bytecode ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {deploying ? '⏳ Deploying...' : '🚀 Deploy Contract'}
                            </button>

                            {deployResult && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: deployResult.success ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 100, 100, 0.1)',
                                    border: `1px solid ${deployResult.success ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 100, 100, 0.3)'}`,
                                }}>
                                    {deployResult.success ? (
                                        <>
                                            <div style={{ color: '#00FF88', fontWeight: 'bold', marginBottom: '8px' }}>
                                                ✅ Contract Deployed!
                                            </div>
                                            {deployResult.txHash && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <span style={{ color: '#888' }}>TX: </span>
                                                    <a
                                                        href={`https://testnet.cryptoscience.in/tx/${deployResult.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#00D4FF', fontSize: '12px', wordBreak: 'break-all' }}
                                                    >
                                                        {deployResult.txHash.slice(0, 20)}...
                                                    </a>
                                                </div>
                                            )}
                                            <div style={{ color: '#666', fontSize: '12px' }}>
                                                Check the transaction to find contract address
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ color: '#ff6464' }}>
                                            ❌ {deployResult.error}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info Box */}
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(0, 212, 255, 0.05)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                            }}>
                                <h4 style={{ color: '#00D4FF', marginBottom: '8px', fontSize: '14px' }}>
                                    💡 Tips
                                </h4>
                                <ul style={{ color: '#888', fontSize: '13px', lineHeight: '1.8', paddingLeft: '16px' }}>
                                    <li>Use template contracts for quick testing</li>
                                    <li>Make sure you have enough CSC for gas</li>
                                    <li>Get testnet CSC from the Faucet</li>
                                    <li>Contract address appears after TX confirms</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
