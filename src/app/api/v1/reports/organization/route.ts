import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';

// GET /api/v1/reports/organization - Métricas globais da organização
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get('cycle_id');

    const db = await getDb();
    const orgId = context!.organizationId;

    // 1. Organização
    const orgRes = await db.execute({
      sql: `SELECT id, name, type, province, district FROM organizations WHERE id = ? AND deleted_at IS NULL`,
      args: [orgId],
    });

    // 2. Grupos
    const groupsRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM groups WHERE organization_id = ? AND deleted_at IS NULL`,
      args: [orgId],
    });

    // 3. Produtores (total e por género)
    const farmersRes = await db.execute({
      sql: `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) as male,
              SUM(CASE WHEN gender = 'F' THEN 1 ELSE 0 END) as female
            FROM farmers 
            WHERE organization_id = ? AND deleted_at IS NULL`,
      args: [orgId],
    });

    // 4. Machambas e Área
    const farmsRes = await db.execute({
      sql: `SELECT 
              COUNT(*) as total_farms,
              COALESCE(SUM(total_area), 0) as total_area,
              COALESCE(SUM(cultivated_area), 0) as total_cultivated_area
            FROM farms 
            WHERE organization_id = ? AND deleted_at IS NULL`,
      args: [orgId],
    });

    // 5. Produção: estimada, colhida, perdas
    let prodSql = `
      SELECT 
        COALESCE(SUM(pr.estimated_production), 0) as estimated,
        COALESCE(SUM(pr.harvested_quantity), 0) as harvested,
        COALESCE(SUM(pr.loss_quantity), 0) as losses,
        COALESCE(SUM(pr.planted_area_ha), 0) as total_planted_ha
      FROM production_records pr
      WHERE pr.organization_id = ? AND pr.deleted_at IS NULL
    `;
    const prodArgs: any[] = [orgId];
    if (cycleId) {
      prodSql += ` AND pr.cycle_id = ?`;
      prodArgs.push(parseInt(cycleId, 10));
    }
    const prodRes = await db.execute({ sql: prodSql, args: prodArgs });

    const estimated = Number(prodRes.rows[0]?.estimated ?? 0);
    const harvested = Number(prodRes.rows[0]?.harvested ?? 0);
    const losses = Number(prodRes.rows[0]?.losses ?? 0);
    const plantedHa = Number(prodRes.rows[0]?.total_planted_ha ?? 0);

    const totalProduced = harvested + losses;
    const lossRate = totalProduced > 0 ? (losses / totalProduced) * 100 : 0;
    const avgProductivity = plantedHa > 0 && harvested > 0 ? harvested / plantedHa : 0;

    // 6. Produção agregada por Cultura
    let cropProdSql = `
      SELECT 
        c.name as crop_name,
        c.category,
        COALESCE(SUM(pr.planted_area_ha), 0) as planted_ha,
        COALESCE(SUM(pr.estimated_production), 0) as estimated_kg,
        COALESCE(SUM(pr.harvested_quantity), 0) as harvested_kg,
        COALESCE(SUM(pr.loss_quantity), 0) as loss_kg
      FROM production_records pr
      INNER JOIN crops c ON pr.crop_id = c.id
      WHERE pr.organization_id = ? AND pr.deleted_at IS NULL
    `;
    const cropProdArgs: any[] = [orgId];
    if (cycleId) {
      cropProdSql += ` AND pr.cycle_id = ?`;
      cropProdArgs.push(parseInt(cycleId, 10));
    }
    cropProdSql += ` GROUP BY c.id, c.name, c.category ORDER BY harvested_kg DESC`;
    const cropProdRes = await db.execute({ sql: cropProdSql, args: cropProdArgs });

    // 7. Distribuição de Insumos (Total distribuído)
    const inputsRes = await db.execute({
      sql: `SELECT 
              COUNT(DISTINCT idt.farmer_id) as farmers_reached,
              COUNT(idt.id) as distributions_count,
              COALESCE(SUM(idt.quantity), 0) as total_quantity
            FROM input_distributions idt
            WHERE idt.organization_id = ? AND idt.deleted_at IS NULL`,
      args: [orgId],
    });

    return apiOk({
      organization: orgRes.rows[0],
      total_groups: Number(groupsRes.rows[0]?.count ?? 0),
      total_farmers: Number(farmersRes.rows[0]?.total ?? 0),
      farmers_gender: {
        male: Number(farmersRes.rows[0]?.male ?? 0),
        female: Number(farmersRes.rows[0]?.female ?? 0),
      },
      total_farms: Number(farmsRes.rows[0]?.total_farms ?? 0),
      total_area_ha: Number(farmsRes.rows[0]?.total_area ?? 0),
      total_cultivated_area_ha: Number(farmsRes.rows[0]?.total_cultivated_area ?? 0),
      production: {
        estimated_kg: estimated,
        harvested_kg: harvested,
        losses_kg: losses,
        loss_rate_percentage: Math.round(lossRate * 10) / 10,
        average_productivity_kg_ha: Math.round(avgProductivity * 10) / 10,
        planted_area_ha: plantedHa,
      },
      crops_summary: cropProdRes.rows,
      inputs_distribution: {
        farmers_reached: Number(inputsRes.rows[0]?.farmers_reached ?? 0),
        distributions_count: Number(inputsRes.rows[0]?.distributions_count ?? 0),
        total_quantity: Number(inputsRes.rows[0]?.total_quantity ?? 0),
      },
    });
  } catch (err: any) {
    console.error('Organization reports GET error:', err);
    return apiError(`Erro ao gerar relatório da organização: ${err.message}`, 500);
  }
}
