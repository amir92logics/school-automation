import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';
import { Student } from '@/models/Student';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const students = await Student.find({ schoolId: token.schoolId }).populate('classId').sort({ createdAt: -1 });
    return NextResponse.json(students);
}

export async function POST(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, rollNumber, classId, parentName, parentPhone } = await req.json();
    const schoolId = token.schoolId as string;

    await dbConnect();

    if (!parentPhone || !/^\d{10,15}$/.test(parentPhone)) {
        return NextResponse.json({ error: 'Valid parent phone (10-15 digits) is required.' }, { status: 400 });
    }

    // LIMIT ENFORCEMENT
    const school = await School.findById(schoolId);
    const studentCount = await Student.countDocuments({ schoolId });

    if (studentCount >= school.maxStudents) {
        return NextResponse.json({ error: 'Student limit reached for your plan.' }, { status: 403 });
    }

    const student = await Student.create({ name, rollNumber, classId, parentName, parentPhone, schoolId });
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

        await dbConnect();

        const student = await Student.findOneAndUpdate(
            { _id: id, schoolId: token.schoolId },
            { name, rollNumber, classId, parentName, parentPhone },
            { new: true }
        );

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
