import { NextRequest, NextResponse } from 'next/server';
import { sandboxPaymentService } from '@/lib/sandbox-payment-service';
import { PaymentTransaction } from '@/models/PaymentTransaction';
import { Student } from '@/models/Student';
import { School } from '@/models/School';
import { whatsappService } from '@/lib/whatsappService';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Sandbox simulator disabled' }, { status: 403 });
    }

    try {
        const { transactionRef, status } = await req.json();

        if (!transactionRef || !status || !['SUCCESS', 'FAILED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        await dbConnect();

        // Find transaction to get context for WhatsApp
        const transaction = await PaymentTransaction.findOne({ transactionRef });
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
                const student = await Student.findById(transaction.studentId);
                const school = await School.findById(transaction.schoolId);

                if (student && school) {
                    const message = `✅ *Payment Success Confirmation*\n\nDear Parent,\nYour payment for ${student.name} of Rs ${transaction.amount} via ${transaction.gateway} has been successfully received.\n\nTransaction Ref: ${transactionRef}\nStatus: PAID (Simulated)\n\nRegards,\n${school.name}`;

                    await whatsappService.sendMessage(school._id.toString(), student.parentPhone, message);
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
