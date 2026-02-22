'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Save, Settings as SettingsIcon, CreditCard } from 'lucide-react';

export default function SchoolSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
    });

    useEffect(() => {
        fetch('/api/school/settings')
            .then(res => res.json())
            .then(data => {
                setFormData({
                    name: data.name,
                    phone: data.phone,
                    primaryColor: data.primaryColor,
                    secondaryColor: data.secondaryColor,
                });
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/school/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const responseData = await res.json();

            if (res.ok) {
                // Reload form from the actual saved school data
                const savedSchool = responseData.school ?? responseData;

                setFormData({
                    name: savedSchool.name || formData.name,
                    phone: savedSchool.phone || formData.phone,
                    primaryColor: savedSchool.primaryColor || formData.primaryColor,
                    secondaryColor: savedSchool.secondaryColor || formData.secondaryColor,
                });

                setMessage('✅ Settings updated successfully');
            } else {
                setMessage(`Failed to update settings: ${responseData.error || res.status}`);
            }
        } catch (error) {
            setMessage('An error occurred.');
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div className="p-8">Loading Settings...</div>;

    return (
        <>
            <ThemeProvider theme={{ primary: formData.primaryColor, secondary: formData.secondaryColor }} />
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title="School Settings">
                <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="school-primary w-10 h-10 rounded-xl flex items-center justify-center text-white">
                            <SettingsIcon size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Branding & Info</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">School Name</label>
                            <input
                                required
                                className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Support Phone</label>
                            <input
                                required
                                className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Primary Theme Color</label>
                                <div className="flex space-x-4 items-center">
                                    <input
                                        type="color"
                                        className="w-16 h-12 rounded-xl border border-gray-200 cursor-pointer"
                                        value={formData.primaryColor}
                                        onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                    />
                                    <span className="text-sm font-mono text-gray-500 uppercase">{formData.primaryColor}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Secondary Theme Color</label>
                                <div className="flex space-x-4 items-center">
                                    <input
                                        type="color"
                                        className="w-16 h-12 rounded-xl border border-gray-200 cursor-pointer"
                                        value={formData.secondaryColor}
                                        onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                                    />
                                    <span className="text-sm font-mono text-gray-500 uppercase">{formData.secondaryColor}</span>
                                </div>
                            </div>
                        </div>



                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('successfully') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full school-primary text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition disabled:opacity-50"
                        >
                            <Save size={20} />
                            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                    </form>
                </div>
            </Shell>
        </>
    );
}
