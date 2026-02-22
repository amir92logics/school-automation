import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsappService';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const status = await whatsappService.getStatus(schoolId);

    return NextResponse.json({ status });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const { action } = await req.json();

    const school = await prisma.school.findUnique({
        where: { id: schoolId }
    });
    if (!school || !school.isActive) {
        return NextResponse.json({ error: 'School inactive' }, { status: 403 });
    }

    if (action === 'connect') {
        // Initialize client (will emit QR via Socket.io)
        whatsappService.initializeClient(schoolId);
        return NextResponse.json({ message: 'Initializing connection' });
    }

    if (action === 'logout') {
        await whatsappService.logout(schoolId);
        return NextResponse.json({ message: 'Logged out successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
