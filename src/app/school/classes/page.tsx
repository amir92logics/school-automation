'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';

interface Class {
    _id: string;
    name: string;
    section: string;
    feeAmount: number;
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', section: '', feeAmount: '' });

    const fetchClasses = async () => {
        const res = await fetch('/api/school/classes');
        setClasses(await res.json());
    };

    useEffect(() => { fetchClasses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const method = editingClassId ? 'PATCH' : 'POST';
        const body = editingClassId ? { ...formData, id: editingClassId } : formData;

        const res = await fetch('/api/school/classes', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
            setShowModal(false);
            setEditingClassId(null);
            fetchClasses();
            setFormData({ name: '', section: '', feeAmount: '' });
        } else {
            setError(data.error);
        }
    };

    const handleEdit = (cls: any) => {
        setEditingClassId(cls._id);
        setFormData({
            name: cls.name,
            section: cls.section,
            feeAmount: cls.feeAmount.toString()
        });
        setShowModal(true);
    };

    return (
        <>
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title="Classes Management">
                <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h4 className="font-bold text-gray-800">Your Class List</h4>
                        <p className="text-sm text-gray-500 font-medium">Create and organize your school sections.</p>
                    </div>
                    <button onClick={() => {
                        setEditingClassId(null);
                        setFormData({ name: '', section: '', feeAmount: '' });
                        setShowModal(true);
                    }} className="school-primary px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-100">
                        <Plus size={20} />
                        <span>New Class</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group relative">
                            <button
                                onClick={() => handleEdit(cls)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <AlertCircle size={18} className="rotate-180" />
                            </button>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gray-50 text-gray-400 w-12 h-12 rounded-xl flex items-center justify-center group-hover:school-primary group-hover:text-white transition-all">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-800">{cls.name}</h4>
                                        <p className="text-gray-500 font-medium text-sm">Section {cls.section}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Fee</p>
                                    <p className="text-lg font-bold text-gray-800">Rs {cls.feeAmount}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-medium">No classes created yet.</div>}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                            <div className="school-primary p-6">
                                <h3 className="text-xl font-bold">{editingClassId ? 'Edit Class Details' : 'Add New Class'}</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 text-sm border border-red-100"><AlertCircle size={18} /> <span>{error}</span></div>}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Class Name</label>
                                    <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none transition-all" placeholder="Grade 10" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Section</label>
                                        <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none transition-all" placeholder="A" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Monthly Fee (Rs)</label>
                                        <input required type="number" className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none transition-all" placeholder="5000" value={formData.feeAmount} onChange={e => setFormData({ ...formData, feeAmount: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <button type="submit" className="flex-1 school-primary py-3 rounded-xl font-bold shadow-lg shadow-blue-100">{editingClassId ? 'Update Class' : 'Add Class'}</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Shell>
        </>
    );
}
