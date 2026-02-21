'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircle,
    XCircle,
    CreditCard,
    ShieldCheck,
    Info,
    Loader2,
    ArrowLeft,
    School as SchoolIcon,
    User as UserIcon,
    Wallet
} from 'lucide-react';

function SimulatorContent() {
    const searchParams = useSearchParams();
    const gateway = searchParams.get('gateway');
    const ref = searchParams.get('ref');

    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [result, setResult] = useState<{ status: 'SUCCESS' | 'FAILED' | 'DISABLED', message: string } | null>(null);

    useEffect(() => {
        if (ref) {
            fetchTransaction();
        }
    }, [ref]);

    const fetchTransaction = async () => {
        try {
            const res = await fetch(`/api/payments/simulate/details?ref=${ref}`);
            if (res.ok) {
                const data = await res.json();
                setTransaction(data);
            } else {
                console.error('Failed to fetch transaction details');
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async (status: 'SUCCESS' | 'FAILED') => {
        setSimulating(true);
        try {
            const res = await fetch('/api/payments/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionRef: ref, status })
            });

            const data = await res.json();
            if (res.ok) {
                setResult({ status, message: data.message });
                if (status === 'SUCCESS') {
                    setTransaction({ ...transaction, status: 'SUCCESS' });
                }
            } else {
                if (res.status === 403) {
                    setResult({ status: 'DISABLED', message: 'Sandbox simulator disabled in production.' });
                } else {
                    alert(data.error || 'Simulation failed');
                }
            }
        } catch (error) {
            alert('Failed to connect to simulator API');
        } finally {
            setSimulating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (!transaction && !result) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <XCircle className="text-red-500 mb-4" size={64} />
                <h1 className="text-2xl font-bold text-gray-800">Invalid Transaction</h1>
                <p className="text-gray-500 text-center mt-2">Could not find the transaction reference provided.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-xl font-bold"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
                    {result.status === 'SUCCESS' ? (
                        <CheckCircle className="text-green-500 mx-auto mb-6" size={80} />
                    ) : result.status === 'DISABLED' ? (
                        <ShieldCheck className="text-blue-500 mx-auto mb-6" size={80} />
                    ) : (
                        <XCircle className="text-red-500 mx-auto mb-6" size={80} />
                    )}

                    <h2 className="text-3xl font-black text-gray-800 mb-2">
                        {result.status === 'SUCCESS' ? 'Success!' : result.status === 'DISABLED' ? 'Security' : 'Failed'}
                    </h2>
                    <p className="text-gray-500 mb-8">{result.message}</p>

                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction Ref</p>
                        <p className="font-mono text-gray-700">{ref}</p>
                    </div>

                    <button
                        onClick={() => window.close()}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Close Simulator
                    </button>
                </div>
            </div>
        );
    }

    const isAlreadyProcessed = transaction.status !== 'INITIATED';

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`p-8 text-white ${gateway === 'jazzcash' ? 'bg-[#ff0000]' : 'bg-[#3cb371]'} flex flex-col items-center`}>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                        <Wallet size={32} />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">
                        {gateway} <span className="opacity-70 font-light italic text-sm">(Sandbox)</span>
                    </h1>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                            <h2 className="text-4xl font-black text-gray-800">Rs {transaction.amount.toLocaleString()}</h2>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-black ring-1 ring-blue-100 flex items-center space-x-1">
                            <ShieldCheck size={12} />
                            <span>TEST MODE</span>
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Student</p>
                                <p className="font-bold text-gray-800">{transaction.studentName}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <SchoolIcon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">School</p>
                                <p className="font-bold text-gray-800">{transaction.schoolName}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Description</p>
                                <p className="font-bold text-gray-800 italic text-sm">Fee Payment Simulation</p>
                            </div>
                        </div>
                    </div>

                    {isAlreadyProcessed ? (
                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center">
                            <Info className="text-amber-500 mx-auto mb-2" size={32} />
                            <p className="text-amber-700 font-bold mb-1">Transaction Already Processed</p>
                            <p className="text-amber-600 text-sm">Status: <span className="font-black underline">{transaction.status}</span></p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSimulate('FAILED')}
                                disabled={simulating}
                                className="py-4 border-2 border-red-500 text-red-500 rounded-2xl font-black hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                            >
                                Simulate Failure
                            </button>
                            <button
                                onClick={() => handleSimulate('SUCCESS')}
                                disabled={simulating}
                                className="py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {simulating ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                <span>Simulate Success</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">
                        Ref: {ref}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSimulatorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        }>
            <SimulatorContent />
        </Suspense>
    );
}
