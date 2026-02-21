'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, School, Users, Settings, BookOpen, LogOut, CreditCard, MessageCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
    role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
}

const SUPER_ADMIN_LINKS = [
    { href: '/super-admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/super-admin/schools', icon: School, label: 'Schools' },
];

const SCHOOL_ADMIN_LINKS = [
    { href: '/school/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/school/classes', icon: BookOpen, label: 'Classes' },
    { href: '/school/students', icon: Users, label: 'Students' },
    { href: '/school/fees', icon: CreditCard, label: 'Fee Management' },
    { href: '/school/whatsapp', icon: MessageCircle, label: 'WhatsApp Session' },
    { href: '/school/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = ({ role }: SidebarProps) => {
    const pathname = usePathname();
    const links = role === 'SUPER_ADMIN' ? SUPER_ADMIN_LINKS : SCHOOL_ADMIN_LINKS;

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold school-primary-text">EduSaaS</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'school-primary shadow-lg shadow-blue-100'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};
