import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

const reviewSchema = z.object({
  target_id: z.number().int().positive("Invalid Target"),
  rating: z.number().min(1).max(5, "Rating must be 1-5"),
  comment: z.string().max(300, "Hard limit: Max 300 chars").optional()
});

export async function GET(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const payload = await getAuthPayload(req);
  const { searchParams } = new URL(req.url);
  const targetId = parseInt(searchParams.get('target_id') ?? '', 10);

  if (isNaN(targetId) || targetId <= 0) {
    return apiError('target_id query param is required and must be a positive integer', 400);
  }

  const db = await getDb();
  const actorId = (payload as any)?._testLocalId || (payload as any)?.userId || null;

  const reviewsResult = await db.execute({
    sql: `SELECT
      r.id,
      r.reviewer_id,
      u.name AS reviewer_name,
      r.target_id,
      r.negotiation_id,
      r.rating,
      r.comment,
      r.created_at
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.target_id = ? AND r.deleted_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT 50`,
    args: [targetId],
  });

  const aggResult = await db.execute({
    sql: `SELECT
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_count
    FROM reviews
    WHERE target_id = ? AND deleted_at IS NULL`,
    args: [targetId],
  });
  const agg = aggResult.rows[0] as any;

  // COMPLIANCE: Audit read access to user reputation
  await recordAuditLog(db, req, {
    actor_id: actorId,
    action: 'ACCESS',
    entity_type: 'reviews',
    entity_id: targetId,
    old_data: { context: 'User reputation and reviews view' },
    new_data: { count: reviewsResult.rows.length, rating: agg?.average_rating }
  });

  return apiOk({
    reviews: reviewsResult.rows,
    average_rating: agg?.average_rating ?? 0,
    total_count: Number(agg?.total_count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getAuthPayload(req);
  if (!user) return apiError("401 Unauthorized", 401);

  try {
    const db = await getDb();
    const actorId = (user as any)._testLocalId || (user as any).userId;

    // Map Auth0 Sub to internal reviewer_id if needed
    let reviewerId = actorId;
    if (!reviewerId && user.sub) {
      const dbResult = await db.execute({
        sql: 'SELECT id FROM users WHERE auth0_sub = ? AND deleted_at IS NULL',
        args: [user.sub],
      });
      const dbUser = dbResult.rows[0] as any;
      if (!dbUser) return apiError("401 Unauthorized - Unknown User", 401);
      reviewerId = Number(dbUser.id);
    }

    const rawBody = await req.json();
    const data = reviewSchema.parse(rawBody);

    // Dynamic import for DOMPurify to avoid build-time jsdom crash
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    const safeComment = data.comment ? DOMPurify.sanitize(data.comment) : null;

    if (reviewerId === data.target_id) {
      return apiError("403 Forbidden: Cannot review yourself", 403);
    }

    // Context Violation Check: Negotiation must be completed and NOT deleted
    const completedNegResult = await db.execute({
      sql: `SELECT id FROM negotiations 
      WHERE status = 'completed' AND deleted_at IS NULL AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      LIMIT 1`,
      args: [reviewerId, data.target_id, data.target_id, reviewerId],
    });

    if (completedNegResult.rows.length === 0) {
      return apiError("403 Forbidden: No completed negotiation found between these users", 403);
    }
    const completedNeg = completedNegResult.rows[0] as any;

    const result = await db.execute({
      sql: `INSERT INTO reviews (reviewer_id, target_id, negotiation_id, rating, comment) VALUES (?, ?, ?, ?, ?)`,
      args: [reviewerId, data.target_id, completedNeg.id, data.rating, safeComment],
    });

    const reviewId = Number(result.lastInsertRowid);

    // COMPLIANCE: Audit creation
    await recordAuditLog(db, req, {
      actor_id: reviewerId,
      action: 'CREATE',
      entity_type: 'reviews',
      entity_id: reviewId,
      new_data: { target_id: data.target_id, rating: data.rating }
    });

    return apiOk({ id: reviewId, comment: safeComment }, 201);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError("Validation Error: " + err.errors[0].message, 400);
    }
    if (err.message && err.message.includes('CHECK constraint failed')) {
      return apiError("400 Bad Request: Business constraint violated at storage layer", 400);
    }
    return apiError("Internal server error", 500);
  }
}
