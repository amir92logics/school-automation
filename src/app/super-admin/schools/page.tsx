'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { Plus, Power, Palette } from 'lucide-react';

interface School {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    maxStudents: number;
    maxClasses: number;
    theme: { primaryColor: string };
}

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '',
        maxStudents: 100, maxClasses: 10,
        primaryColor: '#3b82f6', secondaryColor: '#1e40af',
        isActive: true
    });

    const fetchSchools = async () => {
        const res = await fetch('/api/super-admin/schools');
        const data = await res.json();
        setSchools(data);
        setLoading(false);
    };

    useEffect(() => { fetchSchools(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingSchoolId ? 'PATCH' : 'POST';
        const body = editingSchoolId ? { ...formData, id: editingSchoolId } : formData;

        const res = await fetch('/api/super-admin/schools', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            setShowModal(false);
            setEditingSchoolId(null);
            setFormData({
                name: '', email: '', password: '', phone: '',
                maxStudents: 100, maxClasses: 10,
                primaryColor: '#3b82f6', secondaryColor: '#1e40af',
                isActive: true
            });
            fetchSchools();
        }
    };

    const handleEdit = (school: any) => {
        setEditingSchoolId(school._id);
        setFormData({
            name: school.name,
            email: school.email,
            password: '', // Don't pre-fill password
            phone: school.phone || '',
            maxStudents: school.maxStudents,
            maxClasses: school.maxClasses,
            primaryColor: school.theme.primaryColor,
            secondaryColor: school.theme.secondaryColor || '#1e40af',
            isActive: school.isActive
        });
        setShowModal(true);
    };

    return (
        <>
            <Sidebar role="SUPER_ADMIN" />
            <Shell role="SUPER_ADMIN" title="Manage Schools">
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-500">Total registered schools in the system.</p>
                    <button
                        onClick={() => {
                            setEditingSchoolId(null);
                            setFormData({
                                name: '', email: '', password: '', phone: '',
                                maxStudents: 100, maxClasses: 10,
                                primaryColor: '#3b82f6', secondaryColor: '#1e40af',
                                isActive: true
                            });
                            setShowModal(true);
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={20} />
                        <span>Add New School</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">School Name</th>
                                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Plan Limits</th>
                                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.map((school) => (
                                <tr key={school._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                    <td className="p-6">
                                        <div className="font-bold text-gray-800">{school.name}</div>
                                        <div className="text-sm text-gray-500">{school.email}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                            {school.maxStudents} Students / {school.maxClasses} Classes
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className={`flex items-center space-x-2 font-medium ${school.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                            <Power size={16} />
                                            <span>{school.isActive ? 'Active' : 'Disabled'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: school.theme.primaryColor }}></div>
                                            <button
                                                onClick={() => handleEdit(school)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Palette size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {schools.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-400">No schools found. Create your first one!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-8">
                                <h3 className="text-2xl font-bold mb-6">{editingSchoolId ? 'Edit School Details' : 'Create New School Partner'}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-600">School Name</label>
                                        <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Elite International Academy" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Admin Email</label>
                                        <input type="email" required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@elite.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Admin Password {editingSchoolId && '(Leave blank to keep current)'}</label>
                                        <input type="password" required={!editingSchoolId} className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Phone Number</label>
                                        <input type="tel" required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 234 567 890" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Max Students</label>
                                        <input type="number" required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Max Classes</label>
                                        <input type="number" required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-blue-500 outline-none" value={formData.maxClasses} onChange={e => setFormData({ ...formData, maxClasses: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Primary Color</label>
                                        <input type="color" className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer" value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Secondary Color</label>
                                        <input type="color" className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer" value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} />
                                    </div>
                                    {editingSchoolId && (
                                        <div className="md:col-span-2 flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                                            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700">School Account Active</label>
                                        </div>
                                    )}
                                </div>
                                <div className="flex space-x-4">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                                        {editingSchoolId ? 'Update School' : 'Create School & Admin'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Shell>
        </>
    );
}
