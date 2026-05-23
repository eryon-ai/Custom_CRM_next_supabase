// ⚠️ PRODUCTION NOTE: In-memory Map resets on cold start & fails across
// multiple Vercel instances. Replace with Vercel KV or Upstash Redis for prod.
// Example: import { kv } from '@vercel/kv';
//   const count = await kv.incr(`rate:${identifier}`);
//   await kv.expire(`rate:${identifier}`, windowMs / 1000);

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs?: number;    // Time window in milliseconds (default: 60s)
  maxRequests?: number; // Max requests per window (default: 30)
  identifier?: string;  // Custom identifier (default: IP)
}

export function checkRateLimit(options: RateLimitOptions = {}): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const {
    windowMs = 60 * 1000,
    maxRequests = 30,
    identifier = 'global',
  } = options;

  const now = Date.now();
  const key = `rate:${identifier}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// Helper to extract client IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

// Middleware-style rate limit wrapper for API routes
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  options?: RateLimitOptions
) {
  return async (request: Request): Promise<Response> => {
    const ip = getClientIp(request);
    const { allowed, remaining, resetIn } = checkRateLimit({
      ...options,
      identifier: ip,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

    return response;
  };
}
