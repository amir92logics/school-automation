import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Class';
import { FeeRecord } from '@/models/FeeRecord';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = session.user.schoolId;
        await dbConnect();

        const classes = await Class.find({ schoolId });
        return NextResponse.json(classes);
    } catch (error: any) {
        console.error('Fees GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { classId, feeAmount } = await req.json();
        if (!classId || feeAmount === undefined) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        await dbConnect();
        const cls = await Class.findOneAndUpdate(
            { _id: classId, schoolId: session.user.schoolId },
            { feeAmount },
            { new: true }
        );

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        return NextResponse.json(cls);
    } catch (error: any) {
        console.error('Fees PATCH error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
