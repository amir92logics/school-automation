'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Users, GraduationCap, Percent, CreditCard, MessageCircle, Loader2, ShieldCheck } from 'lucide-react';

interface SchoolStats {
    school: { _id: string; name: string; theme: { primaryColor: string; secondaryColor: string } };
    studentCount: number;
    classCount: number;
    remindersSent: number;
    studentLimit: number;
    classLimit: number;
    studentUsage: number;
    classUsage: number;
    feeStats: {
        totalCollection: number;
        paidAmount: number;
        pendingAmount: number;
    };
    sandboxStats?: {
        total: number;
        successful: number;
        pending: number;
        failed: number;
        amount: number;
    };
}

export default function SchoolDashboard() {
    const [stats, setStats] = useState<SchoolStats | null>(null);
    const [sendingReminder, setSendingReminder] = useState(false);

    useEffect(() => {
        fetch('/api/school/stats').then(res => res.json()).then(setStats);
    }, []);

    const handleBulkReminder = async () => {
        setSendingReminder(true);
        try {
            const res = await fetch('/api/school/fees/reminder', {
                method: 'POST',
                body: JSON.stringify({ type: 'bulk' }),
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (error) {
            alert('Failed to send reminders.');
        } finally {
            setSendingReminder(false);
        }
    };

    if (!stats) return <div className="p-8">Loading Portal...</div>;

    return (
        <>
            <ThemeProvider theme={{ primary: stats.school.theme.primaryColor, secondary: stats.school.theme.secondaryColor }} />
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title={stats.school.name}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Student Usage Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="school-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                                <Users size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Students</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.studentCount} <span className="text-lg text-gray-300">/ {stats.studentLimit}</span></h3>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                                <div className="school-primary h-full transition-all duration-1000" style={{ width: `${Math.min(stats.studentUsage, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Fees Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-red-50 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
                                <Percent size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pending</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 mb-1">Pending Fees</p>
                            <h3 className="text-3xl font-bold text-gray-800">Rs {stats.feeStats.pendingAmount.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Reminders Sent Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-orange-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-orange-50 text-orange-500 w-12 h-12 rounded-xl flex items-center justify-center">
                                <MessageCircle size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Reminders</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 mb-1">Total Sent</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.remindersSent}</h3>
                        </div>
                    </div>

                    {/* Paid Fees Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-green-50 text-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
                                <CreditCard size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Collected</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 mb-1">Total Paid</p>
                            <h3 className="text-3xl font-bold text-gray-800">Rs {stats.feeStats.paidAmount.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Total Collection Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-50 text-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center">
                                <Percent size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Forecast</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 mb-1">Total Fee Target</p>
                            <h3 className="text-3xl font-bold text-gray-800">Rs {stats.feeStats.totalCollection.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* Sandbox Stats Section (Hidden in Production) */}
                {stats.sandboxStats && stats.sandboxStats.total > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center space-x-2 mb-4 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl w-fit border border-amber-100">
                            <ShieldCheck size={18} />
                            <span className="text-sm font-black uppercase tracking-widest">Sandbox Testing Metrics</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Simulations</p>
                                <p className="text-2xl font-black text-gray-800">{stats.sandboxStats.total}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Successful Tests</p>
                                <p className="text-2xl font-black text-green-600">{stats.sandboxStats.successful}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Failed Tests</p>
                                <p className="text-2xl font-black text-red-600">{stats.sandboxStats.failed}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-green-50/30 to-white">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Simulated Collection</p>
                                <p className="text-2xl font-black text-gray-800">Rs {stats.sandboxStats.amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center transition-transform hover:rotate-12">
                            <Percent className="text-blue-500" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Quick Operations</h3>
                            <p className="text-gray-500 text-sm">Send automated WhatsApp reminders to all parents with pending dues.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBulkReminder}
                        disabled={sendingReminder || stats.feeStats.pendingAmount === 0}
                        className="school-primary px-8 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-100 flex items-center space-x-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {sendingReminder ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
                        <span>Send Bulk Reminder</span>
                    </button>
                </div>
            </Shell>
        </>
    );
}
