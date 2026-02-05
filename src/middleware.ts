import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')
    const { pathname } = request.nextUrl

    // 1. Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Note: Role check is better done in Layout/Page or via Custom Claims verification
        // because decoding token in Edge middleware requires simplified libraries.
        // For now, we trust the session cookie existence for redirection.
    }

    // 2. Protect Portal Routes (Patients)
    if (pathname.startsWith('/portal')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
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
        '/admin/:path*',
        '/portal/:path*',
    ],
}
