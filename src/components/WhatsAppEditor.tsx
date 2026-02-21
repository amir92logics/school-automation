'use client';

import React, { useState, useEffect } from 'react';
import { Send, X, MessageSquare, User, Calendar, CreditCard } from 'lucide-react';

interface WhatsAppEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
    data: {
        studentName: string;
        amount: number;
        dueDate: string;
        schoolName: string;
        jazzcashLink: string;
        easypaisaLink: string;
    };
    primaryColor?: string;
}

export const WhatsAppEditor: React.FC<WhatsAppEditorProps> = ({ isOpen, onClose, onSend, data, primaryColor = '#25D366' }) => {

    const buildDynamicTemplate = (d: typeof data) => {
        const lines: string[] = [
            `Dear Parent,`,
            `Your child {{studentName}} has pending fee of Rs {{amount}}.`,
            `Due Date: {{dueDate}}`,
            '',
            'Regards,',
            '{{schoolName}}'
        ];
        return lines.join('\n');
    };

    const [message, setMessage] = useState(() => buildDynamicTemplate(data));
    const [preview, setPreview] = useState('');

    const replacePlaceholders = (text: string) => {
        if (!data) return text;
        return text
            .replace(/{{studentName}}/g, data.studentName || '')
            .replace(/{{amount}}/g, (data.amount !== undefined && data.amount !== null) ? data.amount.toString() : '0')
            .replace(/{{dueDate}}/g, data.dueDate || '')
            .replace(/{{schoolName}}/g, data.schoolName || '')
            .replace(/{{jazzcashLink}}/g, data.jazzcashLink || '')
            .replace(/{{easypaisaLink}}/g, data.easypaisaLink || '');
    };

    // Rebuild template whenever the modal opens for a different student or payment links change
    useEffect(() => {
        setMessage(buildDynamicTemplate(data));
    }, [data?.jazzcashLink, data?.easypaisaLink, data?.studentName]);

    useEffect(() => {
        setPreview(replacePlaceholders(message));
    }, [message, data]);

    if (!isOpen) return null;

    const hasJC = !!data?.jazzcashLink?.trim();
    const hasEP = !!data?.easypaisaLink?.trim();

    const insertTags = [
        { label: '{{studentName}}', icon: <User size={14} /> },
        { label: '{{amount}}', icon: <CreditCard size={14} /> },
        { label: '{{dueDate}}', icon: <Calendar size={14} /> },
        { label: '{{schoolName}}', icon: <MessageSquare size={14} /> },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[800px]">
                {/* Left: Editor */}
                <div className="flex-1 p-6 md:p-8 flex flex-col border-r border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Compose Reminder</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Message Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-64 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium text-gray-700 bg-gray-50"
                                placeholder="Type your message here..."
                            />
                        </div>

                        {/* Insert Tag Buttons */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Insert Variable</p>
                            <div className="flex flex-wrap gap-2">
                                {insertTags.map((tag) => (
                                    <button
                                        key={tag.label}
                                        onClick={() => setMessage(prev => prev + ' ' + tag.label)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        {tag.icon}
                                        <span>{tag.label}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-blue-500 font-bold bg-blue-50 p-3 rounded-xl flex items-center space-x-2">
                                <CreditCard size={14} />
                                <span>Sandbox payment links will be automatically appended to this message.</span>
                            </p>
                        </div>

                        <div className="text-xs text-gray-400 font-medium">
                            Character count: {message.length}
                        </div>
                    </div>

                    <div className="mt-8 flex space-x-4">
                        <button
                            onClick={() => onSend(replacePlaceholders(message))}
                            className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Send size={20} />
                            <span>Send via WhatsApp</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-8 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Right: Preview (WhatsApp Style) */}
                <div className="hidden md:flex flex-1 bg-[#E5DDD5] flex-col relative overflow-hidden">
                    <div className="bg-[#075E54] p-4 flex items-center space-x-3 text-white">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            <User size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Parent of {data.studentName}</p>
                            <p className="text-[10px] opacity-70">Online</p>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm relative max-w-[85%] float-left">
                            <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
                                {preview}
                            </div>
                            <div className="text-[10px] text-gray-400 text-right mt-1">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {/* Speech bubble tail */}
                            <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-white" />
                        </div>
                    </div>

                    {/* WhatsApp Bottom Bar Decor */}
                    <div className="bg-[#F0F0F0] p-3 flex items-center space-x-3">
                        <div className="flex-1 bg-white h-10 rounded-full px-4" />
                        <div className="w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center text-white">
                            <Send size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
