'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { School, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface Stats {
    totalSchools: number;
    totalStudents: number;
    totalClasses: number;
    activeSchools: number;
    inactiveSchools: number;
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/super-admin/stats')
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8">Loading Galaxy Control...</div>;

    const cards = [
        { label: 'Total Schools', value: stats?.totalSchools, icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Total Classes', value: stats?.totalClasses, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active', value: stats?.activeSchools, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Inactive', value: stats?.inactiveSchools, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <>
            <Sidebar role="SUPER_ADMIN" />
            <Shell role="SUPER_ADMIN" title="System Overview">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md cursor-default">
                                <div className={`${card.bg} ${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
                                    <Icon size={24} />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{card.value ?? 0}</h3>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent System Activity</h3>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <School size={48} className="mb-4 opacity-20" />
                        <p>Real-time activity logs will appear here as schools join.</p>
                    </div>
                </div>
            </Shell>
        </>
    );
}
