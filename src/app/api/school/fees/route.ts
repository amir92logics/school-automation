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

        const schoolId = (session.user as any).schoolId;
        const classes = await prisma.class.findMany({
            where: { schoolId }
        });
        return NextResponse.json(classes);
    } catch (error: any) {
        console.error('Fees GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { classId, feeAmount } = await req.json();
        if (!classId || feeAmount === undefined) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const cls = await prisma.class.update({
            where: { id: classId, schoolId: (session.user as any).schoolId },
            data: { feeAmount }
        });

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        return NextResponse.json(cls);
    } catch (error: any) {
        console.error('Fees PATCH error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
