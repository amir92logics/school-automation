import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        console.warn('MIDDLEWARE WARNING: NEXTAUTH_SECRET is not set. Session detection may fail.');
    }

    const token = await getToken({ req, secret });
    const { pathname } = req.nextUrl;

    // Protect super-admin routes
    if (pathname.startsWith('/super-admin')) {
        if (pathname === '/super-admin/login') return NextResponse.next();
        if (!token || token.role !== 'SUPER_ADMIN') {
            console.log(`MIDDLEWARE: Redirecting to super-admin login. Path: ${pathname}, Token: ${!!token}, Role: ${token?.role}`);
            return NextResponse.redirect(new URL('/super-admin/login', req.url));
        }
    }

    // Protect school routes
    if (pathname.startsWith('/school')) {
        if (pathname === '/school/login') return NextResponse.next();
        if (!token || token.role !== 'SCHOOL_ADMIN') {
            return NextResponse.redirect(new URL('/school/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/super-admin/:path*', '/school/:path*'],
};
