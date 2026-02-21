'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { Plus, User, AlertCircle } from 'lucide-react';

interface Student {
    _id: string;
    name: string;
    rollNumber: string;
    classId: { name: string; section: string };
}

interface Class {
    _id: string;
    name: string;
    section: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', rollNumber: '', classId: '', parentName: '', parentPhone: '' });

    const fetchData = async () => {
        const [sRes, cRes] = await Promise.all([
            fetch('/api/school/students'),
            fetch('/api/school/classes')
        ]);
        setStudents(await sRes.json());
        setClasses(await cRes.json());
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const method = editingStudentId ? 'PATCH' : 'POST';
        const body = editingStudentId ? { ...formData, id: editingStudentId } : formData;

        const res = await fetch('/api/school/students', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
            setShowModal(false);
            setEditingStudentId(null);
            fetchData();
            setFormData({ name: '', rollNumber: '', classId: '', parentName: '', parentPhone: '' });
        } else {
            setError(data.error);
        }
    };

    const handleEdit = (student: any) => {
        setEditingStudentId(student._id);
        setFormData({
            name: student.name,
            rollNumber: student.rollNumber,
            classId: student.classId?._id || student.classId || '',
            parentName: student.parentName || '',
            parentPhone: student.parentPhone || ''
        });
        setShowModal(true);
    };

    return (
        <>
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title="Student Directory">
                <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h4 className="font-bold text-gray-800">Enrollment Portal</h4>
                        <p className="text-sm text-gray-500 font-medium">Manage student records and admissions.</p>
                    </div>
                    <button onClick={() => {
                        setEditingStudentId(null);
                        setFormData({ name: '', rollNumber: '', classId: '', parentName: '', parentPhone: '' });
                        setShowModal(true);
                    }} className="school-primary px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-100">
                        <Plus size={20} />
                        <span>Admit Student</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                <th className="p-6">Student Name</th>
                                <th className="p-6">Roll Number</th>
                                <th className="p-6">Class Assignment</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50/50 transition-all">
                                    <td className="p-6 flex items-center space-x-4">
                                        <div className="bg-blue-50 text-blue-500 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-gray-800">{student.name}</span>
                                    </td>
                                    <td className="p-6 font-medium text-gray-600">#{student.rollNumber}</td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-tight">
                                            {student.classId?.name} - {student.classId?.section}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button onClick={() => handleEdit(student)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                            <AlertCircle size={18} className="rotate-180" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && <div className="p-20 text-center text-gray-400 font-medium">No students enrolled.</div>}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                            <div className="school-primary p-6 text-center">
                                <h3 className="text-xl font-bold">{editingStudentId ? 'Update Student Record' : 'Student Admission'}</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 text-sm border border-red-100"><AlertCircle size={18} /> <span>{error}</span></div>}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Full Name</label>
                                    <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Roll Number</label>
                                    <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none" placeholder="2024-001" value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Parent Name</label>
                                        <input className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none" placeholder="Jane Doe" value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Parent Phone (Required)</label>
                                        <input required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none" placeholder="923001234567" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Select Class</label>
                                    <select required className="w-full border-gray-200 rounded-xl px-4 py-3 border focus:ring-2 focus:school-primary outline-none appearance-none bg-white" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}>
                                        <option value="">Choose a class...</option>
                                        {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.section}</option>)}
                                    </select>
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button type="submit" className="flex-1 school-primary py-3 rounded-xl font-bold shadow-lg shadow-blue-100">{editingStudentId ? 'Update Record' : 'Admit Student'}</button>
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
