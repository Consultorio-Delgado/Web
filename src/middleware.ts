import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')
    const { pathname } = request.nextUrl

    const redirectToLogin = () => {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        console.log(`[Middleware] Redirecting ${pathname} to ${loginUrl.pathname}${loginUrl.search} (No Session)`);
        return NextResponse.redirect(loginUrl);
    };

    // 1. Protect Doctor Routes
    if (pathname.startsWith('/doctor') || pathname.startsWith('/admin')) {
        if (!session) {
            return redirectToLogin();
        }
    }

    // 2. Protect Portal Routes (Patients)
    if (pathname.startsWith('/portal')) {
        if (!session) {
            return redirectToLogin();
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (public login page)
         * - / (landing page)
         */
        '/doctor/:path*',
        '/portal/:path*',
    ],
}
