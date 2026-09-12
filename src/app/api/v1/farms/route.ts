import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/farms - Listar machambas
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmer_id');
    const groupId = searchParams.get('group_id');
    const search = searchParams.get('search') || '';

    const db = await getDb();

    let sql = `
      SELECT fm.*, 
             f.name as farmer_name, 
             f.phone as farmer_phone,
             g.name as group_name
      FROM farms fm
      INNER JOIN farmers f ON fm.farmer_id = f.id
      LEFT JOIN groups g ON f.group_id = g.id
      WHERE fm.organization_id = ? AND fm.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    if (farmerId) {
      sql += ` AND fm.farmer_id = ?`;
      args.push(parseInt(farmerId, 10));
    }

    if (groupId) {
      sql += ` AND f.group_id = ?`;
      args.push(parseInt(groupId, 10));
    }

    if (search) {
      sql += ` AND (fm.name LIKE ? OR fm.locality LIKE ? OR f.name LIKE ?)`;
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }

    sql += ' ORDER BY fm.created_at DESC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Farms GET error:', err);
    return apiError(`Erro ao obter machambas: ${err.message}`, 500);
  }
}

// POST /api/v1/farms - Registar nova machamba
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const {
      client_uuid,
      farmer_id,
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
    } = body;

    if (!farmer_id || !name || !province || !district) {
      return apiError('Produtor, nome da machamba, província e distrito são obrigatórios', 400);
    }

    const db = await getDb();

    // Validar se o produtor pertence à organização
    const farmerCheck = await db.execute({
      sql: `SELECT id FROM farmers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(farmer_id), context!.organizationId],
    });

    if (farmerCheck.rows.length === 0) {
      return apiError('Produtor inválido ou não pertencente a esta organização', 400);
    }

    const result = await db.execute({
      sql: `INSERT INTO farms (
        client_uuid, organization_id, farmer_id, name, location, province,
        district, locality, latitude, longitude, total_area, cultivated_area,
        soil_type, irrigation_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [
        client_uuid || null,
        context!.organizationId,
        Number(farmer_id),
        name,
        location || null,
        province,
        district,
        locality || null,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        total_area ? Number(total_area) : 0,
        cultivated_area ? Number(cultivated_area) : 0,
        soil_type || null,
        irrigation_type || null,
      ],
    });

    const farmId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'farms',
      entity_id: farmId,
      new_data: { name, farmer_id, total_area, cultivated_area },
    });

    return apiOk({ message: 'Machamba registada com sucesso', farm_id: farmId }, 201);
  } catch (err: any) {
    console.error('Farms POST error:', err);
    return apiError(`Erro ao registar machamba: ${err.message}`, 500);
  }
}
