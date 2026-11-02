/**
 * Next.js Middleware
 * Delegates session refresh to the Supabase middleware helper.
 */
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static, _next/image (Next.js internals)
         * - favicon.ico, sitemap.xml, robots.txt (meta files)
         * - public assets (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
