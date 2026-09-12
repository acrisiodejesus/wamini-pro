import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/inputs/catalog - Listar itens do catálogo de insumos da organização
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const db = await getDb();

    let sql = `
      SELECT ii.*,
             (SELECT COALESCE(SUM(inv.quantity_available), 0) FROM input_inventory inv WHERE inv.input_id = ii.id AND inv.deleted_at IS NULL) as total_stock_available,
             (SELECT COALESCE(SUM(dist.quantity), 0) FROM input_distributions dist WHERE dist.input_id = ii.id AND dist.deleted_at IS NULL) as total_distributed
      FROM input_items ii
      WHERE ii.organization_id = ? AND ii.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    if (category) {
      sql += ` AND ii.category = ?`;
      args.push(category);
    }

    sql += ' ORDER BY ii.category ASC, ii.name ASC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Input catalog GET error:', err);
    return apiError(`Erro ao obter catálogo de insumos: ${err.message}`, 500);
  }
}

// POST /api/v1/inputs/catalog - Registar item no catálogo de insumos
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const body = await req.json();
    const { name, category, unit, description } = body;

    if (!name || !category || !unit) {
      return apiError('Nome, categoria e unidade padrão são obrigatórios', 400);
    }

    const validCategories = ['sementes', 'fertilizantes', 'pesticidas', 'ferramentas', 'equipamentos', 'outros'];
    if (!validCategories.includes(category)) {
      return apiError(`Categoria inválida. Opções: ${validCategories.join(', ')}`, 400);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO input_items (organization_id, name, category, unit, description)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        context!.organizationId,
        name,
        category,
        unit,
        description || null,
      ],
    });

    const itemId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'input_items',
      entity_id: itemId,
      new_data: { name, category, unit, organization_id: context!.organizationId },
    });

    return apiOk({ message: 'Insumo adicionado ao catálogo com sucesso', input_id: itemId }, 201);
  } catch (err: any) {
    console.error('Input catalog POST error:', err);
    return apiError(`Erro ao registar insumo no catálogo: ${err.message}`, 500);
  }
}
