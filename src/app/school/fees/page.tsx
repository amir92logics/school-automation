'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Shell } from '@/components/Shell';
import { ThemeProvider } from '@/components/ThemeProvider';
import {
    CreditCard,
    Search,
    Filter,
    Send,
    Edit2,
    CheckCircle,
    AlertCircle,
    Clock,
    ChevronRight,
    Loader2,
    Link as LinkIcon
} from 'lucide-react';
import { WhatsAppEditor } from '@/components/WhatsAppEditor';

export default function FeesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [school, setSchool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null); // 'bulk' or studentId
    const [isWhatsAppEditorOpen, setIsWhatsAppEditorOpen] = useState(false);
    const [editorData, setEditorData] = useState<any>(null);
    const [reminderType, setReminderType] = useState<'single' | 'bulk'>('single');
    const [targetStudentId, setTargetStudentId] = useState<string | undefined>();

    useEffect(() => {
        fetch('/api/school/settings').then(res => res.json()).then(setSchool);
        fetch('/api/school/fees').then(res => res.json()).then(data => {
            setClasses(data);
            if (data.length > 0) setSelectedClass(data[0].id);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedClass) {
            setLoading(true);
            fetch(`/api/school/fees/students?classId=${selectedClass}`)
                .then(res => res.json())
                .then(data => {
                    setStudents(data);
                    setLoading(false);
                });
        }
    }, [selectedClass]);

    const handleUpdateFee = async (classId: string, currentFee: number) => {
        const newFee = prompt('Enter new fee amount:', currentFee.toString());
        if (newFee && !isNaN(Number(newFee))) {
            const res = await fetch('/api/school/fees', {
                method: 'PATCH',
                body: JSON.stringify({ classId, feeAmount: Number(newFee) }),
            });
            if (res.ok) {
                setClasses(classes.map(c => c.id === classId ? { ...c, feeAmount: Number(newFee) } : c));
            }
        }
    };

    const openEditor = async (type: 'single' | 'bulk', student?: any) => {
        setReminderType(type);
        setTargetStudentId(student?.id);

        const currentClass = classes.find(c => c.id === selectedClass);

        // Always re-fetch school settings to get the latest payment links
        let freshSchool = school;
        try {
            const res = await fetch(`/api/school/settings?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                // If it comes back as { message, school } shape, unwrap it
                freshSchool = data.school ?? data;
                setSchool(freshSchool);
                console.log('[Fees] Refreshed school - jazzcashPaymentLink:', freshSchool.jazzcashPaymentLink);
                console.log('[Fees] Refreshed school - easypaisaPaymentLink:', freshSchool.easypaisaPaymentLink);
            } else {
                console.warn('[Fees] Settings re-fetch failed with status:', res.status);
            }
        } catch (e) {
            console.error('[Fees] Settings re-fetch error:', e);
        }

        setEditorData({
            studentName: type === 'single' ? student.name : 'All Students',
            amount: type === 'single' ? (student.feeAmount || currentClass?.feeAmount || 0) : (currentClass?.feeAmount || 0),
            dueDate: 'End of Month',
            schoolName: freshSchool.name,
            jazzcashLink: freshSchool.jazzcashPaymentLink?.trim() || '',
            easypaisaLink: freshSchool.easypaisaPaymentLink?.trim() || ''
        });
        setIsWhatsAppEditorOpen(true);
    };

    const handleConfirmSend = async (customMessage: string) => {
        setIsWhatsAppEditorOpen(false);
        setSendingReminder(targetStudentId || 'bulk');

        try {
            const res = await fetch('/api/school/fees/reminder', {
                method: 'POST',
                body: JSON.stringify({
                    type: reminderType,
                    classId: selectedClass,
                    studentIds: targetStudentId ? [targetStudentId] : [],
                    customMessage // Pass the edited message
                }),
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (error) {
            alert('Failed to send reminder');
        } finally {
            setSendingReminder(null);
        }
    };

    if (!school) return <div className="p-8">Loading...</div>;

    const pendingCount = students.filter(s => s.status === 'PENDING').length;

    return (
        <>
            <ThemeProvider theme={{ primary: school.primaryColor, secondary: school.secondaryColor }} />
            <Sidebar role="SCHOOL_ADMIN" />
            <Shell role="SCHOOL_ADMIN" title="Fee Management">



                {/* Section 1: Class Fee Overview */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <Clock className="text-blue-500" size={20} />
                        <span>Class Fee Overview</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {classes.map((cls) => (
                            <div key={cls.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg">{cls.name}</h4>
                                        <p className="text-sm text-gray-400 font-medium">Section {cls.section}</p>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateFee(cls.id, cls.feeAmount)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Default Fee</p>
                                        <p className="text-2xl font-black text-gray-800">Rs {cls.feeAmount}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedClass(cls.id)}
                                        className={`p-2 rounded-xl transition-all ${selectedClass === cls.id ? 'school-primary text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Student Fee Status & Bulk Reminder */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all w-64"
                                />
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                <Filter size={14} />
                                <span className="font-medium">Filter:</span>
                                <span className="font-bold text-gray-800">All Students</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="text-right mr-2 hidden md:block">
                                <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
                                <p className="text-sm font-black text-red-500">{pendingCount} Students</p>
                            </div>
                            <button
                                onClick={() => openEditor('bulk')}
                                disabled={sendingReminder === 'bulk' || pendingCount === 0}
                                className="school-primary px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-100 flex items-center space-x-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {sendingReminder === 'bulk' ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Send size={18} />
                                )}
                                <span>Send Bulk Reminder</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Student Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Parent / Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                            Fetching student records...
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            No students found in this class.
                                        </td>
                                    </tr>
                                ) : students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">{student.name}</p>
                                            <p className="text-xs text-gray-400">Roll: {student.rollNumber}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700">{student.parentName || 'N/A'}</p>
                                            <p className="text-xs text-blue-500 font-bold">{student.parentPhone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-gray-800">
                                            Rs {student.feeAmount}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {student.status === 'PAID' ? (
                                                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold ring-1 ring-green-100">
                                                    <CheckCircle size={12} />
                                                    <span>PAID</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold ring-1 ring-red-100">
                                                    <AlertCircle size={12} />
                                                    <span>PENDING</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {student.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => openEditor('single', student)}
                                                        disabled={sendingReminder === student.id}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Send WhatsApp Reminder"
                                                    >
                                                        {sendingReminder === student.id ? (
                                                            <Loader2 className="animate-spin" size={18} />
                                                        ) : (
                                                            <Send size={18} />
                                                        )}
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isWhatsAppEditorOpen && editorData && (
                    <WhatsAppEditor
                        isOpen={isWhatsAppEditorOpen}
                        onClose={() => setIsWhatsAppEditorOpen(false)}
                        onSend={handleConfirmSend}
                        data={editorData}
                        primaryColor={school.primaryColor}
                    />
                )}
            </Shell>
        </>
    );
}
