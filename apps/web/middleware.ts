import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from './lib/logging/logger'
import { monitoring } from './lib/monitoring/sentry'

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const reqId = crypto.randomUUID();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const pathname = request.nextUrl.pathname;

  logger.info({ reqId, method: request.method, url: pathname, ip, userAgent }, 'Incoming Request');

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    // Protect dashboard routes
    if (!user && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      supabaseResponse = NextResponse.redirect(url);
    }

    const duration = Date.now() - start;
    logger.info({
      reqId,
      method: request.method,
      url: pathname,
      status: supabaseResponse.status,
      duration
    }, 'Request Handled');

    return supabaseResponse;
  } catch (error) {
    monitoring.captureException(error, { reqId, method: request.method, url: pathname });
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}