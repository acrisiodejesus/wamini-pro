import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/inputs/distributions - Listar distribuições de insumos
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmer_id');
    const inputId = searchParams.get('input_id');
    const cycleId = searchParams.get('cycle_id');

    const db = await getDb();

    let sql = `
      SELECT idt.*,
             ii.name as input_name,
             ii.category as input_category,
             f.name as farmer_name,
             f.phone as farmer_phone,
             g.name as group_name,
             pc.name as cycle_name,
             c.name as crop_name,
             u.name as distributed_by_name
      FROM input_distributions idt
      INNER JOIN input_items ii ON idt.input_id = ii.id
      INNER JOIN farmers f ON idt.farmer_id = f.id
      LEFT JOIN groups g ON f.group_id = g.id
      LEFT JOIN production_cycles pc ON idt.cycle_id = pc.id
      LEFT JOIN crops c ON idt.crop_id = c.id
      LEFT JOIN users u ON idt.distributed_by_user_id = u.id
      WHERE idt.organization_id = ? AND idt.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    if (farmerId) {
      sql += ` AND idt.farmer_id = ?`;
      args.push(parseInt(farmerId, 10));
    }

    if (inputId) {
      sql += ` AND idt.input_id = ?`;
      args.push(parseInt(inputId, 10));
    }

    if (cycleId) {
      sql += ` AND idt.cycle_id = ?`;
      args.push(parseInt(cycleId, 10));
    }

    sql += ' ORDER BY idt.distribution_date DESC';
    const result = await db.execute({ sql, args });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Input distribution GET error:', err);
    return apiError(`Erro ao obter distribuições: ${err.message}`, 500);
  }
}

// POST /api/v1/inputs/distributions - Registar distribuição de insumo a produtor
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const {
      client_uuid,
      input_id,
      inventory_id,
      farmer_id,
      cycle_id,
      crop_id,
      quantity,
      unit,
      distribution_date,
      purpose,
      notes,
    } = body;

    if (!input_id || !farmer_id || !quantity || Number(quantity) <= 0) {
      return apiError('Insumo, produtor e quantidade positiva são obrigatórios', 400);
    }

    const distQty = Number(quantity);
    const db = await getDb();

    // 1. Validar se o produtor pertence à organização
    const farmerCheck = await db.execute({
      sql: `SELECT id, name FROM farmers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(farmer_id), context!.organizationId],
    });
    if (farmerCheck.rows.length === 0) {
      return apiError('Produtor não pertence a esta organização', 400);
    }

    // 2. Validar item de insumo
    const itemCheck = await db.execute({
      sql: `SELECT id, name, unit FROM input_items WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(input_id), context!.organizationId],
    });
    if (itemCheck.rows.length === 0) {
      return apiError('Insumo não encontrado na organização', 400);
    }
    const item = itemCheck.rows[0] as any;
    const finalUnit = unit || item.unit || 'kg';

    // 3. Se foi selecionado um lote do inventário, verificar saldo e decrementar
    let chosenInventoryId = inventory_id ? Number(inventory_id) : null;
    if (chosenInventoryId) {
      const invCheck = await db.execute({
        sql: `SELECT id, quantity_available FROM input_inventory WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
        args: [chosenInventoryId, context!.organizationId],
      });
      if (invCheck.rows.length === 0) {
        return apiError('Lote de estoque não encontrado', 400);
      }
      const available = Number(invCheck.rows[0].quantity_available);
      if (available < distQty) {
        return apiError(`Estoque insuficiente no lote selecionado. Disponível: ${available} ${finalUnit}`, 400);
      }

      // Decrementar estoque disponível
      await db.execute({
        sql: `UPDATE input_inventory SET quantity_available = quantity_available - ? WHERE id = ?`,
        args: [distQty, chosenInventoryId],
      });
    }

    // 4. Inserir registo de distribuição
    const result = await db.execute({
      sql: `INSERT INTO input_distributions (
        client_uuid, organization_id, input_id, inventory_id, farmer_id,
        cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id,
        purpose, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?, ?, ?)`,
      args: [
        client_uuid || null,
        context!.organizationId,
        Number(input_id),
        chosenInventoryId,
        Number(farmer_id),
        cycle_id ? Number(cycle_id) : null,
        crop_id ? Number(crop_id) : null,
        distQty,
        finalUnit,
        distribution_date || null,
        context!.userId,
        purpose || null,
        notes || null,
      ],
    });

    const distId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'input_distributions',
      entity_id: distId,
      new_data: { farmer_id, input_id, quantity: distQty, unit: finalUnit },
    });

    return apiOk({ message: 'Insumo distribuído e registrado com sucesso', distribution_id: distId }, 201);
  } catch (err: any) {
    console.error('Input distribution POST error:', err);
    return apiError(`Erro ao registar distribuição: ${err.message}`, 500);
  }
}
