'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { ThemeProvider } from '@/components/ThemeProvider';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, RefreshCw, LogOut, CheckCircle, XCircle, QrCode } from 'lucide-react';

export default function WhatsAppPage() {
    const [status, setStatus] = useState<'LOADING' | 'NOT_CONNECTED' | 'QR_READY' | 'CONNECTED' | 'AUTH_FAILURE'>('LOADING');
    const [qr, setQr] = useState<string | null>(null);
    const [school, setSchool] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Fetch school settings for theme
        fetch('/api/school/settings').then(res => res.json()).then(data => setSchool(data));

        // Initial status check
        fetch('/api/school/whatsapp').then(res => res.json()).then(data => {
            if (data.status === 'CONNECTED') {
                setStatus('CONNECTED');
            } else {
                setStatus('NOT_CONNECTED');
            }
        });
    }, []);

    useEffect(() => {
        if (!school) return;

        // Initialize socket
        console.log('Connecting to socket with schoolId:', school._id);
        const socketInstance = io({
            path: '/api/socket',
            query: { schoolId: school._id },
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socketInstance.on('whatsapp-qr', (data: { qr: string }) => {
            console.log('QR received via socket');
            setQr(data.qr);
            setStatus('QR_READY');
        });

        socketInstance.on('whatsapp-status', (data: { status: string }) => {
            console.log('Status update via socket:', data.status);
            if (data.status === 'CONNECTED') {
                setStatus('CONNECTED');
                setQr(null);
            } else if (data.status === 'DISCONNECTED') {
                setStatus('NOT_CONNECTED');
            } else if (data.status === 'AUTH_FAILURE') {
                setStatus('AUTH_FAILURE');
            }
        });

        setSocket(socketInstance);

        return () => {
            console.log('Disconnecting socket');
            socketInstance.disconnect();
        };
    }, [school]);

    const handleConnect = async () => {
        setStatus('LOADING');
        await fetch('/api/school/whatsapp', {
            method: 'POST',
            body: JSON.stringify({ action: 'connect' }),
        });
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to disconnect WhatsApp?')) {
            await fetch('/api/school/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ action: 'logout' }),
            });
            setStatus('NOT_CONNECTED');
            setQr(null);
        }
    };

    if (!school) return <div className="p-8">Loading...</div>;

    return (
        <>
            <ThemeProvider theme={{ primary: school.theme.primaryColor, secondary: school.theme.secondaryColor }} />
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title="WhatsApp Session">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <MessageSquare className="text-green-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">WhatsApp Connectivity</h3>
                                    <p className="text-sm text-gray-500">Manage your school's WhatsApp automation session</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {status === 'CONNECTED' ? (
                                    <span className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-bold">
                                        <CheckCircle size={16} />
                                        <span>Connected</span>
                                    </span>
                                ) : status === 'QR_READY' ? (
                                    <span className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold animate-pulse">
                                        <QrCode size={16} />
                                        <span>Scan QR Code</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-sm font-bold">
                                        <XCircle size={16} />
                                        <span>Not Connected</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                            {status === 'LOADING' ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <RefreshCw className="animate-spin text-blue-500" size={48} />
                                    <p className="text-gray-500 font-medium">Initializing session...</p>
                                </div>
                            ) : status === 'CONNECTED' ? (
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="text-green-500" size={48} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp is Ready!</h4>
                                        <p className="text-gray-500 max-w-sm mx-auto">
                                            Your session is active and automated reminders can be sent to parents.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 mx-auto px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                                    >
                                        <LogOut size={20} />
                                        <span>Disconnect Session</span>
                                    </button>
                                </div>
                            ) : status === 'QR_READY' && qr ? (
                                <div className="text-center space-y-8">
                                    <div className="relative p-6 bg-white border-4 border-gray-50 rounded-3xl shadow-2xl">
                                        <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                                        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-3xl -m-2"></div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-2xl font-bold text-gray-800">Scan this QR Code</h4>
                                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                            Open WhatsApp on your phone, go to Menu or Settings &gt; Linked Devices, and scan the code.
                                        </p>
                                        <button
                                            onClick={handleConnect}
                                            className="text-blue-600 text-sm font-bold flex items-center space-x-1 mx-auto hover:underline"
                                        >
                                            <RefreshCw size={14} />
                                            <span>Regenerate QR</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-8">
                                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto rotate-3">
                                        <MessageSquare className="text-blue-500" size={48} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-2xl font-bold text-gray-800">Connect WhatsApp</h4>
                                        <p className="text-gray-500 max-w-md mx-auto">
                                            To send automated fee reminders, you need to link your school's WhatsApp account.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleConnect}
                                        className="school-primary px-10 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 mx-auto"
                                    >
                                        <QrCode size={20} />
                                        <span>Generate QR Code</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100">
                            <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Security Features</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-500 leading-relaxed">Multi-tenant session isolation using LocalAuth per schoolId.</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-500 leading-relaxed">Real-time status tracking via secure WebSocket signaling.</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-500 leading-relaxed">Automated session recovery and reconnection handling.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Shell>
        </>
    );
}
