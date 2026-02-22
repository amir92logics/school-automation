import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');

        if (!classId) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        const students = await prisma.student.findMany({
            where: { classId, schoolId: (session.user as any).schoolId }
        });
        const classData = await prisma.class.findUnique({
            where: { id: classId }
        });

        const feeRecords = await prisma.feeRecord.findMany({
            where: {
                classId,
                schoolId: (session.user as any).schoolId,
                studentId: { in: students.map((s: any) => s.id) }
            }
        });

        const studentsWithFees = students.map((student: any) => {
            const record = feeRecords.find((r: any) =>
                r.studentId === student.id
            );
            return {
                ...student,
                feeAmount: classData?.feeAmount || 0,
                status: record?.status || 'PENDING',
                dueDate: record?.dueDate || null,
                recordId: record?.id || null
            };
        });

        return NextResponse.json(studentsWithFees);
    } catch (error: any) {
        console.error('Fees/students GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
