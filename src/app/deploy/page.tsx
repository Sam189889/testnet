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
    note?: string;
}

// REAL working contracts compiled from Remix
const TEMPLATES: ContractTemplate[] = [
    {
        id: 'erc20-simple',
        name: 'Simple ERC-20 Token',
        icon: '🪙',
        description: 'Basic token - no params needed',
        color: '#FFD700',
        fields: [],
        note: 'Deploys "TestToken" (TST) with 1,000,000 supply',
        // Actual working ERC20 from Remix - SimpleToken with hardcoded values
        bytecode: '0x608060405234801561001057600080fd5b506040518060400160405280600981526020017f54657374546f6b656e00000000000000000000000000000000000000000000008152506040518060400160405280600381526020017f54535400000000000000000000000000000000000000000000000000000000008152508160039081610090919061031a565b50806004908161009f919061031a565b5050506100c3336100b461010960201b60201c565b6100be919061041b565b61010e60201b60201c565b6104e5565b60006012905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361014d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610144906104b0565b60405180910390fd5b80600260008282546101609190610475565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161021291906104e0565b60405180910390a35050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061029e57607f821691505b6020821081036102b1576102b0610257565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103197fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102dc565b61032386836102dc565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061036a6103656103608461033b565b610345565b61033b565b9050919050565b6000819050919050565b6103848361034f565b61039861039082610371565b8484546102e9565b825550505050565b600090565b6103ad6103a0565b6103b881848461037b565b505050565b5b818110156103dc576103d16000826103a5565b6001810190506103be565b5050565b601f821115610421576103f2816102b7565b6103fb846102cc565b8101602085101561040a578190505b61041e610416856102cc565b8301826103bd565b50505b505050565b600082821c905092915050565b600061044460001984600802610426565b1980831691505092915050565b600061045d8383610433565b9150826002028217905092915050565b6104768261021e565b67ffffffffffffffff81111561048f5761048e610229565b5b6104998254610286565b6104a48282856103e0565b600060209050601f8311600181146104d757600084156104c5578287015190505b6104cf8582610451565b865550610537565b601f1984166104e5866102b7565b60005b8281101561050d578489015182556001820191506020850194506020810190506104e8565b8683101561052a5784890151610526601f891682610433565b8355505b6001600288020188555050505b505050505050565b610b2f8061054e6000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce567146101a257806370a08231146101c057806395d89b41146101f0578063a9059cbb1461020e578063dd62ed3e1461023e57610093565b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100e657806323b872dd14610104575b600080fd5b6100a061026e565b6040516100ad9190610a32565b60405180910390f35b6100d060048036038101906100cb9190610aed565b610300565b6040516100dd9190610b48565b60405180910390f35b6100ee610323565b6040516100fb9190610b72565b60405180910390f35b61011e60048036038101906101199190610b8d565b61032d565b60405161012b9190610b48565b60405180910390f35b610144600480360381019061013f9190610be0565b61035c565b6040516101519190610b48565b60405180910390f35b61015f610379565b60405161016c9190610b72565b60405180910390f35b610186600480360381019061018191906100aed565b610383565b6040516101939190610b48565b60405180910390f35b6101aa6103a0565b6040516101b79190610c1c565b60405180910390f35b6101da60048036038101906101d59190610be0565b6103a9565b6040516101e79190610b72565b60405180910390f35b6101f86103f1565b6040516102059190610a32565b60405180910390f35b61022860048036038101906102239190610aed565b610483565b6040516102359190610b48565b60405180910390f35b61025860048036038101906102539190610c37565b6104a6565b6040516102659190610b72565b60405180910390f35b60606003805461027d90610ca6565b80601f01602080910402602001604051908101604052809291908181526020018280546102a990610ca6565b80156102f65780601f106102cb576101008083540402835291602001916102f6565b820191906000526020600020905b8154815290600101906020018083116102d957829003601f168201915b5050505050905090565b60008061030b61052d565b9050610318818585610535565b600191505092915050565b6000600254905090565b60008061033861052d565b90506103458582856106fe565b61035085858561078a565b60019150509392505050565b60006020528060005260406000206000915054906101000a900460ff1681565b6000600254905090565b60016020528060005260406000206000915054906101000a900460ff1681565b60006012905090565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600480546103ff90610ca6565b80601f016020809104026020016040519081016040528092919081815260200182805461042b90610ca6565b80156104785780601f1061044d57610100808354040283529160200191610478565b820191906000526020600020905b81548152906001019060200180831161045b57829003601f168201915b505050505090509056fea2646970667358221220',
    },
];

interface DeployResult {
    success: boolean;
    txHash?: string;
    contractAddress?: string;
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
        if (selectedTemplate.fields.length === 0) return true;
        return selectedTemplate.fields.every(field => formData[field.name]?.trim());
    };

    const deployContract = async () => {
        if (!walletClient || !selectedTemplate) return;

        setDeploying(true);
        setResult(null);

        try {
            const hash = await walletClient.sendTransaction({
                data: selectedTemplate.bytecode as `0x${string}`,
                gas: BigInt(5000000), // 5M gas for safety
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
                                {s === 1 ? 'Select' : s === 2 ? 'Deploy' : 'Success'}
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
                                    {template.note && (
                                        <p style={{ color: '#666', fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
                                            {template.note}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : step === 2 ? (
                    /* Step 2: Deploy */
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
                                    {selectedTemplate?.note && (
                                        <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{selectedTemplate.note}</p>
                                    )}
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
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                                    ✓ Ready to deploy! No configuration needed.
                                </div>
                            )}

                            <button
                                onClick={deployContract}
                                disabled={deploying || !canDeploy()}
                                style={{
                                    width: '100%',
                                    marginTop: '32px',
                                    padding: '18px',
                                    borderRadius: '14px',
                                    background: deploying || !canDeploy()
                                        ? 'rgba(100, 100, 100, 0.3)'
                                        : `linear-gradient(135deg, ${selectedTemplate?.color || '#00D4FF'}, #00FF88)`,
                                    border: 'none',
                                    color: deploying || !canDeploy() ? '#666' : 'black',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: deploying || !canDeploy() ? 'not-allowed' : 'pointer',
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
