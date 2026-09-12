import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/inputs/inventory - Listar lotes e estoque de insumos
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const inputId = searchParams.get('input_id');

    const db = await getDb();

    let sql = `
      SELECT inv.*,
             ii.name as input_name,
             ii.category as input_category,
             ii.unit as input_unit
      FROM input_inventory inv
      INNER JOIN input_items ii ON inv.input_id = ii.id
      WHERE inv.organization_id = ? AND inv.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    if (inputId) {
      sql += ` AND inv.input_id = ?`;
      args.push(parseInt(inputId, 10));
    }

    sql += ' ORDER BY inv.received_date DESC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Input inventory GET error:', err);
    return apiError(`Erro ao obter inventário: ${err.message}`, 500);
  }
}

// POST /api/v1/inputs/inventory - Entrada de estoque de insumos (novo lote)
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager']);
    if (authErr) return authErr;

    const body = await req.json();
    const { input_id, batch_number, quantity_received, unit_cost, supplier, received_date, notes } = body;

    if (!input_id || quantity_received === undefined || Number(quantity_received) <= 0) {
      return apiError('Item de insumo e quantidade recebida maior que zero são obrigatórios', 400);
    }

    const db = await getDb();

    // Validar item na organização
    const itemCheck = await db.execute({
      sql: `SELECT id FROM input_items WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(input_id), context!.organizationId],
    });

    if (itemCheck.rows.length === 0) {
      return apiError('Item de insumo não encontrado nesta organização', 400);
    }

    const qty = Number(quantity_received);

    const result = await db.execute({
      sql: `INSERT INTO input_inventory (
        organization_id, input_id, batch_number, quantity_received,
        quantity_available, unit_cost, supplier, received_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?)`,
      args: [
        context!.organizationId,
        Number(input_id),
        batch_number || null,
        qty,
        qty, // saldo inicial disponível igual ao recebido
        unit_cost ? Number(unit_cost) : 0,
        supplier || null,
        received_date || null,
        notes || null,
      ],
    });

    const inventoryId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'input_inventory',
      entity_id: inventoryId,
      new_data: { input_id, batch_number, quantity_received: qty, supplier },
    });

    return apiOk({ message: 'Entrada de estoque registada com sucesso', inventory_id: inventoryId }, 201);
  } catch (err: any) {
    console.error('Input inventory POST error:', err);
    return apiError(`Erro ao dar entrada de estoque: ${err.message}`, 500);
  }
}
