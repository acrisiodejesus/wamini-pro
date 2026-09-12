import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const farmerId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();

    // Validar produtor
    const farmerCheck = await db.execute({
      sql: `SELECT id, name, created_at FROM farmers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [farmerId, context!.organizationId],
    });

    if (farmerCheck.rows.length === 0) {
      return apiError('Produtor não encontrado', 404);
    }

    const farmer = farmerCheck.rows[0];
    const events: Array<{ type: string; title: string; description: string; date: string; meta?: any }> = [];

    // 1. Registo inicial do produtor
    events.push({
      type: 'registration',
      title: 'Registo do Produtor',
      description: `Produtor ${farmer.name} registado no sistema`,
      date: String(farmer.created_at),
    });

    // 2. Machambas cadastradas
    const farms = await db.execute({
      sql: `SELECT name, total_area, cultivated_area, created_at FROM farms WHERE farmer_id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [farmerId, context!.organizationId],
    });
    for (const row of farms.rows as any[]) {
      events.push({
        type: 'farm_created',
        title: `Registo de Machamba: ${row.name}`,
        description: `Área total: ${row.total_area}ha (Cultivada: ${row.cultivated_area}ha)`,
        date: String(row.created_at),
      });
    }

    // 3. Produções e Colheitas
    const productions = await db.execute({
      sql: `SELECT pr.*, c.name as crop_name, pc.name as cycle_name
            FROM production_records pr
            INNER JOIN crops c ON pr.crop_id = c.id
            INNER JOIN production_cycles pc ON pr.cycle_id = pc.id
            WHERE pr.farmer_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL`,
      args: [farmerId, context!.organizationId],
    });
    for (const row of productions.rows as any[]) {
      events.push({
        type: 'crop_planting',
        title: `Plantio: ${row.crop_name} (${row.cycle_name})`,
        description: `Área plantada: ${row.planted_area_ha}ha — Estimativa: ${row.estimated_production}kg`,
        date: String(row.planting_date || row.created_at),
      });

      if (row.current_stage === 'harvested' || Number(row.harvested_quantity) > 0) {
        events.push({
          type: 'harvest',
          title: `Colheita: ${row.crop_name}`,
          description: `Colhido: ${row.harvested_quantity}kg ${row.loss_quantity > 0 ? `(Perdas: ${row.loss_quantity}kg - ${row.loss_reason || 'N/A'})` : ''}`,
          date: String(row.updated_at || row.created_at),
        });
      }
    }

    // 4. Insumos recebidos
    const inputs = await db.execute({
      sql: `SELECT idt.*, ii.name as input_name
            FROM input_distributions idt
            INNER JOIN input_items ii ON idt.input_id = ii.id
            WHERE idt.farmer_id = ? AND idt.organization_id = ? AND idt.deleted_at IS NULL`,
      args: [farmerId, context!.organizationId],
    });
    for (const row of inputs.rows as any[]) {
      events.push({
        type: 'input_received',
        title: `Recebimento de Insumo: ${row.input_name}`,
        description: `Quantidade: ${row.quantity} ${row.unit} — Finalidade: ${row.purpose || 'Campanha agrícola'}`,
        date: String(row.distribution_date || row.created_at),
      });
    }

    // Ordenar timeline por data decrescente
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return apiOk({
      farmer_id: farmerId,
      farmer_name: farmer.name,
      timeline: events,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter timeline do produtor: ${err.message}`, 500);
  }
}
