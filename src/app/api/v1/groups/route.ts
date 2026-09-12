import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/groups - Listar grupos de produtores
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const db = await getDb();

    let sql = `
      SELECT g.*, 
             u.name as manager_name,
             (SELECT COUNT(*) FROM farmers f WHERE f.group_id = g.id AND f.deleted_at IS NULL) as total_farmers,
             (SELECT COUNT(DISTINCT fm.id) FROM farms fm 
                INNER JOIN farmers f ON fm.farmer_id = f.id 
                WHERE f.group_id = g.id AND fm.deleted_at IS NULL) as total_farms,
             (SELECT COALESCE(SUM(fm.cultivated_area), 0) FROM farms fm 
                INNER JOIN farmers f ON fm.farmer_id = f.id 
                WHERE f.group_id = g.id AND fm.deleted_at IS NULL) as total_cultivated_area
      FROM groups g
      LEFT JOIN users u ON g.manager_id = u.id
      WHERE g.organization_id = ? AND g.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    // Se for group_manager, restringe aos grupos atribuídos
    if (context!.role === 'group_manager' && context!.allowedGroupIds && context!.allowedGroupIds.length > 0) {
      const placeholders = context!.allowedGroupIds.map(() => '?').join(',');
      sql += ` AND g.id IN (${placeholders})`;
      args.push(...context!.allowedGroupIds);
    }

    if (search) {
      sql += ` AND (g.name LIKE ? OR g.district LIKE ? OR g.locality LIKE ?)`;
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }

    sql += ' ORDER BY g.name ASC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Groups GET error:', err);
    return apiError(`Erro ao obter grupos: ${err.message}`, 500);
  }
}

// POST /api/v1/groups - Criar grupo de produtores
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const body = await req.json();
    const { client_uuid, name, description, province, district, locality, latitude, longitude, manager_id } = body;

    if (!name || !province || !district) {
      return apiError('Nome, província e distrito são campos obrigatórios', 400);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO groups (client_uuid, organization_id, name, description, province, district, locality, latitude, longitude, manager_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [
        client_uuid || null,
        context!.organizationId,
        name,
        description || null,
        province,
        district,
        locality || null,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        manager_id ? Number(manager_id) : null,
      ],
    });

    const groupId = Number(result.lastInsertRowid);

    // Se um gestor foi atribuído, cria associação na tabela user_group_assignments
    if (manager_id) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO user_group_assignments (organization_id, user_id, group_id) VALUES (?, ?, ?)`,
        args: [context!.organizationId, Number(manager_id), groupId],
      });
    }

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'groups',
      entity_id: groupId,
      new_data: { name, province, district, organization_id: context!.organizationId },
    });

    return apiOk({ message: 'Grupo criado com sucesso', group_id: groupId }, 201);
  } catch (err: any) {
    console.error('Groups POST error:', err);
    return apiError(`Erro ao criar grupo: ${err.message}`, 500);
  }
}
