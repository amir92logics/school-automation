import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';
import { Student } from '@/models/Student';
import { Class } from '@/models/Class';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [totalSchools, totalStudents, totalClasses, activeSchools] = await Promise.all([
        School.countDocuments({}),
        Student.countDocuments({}),
        Class.countDocuments({}),
        School.countDocuments({ isActive: true }),
    ]);

    return NextResponse.json({
        totalSchools,
        totalStudents,
        totalClasses,
        activeSchools,
        inactiveSchools: totalSchools - activeSchools,
    });
}
