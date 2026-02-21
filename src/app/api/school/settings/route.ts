import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';

export async function GET(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;
        await dbConnect();

        const school = await School.findOne({ _id: schoolId }).lean();
        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        console.log('[Settings GET] jazzcashPaymentLink:', (school as any).jazzcashPaymentLink);
        console.log('[Settings GET] easypaisaPaymentLink:', (school as any).easypaisaPaymentLink);

        return NextResponse.json(school);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schoolId = token.schoolId as string;
        const body = await req.json();
        const { name, phone, primaryColor, secondaryColor } = body;

        console.log('[Settings POST] Saving for school:', schoolId);

        await dbConnect();

        // Use findOneAndUpdate with string _id filter — avoids ObjectId cast failures
        // when school _id was created as a plain string instead of an ObjectId
        const school = await School.findOneAndUpdate(
            { _id: schoolId },
            {
                $set: {
                    name,
                    phone,
                    'theme.primaryColor': primaryColor,
                    'theme.secondaryColor': secondaryColor,
                }
            },
            { new: true, runValidators: false }
        ).lean();

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        console.log('[Settings POST] Saved jazzcashPaymentLink:', (school as any).jazzcashPaymentLink);

        return NextResponse.json({ message: 'Settings updated successfully', school });
    } catch (error: any) {
        console.error('[Settings POST] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

