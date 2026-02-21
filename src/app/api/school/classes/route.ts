import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';
import { Class } from '@/models/Class';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const classes = await Class.find({ schoolId: token.schoolId }).sort({ name: 1 });
    return NextResponse.json(classes);
}

export async function POST(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, section, feeAmount } = await req.json();
    const schoolId = token.schoolId as string;

    await dbConnect();

    if (!feeAmount || isNaN(Number(feeAmount))) {
        return NextResponse.json({ error: 'Fee amount is required and must be a number.' }, { status: 400 });
    }

    // LIMIT ENFORCEMENT
    const school = await School.findById(schoolId);
    const classCount = await Class.countDocuments({ schoolId });

    if (classCount >= school.maxClasses) {
        return NextResponse.json({ error: 'Class limit reached for your plan.' }, { status: 403 });
    }

    const newClass = await Class.create({ name, section, feeAmount, schoolId });
    return NextResponse.json(newClass);
}

export async function PATCH(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const { id, name, section, feeAmount } = data;

        if (!id) {
            return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
        }

        await dbConnect();

        const cls = await Class.findOneAndUpdate(
            { _id: id, schoolId: token.schoolId },
            { name, section, feeAmount: Number(feeAmount) },
            { new: true }
        );

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Class updated successfully', cls });
    } catch (error: any) {
        console.error('Error updating class:', error);
        return NextResponse.json({
            error: 'Failed to update class',
            details: error.message
        }, { status: 500 });
    }
}
