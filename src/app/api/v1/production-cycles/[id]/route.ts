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
    const cycleId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM production_cycles WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [cycleId, context!.organizationId],
    });

    if (result.rows.length === 0) {
      return apiError('Ciclo de produção não encontrado', 404);
    }

    // Registos deste ciclo
    const records = await db.execute({
      sql: `SELECT pr.*, c.name as crop_name, f.name as farmer_name, fm.name as farm_name
            FROM production_records pr
            INNER JOIN crops c ON pr.crop_id = c.id
            INNER JOIN farmers f ON pr.farmer_id = f.id
            LEFT JOIN farms fm ON pr.farm_id = fm.id
            WHERE pr.cycle_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL
            ORDER BY pr.planting_date DESC`,
      args: [cycleId, context!.organizationId],
    });

    return apiOk({
      cycle: result.rows[0],
      records: records.rows,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter ciclo: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cycleId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const body = await req.json();
    const db = await getDb();

    const current = await db.execute({
      sql: 'SELECT * FROM production_cycles WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [cycleId, context!.organizationId],
    });

    if (current.rows.length === 0) {
      return apiError('Ciclo de produção não encontrado', 404);
    }

    const { name, start_date, end_date, season, status } = body;

    await db.execute({
      sql: `UPDATE production_cycles SET
            name = COALESCE(?, name),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            season = COALESCE(?, season),
            status = COALESCE(?, status),
            updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?`,
      args: [name, start_date, end_date, season, status, cycleId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'production_cycles',
      entity_id: cycleId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Ciclo atualizado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar ciclo: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cycleId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE production_cycles SET deleted_at = datetime('now'), status = 'archived' WHERE id = ? AND organization_id = ?`,
      args: [cycleId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'production_cycles',
      entity_id: cycleId,
    });

    return apiOk({ message: 'Ciclo arquivado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao arquivar ciclo: ${err.message}`, 500);
  }
}
