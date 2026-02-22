import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const classes = await prisma.class.findMany({
        where: { schoolId: token.schoolId as string },
        orderBy: { name: 'asc' }
    });
    return NextResponse.json(classes);
}

export async function POST(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, section, feeAmount } = await req.json();
    const schoolId = token.schoolId as string;

    if (!feeAmount || isNaN(Number(feeAmount))) {
        return NextResponse.json({ error: 'Fee amount is required and must be a number.' }, { status: 400 });
    }

    // LIMIT ENFORCEMENT
    const school = await prisma.school.findUnique({
        where: { id: schoolId }
    });
    const classCount = await prisma.class.count({
        where: { schoolId }
    });

    if (!school || classCount >= school.maxClasses) {
        return NextResponse.json({ error: 'Class limit reached for your plan.' }, { status: 403 });
    }

    const newClass = await prisma.class.create({
        data: { name, section, feeAmount: Number(feeAmount), schoolId }
    });
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

        const cls = await prisma.class.update({
            where: { id, schoolId: token.schoolId as string },
            data: { name, section, feeAmount: Number(feeAmount) }
        });

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
