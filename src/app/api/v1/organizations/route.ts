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

    let sql = 'SELECT * FROM organizations WHERE deleted_at IS NULL';
    const args: any[] = [];

    // Se não for super_admin, apenas visualiza a sua própria organização
    if (!context!.isSuperAdmin) {
      sql += ' AND id = ?';
      args.push(context!.organizationId);
    }

    sql += ' ORDER BY name ASC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Organizations GET error:', err);
    return apiError(`Erro ao obter organizações: ${err.message}`, 500);
  }
}

// POST /api/v1/organizations - Criar organização (Apenas Super Admin ou Configuração Inicial)
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin']);
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

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'organizations',
      entity_id: orgId,
      new_data: { name, type, province, district },
    });

    return apiOk({ message: 'Organização criada com sucesso', organization_id: orgId }, 201);
  } catch (err: any) {
    console.error('Organizations POST error:', err);
    return apiError(`Erro ao criar organização: ${err.message}`, 500);
  }
}
