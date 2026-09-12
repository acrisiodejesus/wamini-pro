import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/production - Listar registos de produção agrícola
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get('cycle_id');
    const farmerId = searchParams.get('farmer_id');
    const cropId = searchParams.get('crop_id');
    const stage = searchParams.get('stage');

    const db = await getDb();

    let sql = `
      SELECT pr.*,
             c.name as crop_name,
             c.category as crop_category,
             c.default_unit as unit,
             f.name as farmer_name,
             f.phone as farmer_phone,
             g.name as group_name,
             fm.name as farm_name,
             pc.name as cycle_name
      FROM production_records pr
      INNER JOIN crops c ON pr.crop_id = c.id
      INNER JOIN farmers f ON pr.farmer_id = f.id
      LEFT JOIN groups g ON f.group_id = g.id
      LEFT JOIN farms fm ON pr.farm_id = fm.id
      LEFT JOIN production_cycles pc ON pr.cycle_id = pc.id
      WHERE pr.organization_id = ? AND pr.deleted_at IS NULL
    `;
    const args: any[] = [context!.organizationId];

    if (cycleId) {
      sql += ` AND pr.cycle_id = ?`;
      args.push(parseInt(cycleId, 10));
    }

    if (farmerId) {
      sql += ` AND pr.farmer_id = ?`;
      args.push(parseInt(farmerId, 10));
    }

    if (cropId) {
      sql += ` AND pr.crop_id = ?`;
      args.push(parseInt(cropId, 10));
    }

    if (stage) {
      sql += ` AND pr.current_stage = ?`;
      args.push(stage);
    }

    sql += ' ORDER BY pr.created_at DESC';
    const result = await db.execute({ sql, args });

    // Enriquecer registros com cálculos de produtividade e perdas
    const enriched = result.rows.map((row: any) => {
      const harvested = Number(row.harvested_quantity || 0);
      const losses = Number(row.loss_quantity || 0);
      const plantedArea = Number(row.planted_area_ha || 0);
      const estimated = Number(row.estimated_production || 0);

      const totalProduced = harvested + losses;
      const lossRate = totalProduced > 0 ? (losses / totalProduced) * 100 : 0;
      const productivityKgPerHa = plantedArea > 0 && harvested > 0 ? harvested / plantedArea : 0;
      const yieldVsEstimate = estimated > 0 && harvested > 0 ? (harvested / estimated) * 100 : 0;

      return {
        ...row,
        loss_rate_percentage: Math.round(lossRate * 10) / 10,
        productivity_kg_per_ha: Math.round(productivityKgPerHa * 10) / 10,
        yield_vs_estimate_percentage: Math.round(yieldVsEstimate * 10) / 10,
      };
    });

    return apiOk(enriched);
  } catch (err: any) {
    console.error('Production GET error:', err);
    return apiError(`Erro ao obter registos de produção: ${err.message}`, 500);
  }
}

// POST /api/v1/production - Registar cultivo, estimativa ou colheita
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const body = await req.json();
    const {
      client_uuid,
      cycle_id,
      farm_id,
      farmer_id,
      crop_id,
      planted_area_ha,
      planting_date,
      estimated_production,
      current_stage,
      harvested_quantity,
      loss_quantity,
      loss_reason,
      notes,
    } = body;

    if (!cycle_id || !farm_id || !farmer_id || !crop_id) {
      return apiError('Ciclo, machamba, produtor e cultura são obrigatórios', 400);
    }

    const validStages = ['planned', 'planted', 'growing', 'ready_for_harvest', 'harvested', 'completed'];
    const stage = current_stage || 'planted';
    if (!validStages.includes(stage)) {
      return apiError(`Estado inválido. Opções: ${validStages.join(', ')}`, 400);
    }

    const db = await getDb();

    // Validar produtor e machamba pertencentes à organização
    const validateFarmer = await db.execute({
      sql: `SELECT id FROM farmers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [Number(farmer_id), context!.organizationId],
    });
    if (validateFarmer.rows.length === 0) {
      return apiError('Produtor inválido para esta organização', 400);
    }

    const result = await db.execute({
      sql: `INSERT INTO production_records (
        client_uuid, organization_id, cycle_id, farm_id, farmer_id, crop_id,
        planted_area_ha, planting_date, estimated_production, current_stage,
        harvested_quantity, loss_quantity, loss_reason, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        client_uuid || null,
        context!.organizationId,
        Number(cycle_id),
        Number(farm_id),
        Number(farmer_id),
        Number(crop_id),
        planted_area_ha ? Number(planted_area_ha) : 0,
        planting_date || null,
        estimated_production ? Number(estimated_production) : 0,
        stage,
        harvested_quantity ? Number(harvested_quantity) : 0,
        loss_quantity ? Number(loss_quantity) : 0,
        loss_reason || null,
        notes || null,
      ],
    });

    const recordId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'production_records',
      entity_id: recordId,
      new_data: { farmer_id, crop_id, cycle_id, planted_area_ha, estimated_production, stage },
    });

    return apiOk({ message: 'Registo de produção criado com sucesso', production_id: recordId }, 201);
  } catch (err: any) {
    console.error('Production POST error:', err);
    return apiError(`Erro ao criar registo de produção: ${err.message}`, 500);
  }
}
