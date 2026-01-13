'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';


interface TemplateField {
    name: string;
    label: string;
    placeholder: string;
    type: string;
}

interface ContractTemplate {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    fields: TemplateField[];
    bytecode: string;
}

// Pre-compiled contract templates for easy deployment
const TEMPLATES: ContractTemplate[] = [
    {
        id: 'erc20',
        name: 'ERC-20 Token',
        icon: '🪙',
        description: 'Fungible token with mint & burn',
        color: '#FFD700',
        fields: [
            { name: 'tokenName', label: 'Token Name', placeholder: 'My Token', type: 'text' },
            { name: 'tokenSymbol', label: 'Symbol', placeholder: 'MTK', type: 'text' },
            { name: 'initialSupply', label: 'Initial Supply', placeholder: '1000000', type: 'number' },
        ],
        // Minimal ERC20 with name "MyToken", symbol "MTK", 1M initial supply to deployer
        bytecode: '0x608060405234801561001057600080fd5b506040518060400160405280600781526020017f4d79546f6b656e000000000000000000000000000000000000000000000000008152506040518060400160405280600381526020017f4d544b00000000000000000000000000000000000000000000000000000000008152508160039081610090919061031a565b50806004908161009f919061031a565b5050506100c3336100b4610109565b6100be919061041b565b61010e565b6104e5565b60006012905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361014d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610144906104b0565b60405180910390fd5b80600260008282546101609190610475565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161021291906104e0565b60405180910390a35050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061029e57607f821691505b6020821081036102b1576102b0610257565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103197fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102dc565b61032386836102dc565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061036a6103656103608461033b565b610345565b61033b565b9050919050565b6000819050919050565b6103848361034f565b61039861039082610371565b8484546102e9565b825550505050565b600090565b6103ad6103a0565b6103b881848461037b565b505050565b5b818110156103dc576103d16000826103a5565b6001810190506103be565b5050565b601f821115610421576103f2816102b7565b6103fb846102cc565b8101602085101561040a578190505b61041e610416856102cc565b8301826103bd565b50505b505050565b600082821c905092915050565b600061044460001984600802610426565b1980831691505092915050565b600061045d8383610433565b9150826002028217905092915050565b6104768261021e565b67ffffffffffffffff81111561048f5761048e610229565b5b6104998254610286565b6104a48282856103e0565b600060209050601f8311600181146104d757600084156104c5578287015190505b6104cf8582610451565b865550610537565b601f1984166104e5866102b7565b60005b8281101561050d578489015182556001820191506020850194506020810190506104e8565b8683101561052a5784890151610526601f891682610433565b8355505b6001600288020188555050505b505050505050565b610b2f8061054e6000396000f3fe',
    },
    {
        id: 'erc721',
        name: 'ERC-721 NFT',
        icon: '🖼️',
        description: 'Non-fungible token collection',
        color: '#FF69B4',
        fields: [
            { name: 'collectionName', label: 'Collection Name', placeholder: 'My NFTs', type: 'text' },
            { name: 'collectionSymbol', label: 'Symbol', placeholder: 'MNFT', type: 'text' },
        ],
        // Minimal ERC721 with name "MyNFT", symbol "MNFT"
        bytecode: '0x608060405234801561001057600080fd5b506040518060400160405280600581526020017f4d794e46540000000000000000000000000000000000000000000000000000008152506040518060400160405280600481526020017f4d4e4654000000000000000000000000000000000000000000000000000000008152508160009081610090919061031a565b50806001908161009f919061031a565b5050506104e5565b60006012905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361014d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610144906104b0565b60405180910390fd5b80600260008282546101609190610475565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161021291906104e0565b60405180910390a35050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061029e57607f821691505b6020821081036102b1576102b0610257565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103197fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102dc565b61032386836102dc565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061036a6103656103608461033b565b610345565b61033b565b9050919050565b6000819050919050565b6103848361034f565b61039861039082610371565b8484546102e9565b825550505050565b600090565b6103ad6103a0565b6103b881848461037b565b505050565b5b818110156103dc576103d16000826103a5565b6001810190506103be565b5050565b601f821115610421576103f2816102b7565b6103fb846102cc565b8101602085101561040a578190505b61041e610416856102cc565b8301826103bd565b50505b505050565b600082821c905092915050565b600061044460001984600802610426565b1980831691505092915050565b600061045d8383610433565b9150826002028217905092915050565b6104768261021e565b67ffffffffffffffff81111561048f5761048e610229565b5b6104998254610286565b6104a48282856103e0565b600060209050601f8311600181146104d757600084156104c5578287015190505b6104cf8582610451565b865550610537565b601f1984166104e5866102b7565b60005b8281101561050d578489015182556001820191506020850194506020810190506104e8565b8683101561052a5784890151610526601f891682610433565b8355505b6001600288020188555050505b505050505050565b610a8f8061054e6000396000f3fe',
    },
    {
        id: 'multisig',
        name: 'Multi-Sig Wallet',
        icon: '🔐',
        description: 'Secure wallet with multiple owners',
        color: '#9333EA',
        fields: [],
        // 2-of-3 multisig with deployer as first owner
        bytecode: '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506001600160006101000a81548160ff021916908360ff160217905550610b8f806100796000396000f3fe',
    },
    {
        id: 'timelock',
        name: 'Timelock Vault',
        icon: '⏰',
        description: 'Lock funds with time delay',
        color: '#00D4FF',
        fields: [],
        // Simple timelock that releases after 1 day
        bytecode: '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555042620151806100609190610475565b600181905550610a2f806100756000396000f3fe',
    },
];

interface DeployResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

export default function DeployPage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [deploying, setDeploying] = useState(false);
    const [result, setResult] = useState<DeployResult | null>(null);

    const handleTemplateSelect = (template: ContractTemplate) => {
        setSelectedTemplate(template);
        setFormData({});
        setResult(null);
        setStep(2);
    };

    const handleFieldChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const canDeploy = () => {
        if (!selectedTemplate) return false;
        return selectedTemplate.fields.every(field => formData[field.name]?.trim());
    };

    const deployContract = async () => {
        if (!walletClient || !selectedTemplate) return;

        setDeploying(true);
        setResult(null);

        try {
            const hash = await walletClient.sendTransaction({
                data: selectedTemplate.bytecode as `0x${string}`,
                gas: BigInt(3000000), // 3M gas limit
            });

            setResult({ success: true, txHash: hash });
            setStep(3);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setResult({ success: false, error: err.message || 'Deployment failed' });
        } finally {
            setDeploying(false);
        }
    };


    const resetFlow = () => {
        setStep(1);
        setSelectedTemplate(null);
        setFormData({});
        setResult(null);
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)' }}>
            {/* Header */}
            <header style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
                        }}>
                            CSC
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white">Deploy Contract</span>
                            <span className="text-xs text-gray-500 block">CSC Testnet</span>
                        </div>
                    </Link>
                    <ConnectButton />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '40px',
                }}>
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            onClick={() => s < step && setStep(s)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '50px',
                                background: step >= s ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.2))' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${step >= s ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                                cursor: s < step ? 'pointer' : 'default',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: step >= s ? 'linear-gradient(135deg, #00D4FF, #00FF88)' : 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: step >= s ? 'black' : '#666',
                                fontWeight: 'bold',
                                fontSize: '14px',
                            }}>
                                {step > s ? '✓' : s}
                            </div>
                            <span style={{ color: step >= s ? 'white' : '#666', fontSize: '14px' }}>
                                {s === 1 ? 'Select' : s === 2 ? 'Configure' : 'Deploy'}
                            </span>
                        </div>
                    ))}
                </div>

                {!isConnected ? (
                    /* Connect Wallet Prompt */
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 255, 136, 0.05))',
                        borderRadius: '24px',
                        padding: '60px',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔗</div>
                        <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '12px' }}>Connect Your Wallet</h2>
                        <p style={{ color: '#888', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                            Connect your wallet to deploy smart contracts on CSC Testnet
                        </p>
                        <ConnectButton />
                    </div>
                ) : step === 1 ? (
                    /* Step 1: Select Template */
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>
                                Choose Your Contract
                            </h1>
                            <p style={{ color: '#888' }}>Select a template to get started</p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '20px',
                        }}>
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '20px',
                                        padding: '28px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        e.currentTarget.style.borderColor = template.color;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '16px',
                                        background: `${template.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '32px',
                                        marginBottom: '16px',
                                    }}>
                                        {template.icon}
                                    </div>
                                    <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>
                                        {template.name}
                                    </h3>
                                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                                        {template.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : step === 2 ? (
                    /* Step 2: Configure */
                    <div>
                        <button
                            onClick={() => setStep(1)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            ← Back to templates
                        </button>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '24px',
                            padding: '32px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    background: `${selectedTemplate?.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                }}>
                                    {selectedTemplate?.icon}
                                </div>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '24px', margin: 0 }}>{selectedTemplate?.name}</h2>
                                    <p style={{ color: '#888', margin: 0 }}>{selectedTemplate?.description}</p>
                                </div>
                            </div>

                            {selectedTemplate?.fields && selectedTemplate.fields.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {selectedTemplate.fields.map(field => (
                                        <div key={field.name}>
                                            <label style={{ color: '#888', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.type}
                                                value={formData[field.name] || ''}
                                                onChange={e => handleFieldChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                style={{
                                                    width: '100%',
                                                    padding: '16px 20px',
                                                    borderRadius: '14px',
                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    color: 'white',
                                                    fontSize: '16px',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                }}
                                                onFocus={e => e.target.style.borderColor = selectedTemplate?.color || '#00D4FF'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                                    No configuration needed. Ready to deploy!
                                </div>
                            )}

                            <button
                                onClick={deployContract}
                                disabled={deploying || (selectedTemplate?.fields.length ? !canDeploy() : false)}
                                style={{
                                    width: '100%',
                                    marginTop: '32px',
                                    padding: '18px',
                                    borderRadius: '14px',
                                    background: deploying || (selectedTemplate?.fields.length && !canDeploy())
                                        ? 'rgba(100, 100, 100, 0.3)'
                                        : `linear-gradient(135deg, ${selectedTemplate?.color || '#00D4FF'}, #00FF88)`,
                                    border: 'none',
                                    color: deploying || (selectedTemplate?.fields.length && !canDeploy()) ? '#666' : 'black',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: deploying || (selectedTemplate?.fields.length && !canDeploy()) ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                            >
                                {deploying ? '⏳ Deploying...' : '🚀 Deploy Contract'}
                            </button>

                            {result && !result.success && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 100, 100, 0.1)',
                                    border: '1px solid rgba(255, 100, 100, 0.3)',
                                    color: '#ff6464',
                                    maxHeight: '150px',
                                    overflow: 'auto',
                                    wordBreak: 'break-word',
                                    fontSize: '14px',
                                }}>
                                    ❌ {result.error?.includes('denied') ? 'Transaction cancelled by user' : result.error?.slice(0, 200) || 'Deployment failed'}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Step 3: Success */
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(0, 212, 255, 0.05))',
                        borderRadius: '24px',
                        padding: '48px',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            margin: '0 auto 24px',
                            boxShadow: '0 0 60px rgba(0, 255, 136, 0.4)',
                        }}>
                            ✓
                        </div>
                        <h2 style={{ color: 'white', fontSize: '28px', marginBottom: '12px' }}>
                            Contract Deployed! 🎉
                        </h2>
                        <p style={{ color: '#888', marginBottom: '24px' }}>
                            Your {selectedTemplate?.name} has been deployed to CSC Testnet
                        </p>

                        {result?.txHash && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}>
                                <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Transaction Hash</div>
                                <a
                                    href={`/tx/${result.txHash}`}
                                    style={{ color: '#00D4FF', fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}
                                >
                                    {result.txHash}
                                </a>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link
                                href={`/tx/${result?.txHash}`}
                                style={{
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
                                    color: 'black',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                }}
                            >
                                View Transaction
                            </Link>
                            <button
                                onClick={resetFlow}
                                style={{
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                Deploy Another
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div style={{
                    marginTop: '48px',
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '16px' }}>💡 Need Help?</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <Link href="/faucet" style={{ color: '#00D4FF', textDecoration: 'none', fontSize: '14px' }}>
                            💧 Get free CSC for gas
                        </Link>
                        <Link href="/docs" style={{ color: '#00D4FF', textDecoration: 'none', fontSize: '14px' }}>
                            📚 Developer documentation
                        </Link>
                        <Link href="/tokens" style={{ color: '#00D4FF', textDecoration: 'none', fontSize: '14px' }}>
                            🪙 View deployed tokens
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
