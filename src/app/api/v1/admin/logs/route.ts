import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';
import { ensureAdmin } from '@/lib/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin) return apiError('Acesso restrito: Administradores apenas', 403);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const entityType = searchParams.get('entity_type');

    const db = await getDb();
    let sql = 'SELECT * FROM audit_logs';
    let args: any[] = [];

    if (entityType) {
      sql += ' WHERE entity_type = ?';
      args.push(entityType);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const logsResult = await db.execute({ sql, args });
    const totalResult = await db.execute('SELECT COUNT(*) as count FROM audit_logs');
    const total = Number((totalResult.rows[0] as any).count);

    return apiOk({ logs: logsResult.rows, total });
  } catch (err: any) {
    console.error('Admin Logs GET error:', err);
    return apiError('Erro interno ao carregar logs', 500);
  }
}
