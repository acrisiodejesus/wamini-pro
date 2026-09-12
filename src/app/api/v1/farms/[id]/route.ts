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
    const farmId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT fm.*, f.name as farmer_name, f.phone as farmer_phone, g.name as group_name
            FROM farms fm
            INNER JOIN farmers f ON fm.farmer_id = f.id
            LEFT JOIN groups g ON f.group_id = g.id
            WHERE fm.id = ? AND fm.organization_id = ? AND fm.deleted_at IS NULL`,
      args: [farmId, context!.organizationId],
    });

    if (result.rows.length === 0) {
      return apiError('Machamba não encontrada', 404);
    }

    // Cultivos ativos nesta machamba
    const crops = await db.execute({
      sql: `SELECT pr.*, c.name as crop_name, pc.name as cycle_name
            FROM production_records pr
            INNER JOIN crops c ON pr.crop_id = c.id
            INNER JOIN production_cycles pc ON pr.cycle_id = pc.id
            WHERE pr.farm_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL`,
      args: [farmId, context!.organizationId],
    });

    return apiOk({
      farm: result.rows[0],
      production_records: crops.rows,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter machamba: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const farmId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const db = await getDb();

    const current = await db.execute({
      sql: 'SELECT * FROM farms WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [farmId, context!.organizationId],
    });

    if (current.rows.length === 0) {
      return apiError('Machamba não encontrada', 404);
    }

    const {
      name,
      location,
      province,
      district,
      locality,
      latitude,
      longitude,
      total_area,
      cultivated_area,
      soil_type,
      irrigation_type,
      status,
    } = body;

    await db.execute({
      sql: `UPDATE farms SET
            name = COALESCE(?, name),
            location = COALESCE(?, location),
            province = COALESCE(?, province),
            district = COALESCE(?, district),
            locality = COALESCE(?, locality),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude),
            total_area = COALESCE(?, total_area),
            cultivated_area = COALESCE(?, cultivated_area),
            soil_type = COALESCE(?, soil_type),
            irrigation_type = COALESCE(?, irrigation_type),
            status = COALESCE(?, status),
            updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?`,
      args: [
        name,
        location,
        province,
        district,
        locality,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        total_area ? Number(total_area) : null,
        cultivated_area ? Number(cultivated_area) : null,
        soil_type,
        irrigation_type,
        status,
        farmId,
        context!.organizationId,
      ],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'farms',
      entity_id: farmId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Machamba atualizada com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar machamba: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const farmId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE farms SET deleted_at = datetime('now'), status = 'abandoned' WHERE id = ? AND organization_id = ?`,
      args: [farmId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'farms',
      entity_id: farmId,
    });

    return apiOk({ message: 'Machamba arquivada com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao arquivar machamba: ${err.message}`, 500);
  }
}
