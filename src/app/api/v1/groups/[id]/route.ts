import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT g.*, u.name as manager_name 
            FROM groups g 
            LEFT JOIN users u ON g.manager_id = u.id 
            WHERE g.id = ? AND g.organization_id = ? AND g.deleted_at IS NULL`,
      args: [groupId, context!.organizationId],
    });

    if (result.rows.length === 0) {
      return apiError('Grupo não encontrado na sua organização', 404);
    }

    // Obter membros/produtores do grupo
    const members = await db.execute({
      sql: `SELECT id, name, gender, phone, district, locality, main_crops, estimated_total_area, status 
            FROM farmers 
            WHERE group_id = ? AND organization_id = ? AND deleted_at IS NULL
            ORDER BY name ASC`,
      args: [groupId, context!.organizationId],
    });

    return apiOk({
      group: result.rows[0],
      farmers: members.rows,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter grupo: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager']);
    if (authErr) return authErr;

    const body = await req.json();
    const { name, description, province, district, locality, latitude, longitude, manager_id, status } = body;

    const db = await getDb();
    const current = await db.execute({
      sql: 'SELECT * FROM groups WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [groupId, context!.organizationId],
    });

    if (current.rows.length === 0) {
      return apiError('Grupo não encontrado', 404);
    }

    await db.execute({
      sql: `UPDATE groups SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            province = COALESCE(?, province),
            district = COALESCE(?, district),
            locality = COALESCE(?, locality),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude),
            manager_id = COALESCE(?, manager_id),
            status = COALESCE(?, status),
            updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?`,
      args: [name, description, province, district, locality, latitude, longitude, manager_id, status, groupId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'groups',
      entity_id: groupId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Grupo atualizado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar grupo: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE groups SET deleted_at = datetime('now'), status = 'archived' WHERE id = ? AND organization_id = ?`,
      args: [groupId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'groups',
      entity_id: groupId,
    });

    return apiOk({ message: 'Grupo arquivado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao arquivar grupo: ${err.message}`, 500);
  }
}
