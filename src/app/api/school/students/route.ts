import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const students = await prisma.student.findMany({
        where: { schoolId: token.schoolId as string },
        include: { class: true },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(students);
}

export async function POST(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, rollNumber, classId, parentName, parentPhone } = await req.json();
    const schoolId = token.schoolId as string;

    const school = await prisma.school.findUnique({
        where: { id: schoolId }
    });
    const studentCount = await prisma.student.count({
        where: { schoolId }
    });

    if (!school || studentCount >= school.maxStudents) {
        return NextResponse.json({ error: 'Student limit reached for your plan.' }, { status: 403 });
    }

    const student = await prisma.student.create({
        data: { name, rollNumber, classId, parentName, parentPhone, schoolId }
    });
    return NextResponse.json(student);
}

export async function PATCH(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const { id, name, rollNumber, classId, parentName, parentPhone } = data;

        if (!id) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        const student = await prisma.student.update({
            where: { id, schoolId: token.schoolId as string },
            data: { name, rollNumber, classId, parentName, parentPhone }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Student updated successfully', student });
    } catch (error: any) {
        console.error('Error updating student:', error);
        return NextResponse.json({
            error: 'Failed to update student',
            details: error.message
        }, { status: 500 });
    }
}
