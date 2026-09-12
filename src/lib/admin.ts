import { NextRequest } from 'next/server';
import { getDb } from './db';
import { getAuthPayload } from './auth';

export interface AdminSession {
  id: number;
  name: string;
  role: string;
}

/**
 * Server-side utility to enforce admin-only access.
 * Validates the session and then checks the database for the 'admin' role.
 * This prevents the user from spoofing roles in the JWT/Session client-side.
 */
export async function ensureAdmin(req?: NextRequest): Promise<AdminSession | null> {
  const payload = await getAuthPayload(req);
  if (!payload) return null;

  const db = await getDb();
  
  // Use _testLocalId for mocks or userId for real Auth0 sessions
  const actorId = (payload as any)._testLocalId || (payload as any).userId;
  
  if (!actorId) return null;

  const result = await db.execute({
    sql: `SELECT id, name, role FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [actorId],
  });

  const user = result.rows[0] as any;

  if (!user || user.role !== 'admin') {
    return null;
  }

  return { id: Number(user.id), name: user.name, role: user.role };
}
