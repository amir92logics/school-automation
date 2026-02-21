import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import { School } from '@/models/School';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const schools = await School.find({}).sort({ createdAt: -1 });
    return NextResponse.json(schools);
}

export async function POST(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { name, email, password, phone, maxStudents, maxClasses, primaryColor, secondaryColor } = data;

        // Basic validation
        if (!name || !email || !password || !phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered as a user' }, { status: 400 });
        }

        // 1. Create School
        const school = await School.create({
            name,
            email,
            phone,
            maxStudents: Number(maxStudents) || 0,
            maxClasses: Number(maxClasses) || 0,
            theme: { primaryColor, secondaryColor },
        });

        // 2. Create School Admin User
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            name: `${name} Admin`,
            email,
            password: hashedPassword,
            role: 'SCHOOL_ADMIN',
            schoolId: school._id,
        });

        return NextResponse.json({ message: 'School created successfully', school });
    } catch (error: any) {
        console.error('Error creating school:', error);
        return NextResponse.json({
            error: 'Failed to create school',
            details: error.message
        }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const token = await getToken({ req: req as any });
        if (!token || token.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { id, name, email, phone, maxStudents, maxClasses, isActive, theme } = data;

        if (!id) {
            return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
        }

        await dbConnect();

        const school = await School.findByIdAndUpdate(
            id,
            {
                name,
                email,
                phone,
                maxStudents: Number(maxStudents),
                maxClasses: Number(maxClasses),
                isActive,
                theme
            },
            { new: true }
        );

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        // Update the school admin user email if it changed
        if (email) {
            await User.findOneAndUpdate({ schoolId: id, role: 'SCHOOL_ADMIN' }, { email });
        }

        return NextResponse.json({ message: 'School updated successfully', school });
    } catch (error: any) {
        console.error('Error updating school:', error);
        return NextResponse.json({
            error: 'Failed to update school',
            details: error.message
        }, { status: 500 });
    }
}
