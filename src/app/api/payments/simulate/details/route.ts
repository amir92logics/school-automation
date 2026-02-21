import { NextRequest, NextResponse } from 'next/server';
import { PaymentTransaction } from '@/models/PaymentTransaction';
import { Student } from '@/models/Student';
import { School } from '@/models/School';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Sandbox simulator disabled' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const ref = searchParams.get('ref');

        if (!ref) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        await dbConnect();

        const transaction = await PaymentTransaction.findOne({ transactionRef: ref });
        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const student = await Student.findById(transaction.studentId);
        const school = await School.findById(transaction.schoolId);

        return NextResponse.json({
            amount: transaction.amount,
            status: transaction.status,
            studentName: student?.name || 'Unknown Student',
            schoolName: school?.name || 'Unknown School'
        });

    } catch (error: any) {
        console.error('API Error in simulator details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
