import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';
import { Student } from '@/models/Student';
import { FeeRecord } from '@/models/FeeRecord';
import { Class } from '@/models/Class';
import { FeeMessageLog } from '@/models/FeeMessageLog';
import { PaymentTransaction } from '@/models/PaymentTransaction';

export async function GET(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;

        if (!schoolId || !mongoose.isValidObjectId(schoolId)) {
            return NextResponse.json({ error: 'Invalid school ID in session' }, { status: 400 });
        }

        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
        await dbConnect();

        const [school, studentCount, classCount, feeStats, remindersSent, sandboxStats] = await Promise.all([
            School.findById(schoolObjectId),
            Student.countDocuments({ schoolId: schoolObjectId }),
            Class.countDocuments({ schoolId: schoolObjectId }),
            FeeRecord.aggregate([
                { $match: { schoolId: schoolObjectId } },
                {
                    $group: {
                        _id: null,
                        totalCollection: { $sum: '$amount' },
                        paidAmount: {
                            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] }
                        },
                        pendingAmount: {
                            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, '$amount', 0] }
                        }
                    }
                }
            ]),
            FeeMessageLog.countDocuments({ schoolId: schoolObjectId, status: 'SENT' }),
            PaymentTransaction.aggregate([
                { $match: { schoolId: schoolObjectId, isSandbox: true } },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        successCount: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } },
                        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
                        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'INITIATED'] }, 1, 0] } },
                        successAmount: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, '$amount', 0] } }
                    }
                }
            ])
        ]);

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        const { totalCollection = 0, paidAmount = 0, pendingAmount = 0 } = feeStats[0] || {};
        const sandbox = sandboxStats[0] || { totalCount: 0, successCount: 0, failedCount: 0, pendingCount: 0, successAmount: 0 };

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
