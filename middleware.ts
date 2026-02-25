import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    let session = null;
    if (sessionCookie) {
        try {
            session = await decrypt(sessionCookie);
        } catch {
            session = null;
        }
    }

    if (!session && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect logged in users away from login
    if (session && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
