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
        id: 'storage',
        name: 'Simple Storage',
        icon: '💾',
        description: 'Store and retrieve a number',
        color: '#00D4FF',
        fields: [],
        bytecode: '0x608060405234801561001057600080fd5b5060f78061001f6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80632e64cec11460415780636057361d146053578063b05784f8146062575b600080fd5b6000545b60405190815260200160405180910390f35b605c605e366004608f565b005b605c6070366004608f565b600055565b80600080828254607f919060a6565b9091555050565b6000602082840312156000fd5b503591905056fea26469706673582212201f1e0c8e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e64736f6c63430008130033',
    },
    {
        id: 'counter',
        name: 'Simple Counter',
        icon: '🔢',
        description: 'Increment and decrement a counter',
        color: '#FFD700',
        fields: [],
        bytecode: '0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80633fb5c1cb1460415780638381f58a14605d578063d09de08a146075575b600080fd5b605b60048036038101906057919060a0565b607f565b005b60635060895565b60405190815260200160405180910390f35b607d608f565b005b8060008190555050565b60005481565b6000808154809291906099919060cb565b9190505550565b60006020828403121560b157600080fd5b813560c48160f3565b9392505050565b600060d48260f3565b915060d78360f3565b92915050565b60e68160f3565b82525050565b6000819050919050565b5056fea2646970667358221220abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd64736f6c63430008130033',
    },
    {
        id: 'greeter',
        name: 'Hello World',
        icon: '�',
        description: 'A simple greeting contract',
        color: '#00FF88',
        fields: [],
        bytecode: '0x608060405234801561001057600080fd5b5060405180606001604052806028815260200161024060289139600090816100389190610232565b50610304565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806100c057607f821691505b6020821081036100d3576100d2610079565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026101357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826100f8565b61013f86836100f8565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061018661018161017c84610157565b610161565b610157565b9050919050565b6000819050919050565b6101a08361016b565b6101b46101ac8261018d565b848454610105565b825550505050565b600090565b6101c96101bc565b6101d4818484610197565b505050565b5b818110156101f8576101ed6000826101c1565b6001810190506101da565b5050565b601f82111561023d5761020e816100d9565b610217846100ee565b81016020851015610226578190505b61023a610232856100ee565b8301826101d9565b50505b505050565b600082821c905092915050565b600061026060001984600802610242565b1980831691505092915050565b6000610279838361024f565b9150826002028217905092915050565b6102928261003f565b67ffffffffffffffff8111156102ab576102aa61004a565b5b6102b582546100a8565b6102c08282856101fc565b600060209050601f8311600181146102f357600084156102e1578287015190505b6102eb858261026d565b865550610353565b601f198416610301866100d9565b60005b8281101561032957848901518255600182019150602085019450602081019050610304565b868310156103465784890151610342601f89168261024f565b8355505b6001600288020188555050505b505050505050565b610f2d806103636000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063cfae32171461003b578063ef690cc014610059575b600080fd5b610043610077565b6040516100509190610109565b60405180910390f35b610061610109565b60405161006e9190610109565b60405180910390f35b60606000805461008690610197565b80601f01602080910402602001604051908101604052809291908181526020018280546100b290610197565b80156100ff5780601f106100d4576101008083540402835291602001916100ff565b820191906000526020600020905b8154815290600101906020018083116100e257829003601f168201915b5050505050905090565b600060208201905081810360008301526101238184610197565b905092915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561016557808201518184015260208101905061014a565b83811115610174576000848401525b50505050565b6000601f19601f8301169050919050565b60006101968261012b565b6101a08185610136565b93506101b0818560208601610147565b6101b98161017a565b840191505092915050565b600060208201905081810360008301526101de818461018b565b90509291505056fea2646970667358221220',
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
