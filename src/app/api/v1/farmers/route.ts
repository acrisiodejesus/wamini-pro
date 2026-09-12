import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/farmers - Listar produtores da organização
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group_id');
    const district = searchParams.get('district');
    const search = searchParams.get('search') || '';

    const db = await getDb();

    let sql = `
      SELECT f.*, 
             g.name as group_name,
             (SELECT COUNT(*) FROM farms fm WHERE fm.farmer_id = f.id AND fm.deleted_at IS NULL) as total_farms,
             (SELECT COALESCE(SUM(fm.cultivated_area), 0) FROM farms fm WHERE fm.farmer_id = f.id AND fm.deleted_at IS NULL) as active_cultivated_area
      FROM farmers f
      LEFT JOIN groups g ON f.group_id = g.id
      WHERE f.organization_id = ? AND f.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    // Se for group_manager, só vê os produtores dos seus grupos atribuídos
    if (context!.role === 'group_manager' && context!.allowedGroupIds && context!.allowedGroupIds.length > 0) {
      const placeholders = context!.allowedGroupIds.map(() => '?').join(',');
      sql += ` AND f.group_id IN (${placeholders})`;
      args.push(...context!.allowedGroupIds);
    } else if (groupId) {
      sql += ` AND f.group_id = ?`;
      args.push(parseInt(groupId, 10));
    }

    if (district) {
      sql += ` AND f.district = ?`;
      args.push(district);
    }

    if (search) {
      sql += ` AND (f.name LIKE ? OR f.phone LIKE ? OR f.locality LIKE ? OR f.main_crops LIKE ?)`;
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern, pattern);
    }

    sql += ' ORDER BY f.created_at DESC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Farmers GET error:', err);
    return apiError(`Erro ao obter produtores: ${err.message}`, 500);
  }
}

// POST /api/v1/farmers - Registar produtor
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const {
      client_uuid,
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
    } = body;

    if (!name || !group_id || !province || !district) {
      return apiError('Nome, grupo, província e distrito são obrigatórios', 400);
    }

    const db = await getDb();

    // Validar se o grupo pertence à organização do utilizador
    const groupCheck = await db.execute({
      sql: `SELECT id FROM groups WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(group_id), context!.organizationId],
    });

    if (groupCheck.rows.length === 0) {
      return apiError('Grupo inválido ou não pertencente a esta organização', 400);
    }

    // Se for group_manager, validar se tem atribuição a este grupo
    if (context!.role === 'group_manager' && context!.allowedGroupIds) {
      if (!context!.allowedGroupIds.includes(Number(group_id))) {
        return apiError('Você não tem permissão para adicionar produtores a este grupo', 403);
      }
    }

    const result = await db.execute({
      sql: `INSERT INTO farmers (
        client_uuid, organization_id, group_id, name, gender, birth_date,
        phone, id_document, photo, province, district, administrative_post,
        locality, address, latitude, longitude, agricultural_experience_years,
        main_crops, estimated_total_area, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [
        client_uuid || null,
        context!.organizationId,
        Number(group_id),
        name,
        gender || null,
        birth_date || null,
        phone || null,
        id_document || null,
        photo || null,
        province,
        district,
        administrative_post || null,
        locality || null,
        address || null,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        agricultural_experience_years ? Number(agricultural_experience_years) : 0,
        main_crops || null,
        estimated_total_area ? Number(estimated_total_area) : 0,
      ],
    });

    const farmerId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'farmers',
      entity_id: farmerId,
      new_data: { name, group_id, organization_id: context!.organizationId },
    });

    return apiOk({ message: 'Produtor registado com sucesso', farmer_id: farmerId }, 201);
  } catch (err: any) {
    console.error('Farmers POST error:', err);
    return apiError(`Erro ao registar produtor: ${err.message}`, 500);
  }
}
