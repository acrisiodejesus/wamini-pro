import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/organizations - Listar organizações
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();

    let sql: string;
    let args: any[] = [];

    // Se for super_admin, visualiza todas as organizações
    if (context!.isSuperAdmin) {
      sql = 'SELECT * FROM organizations WHERE deleted_at IS NULL ORDER BY name ASC';
    } else {
      // Retorna as organizações a que o utilizador pertence
      sql = `SELECT DISTINCT o.* FROM organizations o
             LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.user_id = ? AND ou.deleted_at IS NULL
             WHERE o.deleted_at IS NULL
               AND (o.id = ? OR ou.organization_id = o.id)
             ORDER BY o.name ASC`;
      args = [context!.userId, context!.organizationId];
    }

    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Organizations GET error:', err);
    return apiError(`Erro ao obter organizações: ${err.message}`, 500);
  }
}

// POST /api/v1/organizations - Criar organização (Qualquer utilizador autenticado)
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const body = await req.json();
    const { name, description, type, province, district, address, phone, email, logo } = body;

    if (!name || !type || !province || !district) {
      return apiError('Nome, tipo, província e distrito são obrigatórios', 400);
    }

    const validTypes = ['cooperative', 'association', 'ngo', 'agricultural_company', 'development_project', 'government_program'];
    if (!validTypes.includes(type)) {
      return apiError(`Tipo inválido. Opções: ${validTypes.join(', ')}`, 400);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO organizations (name, description, type, province, district, address, phone, email, logo, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [name, description || null, type, province, district, address || null, phone || null, email || null, logo || null],
    });

    const orgId = Number(result.lastInsertRowid);

    // Associar o criador como administrador da organização (org_admin)
    await db.execute({
      sql: `INSERT INTO organization_users (organization_id, user_id, role)
            VALUES (?, ?, 'org_admin')
            ON CONFLICT(organization_id, user_id) DO UPDATE SET role = 'org_admin'`,
      args: [orgId, context!.userId],
    });

    // Definir esta organização como a organização ativa do utilizador
    await db.execute({
      sql: `UPDATE users SET organization_id = ? WHERE id = ?`,
      args: [orgId, context!.userId],
    });

    // Criar núcleo/grupo inicial padrão para a organização
    await db.execute({
      sql: `INSERT INTO groups (organization_id, name, description, province, district, locality, status)
            VALUES (?, ?, 'Núcleo principal da organização', ?, ?, 'Sede', 'active')`,
      args: [orgId, `Núcleo Sede (${name})`, province, district],
    });

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'organizations',
      entity_id: orgId,
      new_data: { name, type, province, district },
    });

    const created = await db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ?',
      args: [orgId],
    });

    return apiOk(
      {
        message: 'Organização criada com sucesso',
        organization_id: orgId,
        organization: created.rows[0],
      },
      201
    );
  } catch (err: any) {
    console.error('Organizations POST error:', err);
    return apiError(`Erro ao criar organização: ${err.message}`, 500);
  }
}
