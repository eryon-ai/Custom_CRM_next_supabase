// ============================================================
// API Response Helpers — Cache headers for performance
// ============================================================

import { NextResponse } from 'next/server';

// Cache list endpoints for 30s on CDN + 60s stale-while-revalidate
export function cachedResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

// No-cache for mutation responses
export function mutationResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
