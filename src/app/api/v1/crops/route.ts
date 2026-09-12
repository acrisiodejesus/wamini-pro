import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/crops - Listar culturas disponíveis (padrão global + personalizadas da org)
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const db = await getDb();

    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM production_records pr WHERE pr.crop_id = c.id AND pr.organization_id = ? AND pr.deleted_at IS NULL) as total_plantings,
             (SELECT COALESCE(SUM(pr.planted_area_ha), 0) FROM production_records pr WHERE pr.crop_id = c.id AND pr.organization_id = ? AND pr.deleted_at IS NULL) as total_planted_area,
             (SELECT COALESCE(SUM(pr.harvested_quantity), 0) FROM production_records pr WHERE pr.crop_id = c.id AND pr.organization_id = ? AND pr.deleted_at IS NULL) as total_harvested_kg
      FROM crops c
      WHERE (c.organization_id IS NULL OR c.organization_id = ?) AND c.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId, context!.organizationId, context!.organizationId, context!.organizationId];

    if (category) {
      sql += ` AND c.category = ?`;
      args.push(category);
    }

    sql += ' ORDER BY c.category ASC, c.name ASC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Crops GET error:', err);
    return apiError(`Erro ao obter culturas: ${err.message}`, 500);
  }
}

// POST /api/v1/crops - Registar cultura personalizada da organização
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const { name, category, default_unit, description } = body;

    if (!name || !category) {
      return apiError('Nome e categoria da cultura são obrigatórios', 400);
    }

    const validCategories = ['cereais', 'leguminosas', 'hortícolas', 'frutas', 'tubérculos', 'outras'];
    if (!validCategories.includes(category)) {
      return apiError(`Categoria inválida. Opções: ${validCategories.join(', ')}`, 400);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO crops (organization_id, name, category, default_unit, description)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        context!.organizationId,
        name,
        category,
        default_unit || 'kg',
        description || null,
      ],
    });

    const cropId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'crops',
      entity_id: cropId,
      new_data: { name, category, organization_id: context!.organizationId },
    });

    return apiOk({ message: 'Cultura registada com sucesso', crop_id: cropId }, 201);
  } catch (err: any) {
    console.error('Crops POST error:', err);
    return apiError(`Erro ao registar cultura: ${err.message}`, 500);
  }
}
