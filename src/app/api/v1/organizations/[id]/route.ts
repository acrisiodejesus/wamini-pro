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
    const orgId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    // Apenas Super Admin ou membro da própria organização
    if (!context!.isSuperAdmin && context!.organizationId !== orgId) {
      return apiError('Acesso não autorizado a esta organização', 403);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ? AND deleted_at IS NULL',
      args: [orgId],
    });

    if (result.rows.length === 0) {
      return apiError('Organização não encontrada', 404);
    }

    return apiOk(result.rows[0]);
  } catch (err: any) {
    return apiError(`Erro ao obter organização: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const orgId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    if (!context!.isSuperAdmin && context!.organizationId !== orgId) {
      return apiError('Acesso não autorizado a esta organização', 403);
    }

    const body = await req.json();
    const { name, description, type, province, district, address, phone, email, logo, status } = body;

    const db = await getDb();
    const current = await db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ? AND deleted_at IS NULL',
      args: [orgId],
    });

    if (current.rows.length === 0) {
      return apiError('Organização não encontrada', 404);
    }

    await db.execute({
      sql: `UPDATE organizations SET 
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            type = COALESCE(?, type),
            province = COALESCE(?, province),
            district = COALESCE(?, district),
            address = COALESCE(?, address),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            logo = COALESCE(?, logo),
            status = COALESCE(?, status),
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [name, description, type, province, district, address, phone, email, logo, status, orgId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'organizations',
      entity_id: orgId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Organização atualizada com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar organização: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const orgId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE organizations SET deleted_at = datetime('now'), status = 'inactive' WHERE id = ?`,
      args: [orgId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'organizations',
      entity_id: orgId,
    });

    return apiOk({ message: 'Organização desativada com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao excluir organização: ${err.message}`, 500);
  }
}
