import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalSchools, totalStudents, totalClasses, activeSchools] = await Promise.all([
        prisma.school.count(),
        prisma.student.count(),
        prisma.class.count(),
        prisma.school.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
        totalSchools,
        totalStudents,
        totalClasses,
        activeSchools,
        inactiveSchools: totalSchools - activeSchools,
    });
}
