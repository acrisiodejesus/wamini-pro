import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

// Limits: 30 requests per IP per 10 seconds (aggressive)
const limit = 30;
const rateLimitCache = new LRUCache<string, number>({
  max: 5000,          // Track up to 5000 unique IPs
  ttl: 10 * 1000,     // 10 seconds Time-To-Live
});

/**
 * Executes a basic rate limiter using the incoming request.
 * Throws 429 Error if IP breaches limits.
 */
export function checkRateLimit(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  
  const currentCount = rateLimitCache.get(ip) || 0;
  
  if (currentCount >= limit) {
    return Response.json(
      { error: '429 Too Many Requests. Rate limit exceeded. Try again later.' },
      { status: 429 }
    );
  }

  rateLimitCache.set(ip, currentCount + 1);
  return null; // OK
}
