import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT_COUNT = 21;
const RATE_LIMIT_WINDOW = 60 * 1000;
const rateLimitStore = new Map<string, { count: number, windowStart: number }>();


export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/chat')) {

    const internalToken = process.env.INTERNAL_API_TOKEN;
    const requestToken = request.headers.get('X-Internal-API-Token');

    if (!internalToken || requestToken !== internalToken) {
      console.warn('Middleware: Invalid or missing internal API token.');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    const clonedRequest = request.clone();
    let body;
    try {
        body = await clonedRequest.json();
    } catch (e) {
        return NextResponse.next();
    }
    
    if (body.modelAlias === 'NPT 1.5') {
      const record = rateLimitStore.get(ip);
      const now = Date.now();

      if (record && (now - record.windowStart < RATE_LIMIT_WINDOW)) {
        if (record.count >= RATE_LIMIT_COUNT) {
          console.warn(`Middleware: Rate limit exceeded for IP ${ip} on model NPT 1.5.`);
          const resetTime = record.windowStart + RATE_LIMIT_WINDOW;
          const remainingSeconds = Math.ceil((resetTime - now) / 1000);
          
          return new NextResponse(
            JSON.stringify({ 
              success: false, 
              message: 'Rate limit exceeded for this model.',
              retryAfter: remainingSeconds 
            }),
            { status: 429, headers: { 'content-type': 'application/json' } }
          );
        }
        rateLimitStore.set(ip, { ...record, count: record.count + 1 });
      } else {
        rateLimitStore.set(ip, { count: 1, windowStart: now });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/chat',
}