import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    const result = await db.execute({
      sql: `SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry 
      FROM users 
      WHERE id = ? AND deleted_at IS NULL`,
      args: [actorId],
    });

    const user = result.rows[0];
    if (!user) return apiError('Utilizador não encontrado', 404);

    // COMPLIANCE: Audit read access to sensitive profile data
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'ACCESS',
      entity_type: 'users',
      entity_id: actorId,
      old_data: { context: 'Internal profile view' }
    });

    return apiOk(user);
  } catch (err: any) {
    console.error('Profile GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload?.userId) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, localization, photo, mobile_number, role } = body;
    const db = await getDb();
    const actorId = payload.userId;

    // Fetch old data for audit
    const oldResult = await db.execute({
      sql: 'SELECT name, localization, photo, mobile_number, role FROM users WHERE id = ? AND deleted_at IS NULL',
      args: [actorId],
    });
    const oldUser = oldResult.rows[0];
    if (!oldUser) return apiError('Utilizador não encontrado', 404);

    try {
      await db.execute({
        sql: `UPDATE users 
        SET name = COALESCE(?, name), 
            localization = COALESCE(?, localization), 
            photo = COALESCE(?, photo),
            mobile_number = COALESCE(?, mobile_number),
            role = COALESCE(?, role),
            updated_at = datetime('now')
        WHERE id = ?`,
        args: [name ?? null, localization ?? null, photo ?? null, mobile_number ?? null, role ?? null, actorId],
      });
    } catch (dbErr: any) {
      if (dbErr.message?.includes('UNIQUE constraint failed: users.mobile_number')) {
        return apiError('Este número de telefone já está a ser utilizado por outra conta', 409);
      }
      throw dbErr;
    }

    const updatedResult = await db.execute({
      sql: `SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry 
      FROM users 
      WHERE id = ?`,
      args: [actorId],
    });
    const updatedUser = updatedResult.rows[0];

    // COMPLIANCE: Audit update - fraud-proof record
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'UPDATE',
      entity_type: 'users',
      entity_id: actorId,
      old_data: oldUser,
      new_data: updatedUser
    });

    return apiOk(updatedUser);
  } catch (err: any) {
    console.error('Profile PUT error:', err);
    return apiError('Erro ao actualizar perfil', 500);
  }
}
