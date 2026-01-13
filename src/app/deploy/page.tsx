'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

// Pre-compiled contract templates for easy deployment
const TEMPLATES = [
    {
        id: 'token',
        name: 'ERC-20 Token',
        icon: '🪙',
        description: 'Create your own fungible token',
        color: '#FFD700',
        fields: [
            { name: 'tokenName', label: 'Token Name', placeholder: 'My Token', type: 'text' },
            { name: 'tokenSymbol', label: 'Symbol', placeholder: 'MTK', type: 'text' },
            { name: 'initialSupply', label: 'Initial Supply', placeholder: '1000000', type: 'number' },
        ],
        bytecode: '0x60806040523480156200001157600080fd5b5060405162000c3838038062000c38833981016040819052620000349162000201565b8251620000499060039060208601906200009e565b5081516200005f9060049060208501906200009e565b506200006e3360001962000077565b50505062000293565b6001600160a01b038216620000d25760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b8060026000828254620000e6919062000231565b90915550506001600160a01b038216600090815260208190526040812080548392906200011590849062000231565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b505050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200018c57600080fd5b81516001600160401b0380821115620001a957620001a962000164565b604051601f8301601f19908116603f01168101908282118183101715620001d457620001d462000164565b81604052838152602092508683858801011115620001f157600080fd5b600091505b8382101562000215578582018301518183018401529082019062000206565b600093810190920192909252949350505050565b6000806000606084860312156200023f57600080fd5b83516001600160401b03808211156200025757600080fd5b62000265878388016200017a565b945060208601519150808211156200027c57600080fd5b506200028b868287016200017a565b925050604084015190509250925092565b61098580620002ac6000396000f3fe',
    },
    {
        id: 'nft',
        name: 'NFT Collection',
        icon: '🖼️',
        description: 'Launch your own NFT collection',
        color: '#FF69B4',
        fields: [
            { name: 'collectionName', label: 'Collection Name', placeholder: 'My NFTs', type: 'text' },
            { name: 'symbol', label: 'Symbol', placeholder: 'MNFT', type: 'text' },
        ],
        bytecode: '0x608060405234801561001057600080fd5b5060405161080038038061080083398101604081905261002f91610134565b81516100429060009060208501906100b5565b5080516100569060019060208401906100b5565b505050610268565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261008557600080fd5b81516001600160401b0381111561009e5761009e61005e565b604051601f8201601f19908116603f011681019083821181831017156100c6576100c661005e565b816040528381528660208587010111156100df57600080fd5b60005b838110156100fd5760208681890101518282018701520161010e565b506000602085830101528094505050505092915050565b60008060408385031215610127578182fd5b82516001600160401b038082111561013e578384fd5b61014a86838701610074565b9350602085015191508082111561015f578283fd5b5061016c85828601610074565b9150509250929050565b61058980620001826000396000f3fe',
    },
    {
        id: 'storage',
        name: 'Simple Storage',
        icon: '💾',
        description: 'Store and retrieve a value',
        color: '#00D4FF',
        fields: [],
        bytecode: '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610066565b60405161005091906100a9565b60405180910390f35b6100676100f5565b005b60008054905090565b6000819050919050565b61008381610070565b82525050565b600060208201905061009e600083018461007a565b92915050565b60006020820190506100b9600083018461007a565b92915050565b600080fd5b6100cd8161007',
    },
    {
        id: 'multisig',
        name: 'Multi-Sig Wallet',
        icon: '🔐',
        description: 'Secure wallet requiring multiple approvals',
        color: '#00FF88',
        fields: [
            { name: 'owners', label: 'Owner Addresses (comma separated)', placeholder: '0x123..., 0x456...', type: 'text' },
            { name: 'required', label: 'Required Confirmations', placeholder: '2', type: 'number' },
        ],
        bytecode: '0x608060405234801561001057600080fd5b50',
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
    const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [deploying, setDeploying] = useState(false);
    const [result, setResult] = useState<DeployResult | null>(null);

    const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
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
                                }}>
                                    ❌ {result.error}
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
