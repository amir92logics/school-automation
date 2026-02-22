import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { sandboxPaymentService } from '@/lib/sandbox-payment-service';
import { whatsappService } from '@/lib/whatsappService';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Sandbox simulator disabled' }, { status: 403 });
    }

    try {
        const { transactionRef, status } = await req.json();

        if (!transactionRef || !status || !['SUCCESS', 'FAILED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const transaction = await prisma.paymentTransaction.findUnique({
            where: { transactionRef }
        });
        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const result = await sandboxPaymentService.processSimulation(transactionRef, status);

        if (result.alreadyProcessed) {
            return NextResponse.json({ message: 'Transaction already processed', status: result.status });
        }

        // Send actual WhatsApp confirmation if SUCCESS
        if (status === 'SUCCESS') {
            try {
                const student = await prisma.student.findUnique({
                    where: { id: transaction.studentId }
                });
                const school = await prisma.school.findUnique({
                    where: { id: transaction.schoolId }
                });

                if (student && school) {
                    const message = `✅ *Payment Success Confirmation*\n\nDear Parent,\nYour payment for ${student.name} of Rs ${transaction.amount} via ${transaction.gateway} has been successfully received.\n\nTransaction Ref: ${transactionRef}\nStatus: PAID (Simulated)\n\nRegards,\n${school.name}`;

                    await whatsappService.sendMessage(school.id, student.parentPhone, message);
                }
            } catch (waError) {
                console.error('Failed to send WhatsApp confirmation in simulation:', waError);
            }
        }

        return NextResponse.json({ message: `Simulation successful: ${status}`, status });
    } catch (error: any) {
        console.error('Simulation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
