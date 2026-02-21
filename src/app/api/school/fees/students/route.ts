import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Student } from '@/models/Student';
import { FeeRecord } from '@/models/FeeRecord';
import { Class } from '@/models/Class';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');

        if (!classId) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        await dbConnect();

        const students = await Student.find({ classId, schoolId: session.user.schoolId }).lean();
        const classData = await Class.findById(classId).lean();

        const feeRecords = await FeeRecord.find({
            classId,
            schoolId: session.user.schoolId,
            studentId: { $in: students.map(s => s._id) }
        }).lean();

        const studentsWithFees = students.map(student => {
            const record = feeRecords.find(r =>
                r.studentId?.toString() === student._id?.toString()
            );
            return {
                ...student,
                feeAmount: classData?.feeAmount || 0,
                status: record?.status || 'PENDING',
                dueDate: record?.dueDate || null,
                recordId: record?._id || null
            };
        });

        return NextResponse.json(studentsWithFees);
    } catch (error: any) {
        console.error('Fees/students GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
