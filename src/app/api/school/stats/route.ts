import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;

        const [school, studentCount, classCount, feeStats, paidStats, pendingStats, remindersSent, sandboxStats, successSandboxStats] = await Promise.all([
            prisma.school.findUnique({ where: { id: schoolId } }),
            prisma.student.count({ where: { schoolId } }),
            prisma.class.count({ where: { schoolId } }),
            prisma.feeRecord.aggregate({
                where: { schoolId },
                _sum: { amount: true }
            }),
            prisma.feeRecord.aggregate({
                where: { schoolId, status: 'PAID' },
                _sum: { amount: true }
            }),
            prisma.feeRecord.aggregate({
                where: { schoolId, status: 'PENDING' },
                _sum: { amount: true }
            }),
            prisma.feeMessageLog.count({ where: { schoolId, status: 'SENT' } }),
            prisma.paymentTransaction.count({ where: { schoolId, isSandbox: true } }),
            prisma.paymentTransaction.aggregate({
                where: { schoolId, isSandbox: true, status: 'SUCCESS' },
                _sum: { amount: true },
                _count: { id: true }
            })
        ]);

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        const moreSandboxStats = await prisma.paymentTransaction.groupBy({
            by: ['status'],
            where: { schoolId, isSandbox: true },
            _count: { id: true }
        });

        const successCount = moreSandboxStats.find((s: any) => s.status === 'SUCCESS')?._count.id || 0;
        const failedCount = moreSandboxStats.find((s: any) => s.status === 'FAILED')?._count.id || 0;
        const pendingCount = moreSandboxStats.find((s: any) => s.status === 'INITIATED')?._count.id || 0;

        const totalCollection = feeStats._sum.amount || 0;
        const paidAmount = paidStats._sum.amount || 0;
        const pendingAmount = pendingStats._sum.amount || 0;
        const sandboxTotalCount = sandboxStats;
        const sandboxSuccessAmount = successSandboxStats._sum.amount || 0;

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        const sandbox = {
            totalCount: sandboxTotalCount,
            successCount,
            failedCount,
            pendingCount,
            successAmount: sandboxSuccessAmount
        };

        return NextResponse.json({
            school,
            studentCount,
            classCount,
            remindersSent,
            studentLimit: school.maxStudents,
            classLimit: school.maxClasses,
            studentUsage: (studentCount / school.maxStudents) * 100,
            classUsage: (classCount / school.maxClasses) * 100,
            feeStats: {
                totalCollection,
                paidAmount,
                pendingAmount
            },
            sandboxStats: {
                total: sandbox.totalCount,
                successful: sandbox.successCount,
                pending: sandbox.pendingCount,
                failed: sandbox.failedCount,
                amount: sandbox.successAmount
            }
        });
    } catch (error: any) {
        console.error('API Error in school stats:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
