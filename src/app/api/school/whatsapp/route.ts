import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsappService';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;
    const status = await whatsappService.getStatus(schoolId);

    return NextResponse.json({ status });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;
    const { action } = await req.json();

    await dbConnect();
    const school = await School.findById(schoolId);
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
