import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const token = await getToken({ req: req as any });
    if (!token || token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' }
    });
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

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered as a user' }, { status: 400 });
        }

        // 1. Create School and Admin User in a transaction
        const hashedPassword = await bcrypt.hash(password, 10);

        const school = await prisma.school.create({
            data: {
                name,
                email,
                phone,
                maxStudents: Number(maxStudents) || 0,
                maxClasses: Number(maxClasses) || 0,
                primaryColor: primaryColor || "#3b82f6",
                secondaryColor: secondaryColor || "#1e40af",
                users: {
                    create: {
                        name: `${name} Admin`,
                        email,
                        password: hashedPassword,
                        role: 'SCHOOL_ADMIN',
                    }
                }
            },
            include: {
                users: true
            }
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
        const { id, name, email, phone, maxStudents, maxClasses, isActive, primaryColor, secondaryColor } = data;

        if (!id) {
            return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
        }

        const school = await prisma.school.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                maxStudents: Number(maxStudents),
                maxClasses: Number(maxClasses),
                isActive,
                primaryColor,
                secondaryColor,
            }
        });

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        // Update the school admin user email if it changed
        if (email) {
            await prisma.user.updateMany({
                where: { schoolId: id, role: 'SCHOOL_ADMIN' },
                data: { email }
            });
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
