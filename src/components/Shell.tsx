'use client';

import React from 'react';

export const Shell = ({ children, role, title }: { children: React.ReactNode; role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN'; title: string }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
                    <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600">
                            {role.replace('_', ' ')}
                        </span>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
};
