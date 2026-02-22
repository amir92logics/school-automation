import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordCorrect) {
                    throw new Error('Invalid email or password');
                }

                // Check if school is active for SCHOOL_ADMIN
                if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
                    const school = await prisma.school.findUnique({
                        where: { id: user.schoolId }
                    });
                    if (!school || !school.isActive) {
                        throw new Error('This school account is deactivated. Contact Support.');
                    }
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    schoolId: user.schoolId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.schoolId = (user as any).schoolId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).schoolId = token.schoolId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // Will be handled by role-specific login pages
    },
};
