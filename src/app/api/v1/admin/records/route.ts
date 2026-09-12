import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';
import { ensureAdmin } from '@/lib/admin';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin) return apiError('Acesso restrito: Administradores apenas', 403);

    const db = await getDb();
    
    // Unified query to fetch soft-deleted records across tables
    const result = await db.execute(`
      SELECT 'product' as type, id, name, deleted_at FROM products WHERE deleted_at IS NOT NULL
      UNION ALL
      SELECT 'input' as type, id, name, deleted_at FROM inputs WHERE deleted_at IS NOT NULL
      UNION ALL
      SELECT 'transport' as type, id, name, deleted_at FROM transports WHERE deleted_at IS NOT NULL
      UNION ALL
      SELECT 'negotiation' as type, id, ('Negociação #' || id) as name, deleted_at FROM negotiations WHERE deleted_at IS NOT NULL
      UNION ALL
      SELECT 'review' as type, id, ('Avaliação #' || id) as name, deleted_at FROM reviews WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Admin Records GET error:', err);
    return apiError('Erro interno ao carregar registos eliminados', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin) return apiError('Não autorizado', 403);

    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) return apiError('Tipo e ID são obrigatórios', 400);

    const validTables = ['products', 'inputs', 'transports', 'negotiations', 'reviews', 'messages', 'users'];
    const tableName = type.endsWith('s') ? type : `${type}s`; // Basic pluralization

    if (!validTables.includes(tableName)) return apiError('Tipo inválido', 400);

    const db = await getDb();
    
    // Fetch old state for audit
    const oldResult = await db.execute({ sql: `SELECT * FROM ${tableName} WHERE id = ?`, args: [Number(id)] });
    const oldRecord = oldResult.rows[0] as any;
    if (!oldRecord) return apiError('Registo não encontrado', 404);

    // RESTORE: Clear deleted_at
    await db.execute({
      sql: `UPDATE ${tableName} SET deleted_at = NULL, updated_at = datetime('now') WHERE id = ?`,
      args: [Number(id)],
    });

    // COMPLIANCE: Audit the restoration event
    await recordAuditLog(db, req, {
      actor_id: admin.id,
      action: 'UPDATE', // Special update: Restore
      entity_type: tableName,
      entity_id: Number(id),
      old_data: { context: 'RESTORE_FROM_SOFT_DELETE', deleted_at: oldRecord.deleted_at },
      new_data: { context: 'RESTORED_BY_ADMIN' }
    });

    return apiOk({ message: 'Registo restaurado com sucesso' });
  } catch (err: any) {
    console.error('Admin Restore POST error:', err);
    return apiError('Erro ao restaurar registo', 500);
  }
}
