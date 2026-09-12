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
    const recordId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT pr.*,
                   c.name as crop_name,
                   c.category as crop_category,
                   c.default_unit as unit,
                   f.name as farmer_name,
                   f.phone as farmer_phone,
                   fm.name as farm_name,
                   pc.name as cycle_name
            FROM production_records pr
            INNER JOIN crops c ON pr.crop_id = c.id
            INNER JOIN farmers f ON pr.farmer_id = f.id
            LEFT JOIN farms fm ON pr.farm_id = fm.id
            LEFT JOIN production_cycles pc ON pr.cycle_id = pc.id
            WHERE pr.id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL`,
      args: [recordId, context!.organizationId],
    });

    if (result.rows.length === 0) {
      return apiError('Registo de produção não encontrado', 404);
    }

    const row = result.rows[0] as any;
    const harvested = Number(row.harvested_quantity || 0);
    const losses = Number(row.loss_quantity || 0);
    const plantedArea = Number(row.planted_area_ha || 0);
    const estimated = Number(row.estimated_production || 0);

    const totalProduced = harvested + losses;
    const lossRate = totalProduced > 0 ? (losses / totalProduced) * 100 : 0;
    const productivityKgPerHa = plantedArea > 0 && harvested > 0 ? harvested / plantedArea : 0;

    return apiOk({
      ...row,
      loss_rate_percentage: Math.round(lossRate * 10) / 10,
      productivity_kg_per_ha: Math.round(productivityKgPerHa * 10) / 10,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter registo de produção: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const db = await getDb();

    const current = await db.execute({
      sql: 'SELECT * FROM production_records WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [recordId, context!.organizationId],
    });

    if (current.rows.length === 0) {
      return apiError('Registo de produção não encontrado', 404);
    }

    const {
      planted_area_ha,
      planting_date,
      estimated_production,
      current_stage,
      harvested_quantity,
      loss_quantity,
      loss_reason,
      notes,
    } = body;

    await db.execute({
      sql: `UPDATE production_records SET
            planted_area_ha = COALESCE(?, planted_area_ha),
            planting_date = COALESCE(?, planting_date),
            estimated_production = COALESCE(?, estimated_production),
            current_stage = COALESCE(?, current_stage),
            harvested_quantity = COALESCE(?, harvested_quantity),
            loss_quantity = COALESCE(?, loss_quantity),
            loss_reason = COALESCE(?, loss_reason),
            notes = COALESCE(?, notes),
            updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?`,
      args: [
        planted_area_ha ? Number(planted_area_ha) : null,
        planting_date,
        estimated_production ? Number(estimated_production) : null,
        current_stage,
        harvested_quantity ? Number(harvested_quantity) : null,
        loss_quantity ? Number(loss_quantity) : null,
        loss_reason,
        notes,
        recordId,
        context!.organizationId,
      ],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'production_records',
      entity_id: recordId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Registo de produção atualizado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar registo de produção: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE production_records SET deleted_at = datetime('now') WHERE id = ? AND organization_id = ?`,
      args: [recordId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'production_records',
      entity_id: recordId,
    });

    return apiOk({ message: 'Registo de produção excluído com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao excluir registo de produção: ${err.message}`, 500);
  }
}
