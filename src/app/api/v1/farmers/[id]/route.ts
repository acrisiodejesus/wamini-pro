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
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) return apiError('ID inválido', 400);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT f.*, g.name as group_name
            FROM farmers f
            LEFT JOIN groups g ON f.group_id = g.id
            WHERE f.id = ? AND f.organization_id = ? AND f.deleted_at IS NULL`,
      args: [farmerId, context!.organizationId],
    });

    if (result.rows.length === 0) {
      return apiError('Produtor não encontrado', 404);
    }

    // Machambas do produtor
    const farms = await db.execute({
      sql: `SELECT * FROM farms WHERE farmer_id = ? AND organization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      args: [farmerId, context!.organizationId],
    });

    // Registos de produção do produtor
    const productions = await db.execute({
      sql: `SELECT pr.*, c.name as crop_name, c.category as crop_category, pc.name as cycle_name, fm.name as farm_name
            FROM production_records pr
            INNER JOIN crops c ON pr.crop_id = c.id
            INNER JOIN production_cycles pc ON pr.cycle_id = pc.id
            LEFT JOIN farms fm ON pr.farm_id = fm.id
            WHERE pr.farmer_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL
            ORDER BY pr.created_at DESC`,
      args: [farmerId, context!.organizationId],
    });

    // Insumos distribuídos ao produtor
    const inputs = await db.execute({
      sql: `SELECT idt.*, ii.name as input_name, ii.category as input_category, u.name as distributed_by_name
            FROM input_distributions idt
            INNER JOIN input_items ii ON idt.input_id = ii.id
            LEFT JOIN users u ON idt.distributed_by_user_id = u.id
            WHERE idt.farmer_id = ? AND idt.organization_id = ? AND idt.deleted_at IS NULL
            ORDER BY idt.distribution_date DESC`,
      args: [farmerId, context!.organizationId],
    });

    return apiOk({
      farmer: result.rows[0],
      farms: farms.rows,
      productions: productions.rows,
      inputs: inputs.rows,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter produtor: ${err.message}`, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const farmerId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const db = await getDb();

    const current = await db.execute({
      sql: 'SELECT * FROM farmers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      args: [farmerId, context!.organizationId],
    });

    if (current.rows.length === 0) {
      return apiError('Produtor não encontrado', 404);
    }

    const {
      group_id,
      name,
      gender,
      birth_date,
      phone,
      id_document,
      photo,
      province,
      district,
      administrative_post,
      locality,
      address,
      latitude,
      longitude,
      agricultural_experience_years,
      main_crops,
      estimated_total_area,
      status,
    } = body;

    await db.execute({
      sql: `UPDATE farmers SET
            group_id = COALESCE(?, group_id),
            name = COALESCE(?, name),
            gender = COALESCE(?, gender),
            birth_date = COALESCE(?, birth_date),
            phone = COALESCE(?, phone),
            id_document = COALESCE(?, id_document),
            photo = COALESCE(?, photo),
            province = COALESCE(?, province),
            district = COALESCE(?, district),
            administrative_post = COALESCE(?, administrative_post),
            locality = COALESCE(?, locality),
            address = COALESCE(?, address),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude),
            agricultural_experience_years = COALESCE(?, agricultural_experience_years),
            main_crops = COALESCE(?, main_crops),
            estimated_total_area = COALESCE(?, estimated_total_area),
            status = COALESCE(?, status),
            updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?`,
      args: [
        group_id ? Number(group_id) : null,
        name,
        gender,
        birth_date,
        phone,
        id_document,
        photo,
        province,
        district,
        administrative_post,
        locality,
        address,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        agricultural_experience_years ? Number(agricultural_experience_years) : null,
        main_crops,
        estimated_total_area ? Number(estimated_total_area) : null,
        status,
        farmerId,
        context!.organizationId,
      ],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'UPDATE',
      entity_type: 'farmers',
      entity_id: farmerId,
      old_data: current.rows[0],
      new_data: body,
    });

    return apiOk({ message: 'Produtor atualizado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao atualizar produtor: ${err.message}`, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const farmerId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager']);
    if (authErr) return authErr;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE farmers SET deleted_at = datetime('now'), status = 'inactive' WHERE id = ? AND organization_id = ?`,
      args: [farmerId, context!.organizationId],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'SOFT_DELETE',
      entity_type: 'farmers',
      entity_id: farmerId,
    });

    return apiOk({ message: 'Produtor arquivado com sucesso' });
  } catch (err: any) {
    return apiError(`Erro ao excluir produtor: ${err.message}`, 500);
  }
}
