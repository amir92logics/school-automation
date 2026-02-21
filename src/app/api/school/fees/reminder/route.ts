import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsappService';
import dbConnect from '@/lib/db';
import { Student } from '@/models/Student';
import { FeeRecord } from '@/models/FeeRecord';
import { School } from '@/models/School';
import { Class } from '@/models/Class';
import { FeeMessageLog } from '@/models/FeeMessageLog';
import { sandboxPaymentService } from '@/lib/sandbox-payment-service';

// Triggering Vercel rebuild with verified session fixes
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = (session.user as any).schoolId;
        const { studentIds, classId, type, customMessage } = await req.json();

        if (!classId && type === 'bulk') {
            return NextResponse.json({ error: 'Class ID is required for bulk reminders' }, { status: 400 });
        }

        await dbConnect();
        const school = await School.findById(schoolId);
        if (!school || !school.isActive) {
            return NextResponse.json({ error: 'School inactive' }, { status: 403 });
        }

        const status = await whatsappService.getStatus(schoolId);
        if (status !== 'CONNECTED') {
            return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
        }

        let targets = [];
        if (type === 'bulk') {
            const allStudents = await Student.find({ classId, schoolId });
            const feeRecords = await FeeRecord.find({ classId, schoolId, status: 'PAID' });
            // SAFE MAPPING: Ensure studentId exists before calling toString()
            const paidStudentIds = feeRecords
                .map(r => r.studentId ? r.studentId.toString() : null)
                .filter(id => id !== null);

            targets = allStudents.filter(s => s._id && !paidStudentIds.includes(s._id.toString()));
        } else {
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                return NextResponse.json({ error: 'No students selected' }, { status: 400 });
            }
            targets = await Student.find({ _id: { $in: studentIds }, schoolId });
        }

        if (targets.length === 0) {
            return NextResponse.json({ message: 'No pending students found' });
        }

        const classData = classId ? await Class.findById(classId) : null;
        if (!classData && type === 'bulk') return NextResponse.json({ error: 'Class not found' }, { status: 404 });

        const results = { success: 0, failed: 0 };

        for (const student of targets) {
            const record = await FeeRecord.findOne({ studentId: student._id, classId, schoolId });
            const amount = record?.amount ?? classData?.feeAmount ?? 0;
            const dueDate = record?.dueDate?.toLocaleDateString?.() || 'End of Month';



            // Build default message — only include payment link lines when links are non-empty
            let finalMessage: string;

            // Generate sandbox payment links for each student
            const jcTransaction = await sandboxPaymentService.createTransaction({
                feeRecordId: record?._id?.toString() || new mongoose.Types.ObjectId().toString(),
                studentId: student._id.toString(),
                schoolId: schoolId,
                amount,
                gateway: 'JAZZCASH'
            });
            const epTransaction = await sandboxPaymentService.createTransaction({
                feeRecordId: record?._id?.toString() || new mongoose.Types.ObjectId().toString(),
                studentId: student._id.toString(),
                schoolId: schoolId,
                amount,
                gateway: 'EASYPAISA'
            });

            const jcSandboxLink = sandboxPaymentService.buildSandboxLink('jazzcash', jcTransaction.transactionRef);
            const epSandboxLink = sandboxPaymentService.buildSandboxLink('easypaisa', epTransaction.transactionRef);

            const paymentLinkText = `\n\n💳 *Payment Options:*\nJazzCash:\n${jcSandboxLink}\nEasypaisa:\n${epSandboxLink}\n\nRef: ${jcTransaction.transactionRef}`;

            if (customMessage && customMessage.trim()) {
                finalMessage = `${customMessage}${paymentLinkText}`;
            } else {
                finalMessage = `Dear Parent, Your child ${student.name ?? ''} has a pending fee of Rs ${amount}.\nDue Date: ${dueDate}${paymentLinkText}\n\nRegards,\n${school.name ?? ''}`;
            }

            try {
                await whatsappService.sendMessage(schoolId, student.parentPhone, finalMessage);

                // LOG the message
                await FeeMessageLog.create({
                    studentId: student._id,
                    feeRecordId: record?._id || new mongoose.Types.ObjectId(),
                    messageContent: finalMessage,
                    schoolId,
                    status: 'SENT'
                });

                results.success++;
            } catch (error) {
                console.error(`Failed to send reminder to ${student.name}:`, error);

                await FeeMessageLog.create({
                    studentId: student._id,
                    feeRecordId: record?._id || new mongoose.Types.ObjectId(),
                    messageContent: finalMessage,
                    schoolId,
                    status: 'FAILED'
                });

                results.failed++;
            }
        }

        return NextResponse.json({
            message: `Reminders sent: ${results.success} succeeded, ${results.failed} failed.`,
            results
        });
    } catch (error: any) {
        console.error('API Error in fee reminder:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
