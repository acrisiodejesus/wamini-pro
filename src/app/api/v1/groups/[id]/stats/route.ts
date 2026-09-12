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
    const groupId = parseInt(id, 10);
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();

    // 1. Total de produtores
    const farmersRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM farmers WHERE group_id = ? AND organization_id = ? AND deleted_at IS NULL`,
      args: [groupId, context!.organizationId],
    });
    const totalFarmers = Number(farmersRes.rows[0]?.count ?? 0);

    // 2. Machambas e Área
    const farmsRes = await db.execute({
      sql: `SELECT COUNT(fm.id) as count, COALESCE(SUM(fm.total_area), 0) as total_area, COALESCE(SUM(fm.cultivated_area), 0) as cultivated_area
            FROM farms fm
            INNER JOIN farmers f ON fm.farmer_id = f.id
            WHERE f.group_id = ? AND fm.organization_id = ? AND fm.deleted_at IS NULL`,
      args: [groupId, context!.organizationId],
    });
    const totalFarms = Number(farmsRes.rows[0]?.count ?? 0);
    const totalArea = Number(farmsRes.rows[0]?.total_area ?? 0);
    const cultivatedArea = Number(farmsRes.rows[0]?.cultivated_area ?? 0);

    // 3. Produção estimada vs realizada e perdas
    const prodRes = await db.execute({
      sql: `SELECT 
              COALESCE(SUM(pr.estimated_production), 0) as estimated,
              COALESCE(SUM(pr.harvested_quantity), 0) as harvested,
              COALESCE(SUM(pr.loss_quantity), 0) as losses
            FROM production_records pr
            INNER JOIN farmers f ON pr.farmer_id = f.id
            WHERE f.group_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL`,
      args: [groupId, context!.organizationId],
    });
    const estimatedProduction = Number(prodRes.rows[0]?.estimated ?? 0);
    const harvestedProduction = Number(prodRes.rows[0]?.harvested ?? 0);
    const totalLosses = Number(prodRes.rows[0]?.losses ?? 0);

    // Taxa de perdas calculada
    const totalHarvestedAndLoss = harvestedProduction + totalLosses;
    const lossRatePercentage = totalHarvestedAndLoss > 0 ? (totalLosses / totalHarvestedAndLoss) * 100 : 0;

    // 4. Culturas ativas no grupo
    const cropsRes = await db.execute({
      sql: `SELECT DISTINCT c.name, c.category, COUNT(pr.id) as plantings_count
            FROM production_records pr
            INNER JOIN farmers f ON pr.farmer_id = f.id
            INNER JOIN crops c ON pr.crop_id = c.id
            WHERE f.group_id = ? AND pr.organization_id = ? AND pr.deleted_at IS NULL
            GROUP BY c.id, c.name, c.category`,
      args: [groupId, context!.organizationId],
    });

    return apiOk({
      total_farmers: totalFarmers,
      total_farms: totalFarms,
      total_area_ha: totalArea,
      cultivated_area_ha: cultivatedArea,
      estimated_production_kg: estimatedProduction,
      harvested_production_kg: harvestedProduction,
      total_losses_kg: totalLosses,
      loss_rate_percentage: Math.round(lossRatePercentage * 10) / 10,
      active_crops: cropsRes.rows,
    });
  } catch (err: any) {
    return apiError(`Erro ao obter indicadores do grupo: ${err.message}`, 500);
  }
}
