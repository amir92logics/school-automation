import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;
        const school = await prisma.school.findUnique({
            where: { id: schoolId }
        });
        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        console.log('[Settings GET] jazzcashPaymentLink:', (school as any).jazzcashPaymentLink);
        console.log('[Settings GET] easypaisaPaymentLink:', (school as any).easypaisaPaymentLink);

        return NextResponse.json(school);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;
        const body = await req.json();
        const { name, phone, primaryColor, secondaryColor } = body;

        console.log('[Settings POST] Saving for school:', schoolId);

        const school = await prisma.school.update({
            where: { id: schoolId },
            data: {
                name,
                phone,
                primaryColor,
                secondaryColor,
            }
        });

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        console.log('[Settings POST] Saved jazzcashPaymentLink:', (school as any).jazzcashPaymentLink);

        return NextResponse.json({ message: 'Settings updated successfully', school });
    } catch (error: any) {
        console.error('[Settings POST] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

