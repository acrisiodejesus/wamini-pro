import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';

// GET /api/v1/reports/group - Relatórios comparativos de grupos ou filtro de grupo específico
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group_id');
    const orgId = context!.organizationId;

    const db = await getDb();

    let sql = `
      SELECT 
        g.id as group_id,
        g.name as group_name,
        g.district,
        g.locality,
        COUNT(DISTINCT f.id) as total_farmers,
        COUNT(DISTINCT fm.id) as total_farms,
        COALESCE(SUM(fm.total_area), 0) as total_area_ha,
        COALESCE(SUM(fm.cultivated_area), 0) as cultivated_area_ha,
        COALESCE(SUM(pr.estimated_production), 0) as estimated_production_kg,
        COALESCE(SUM(pr.harvested_quantity), 0) as harvested_production_kg,
        COALESCE(SUM(pr.loss_quantity), 0) as total_losses_kg
      FROM groups g
      LEFT JOIN farmers f ON f.group_id = g.id AND f.deleted_at IS NULL
      LEFT JOIN farms fm ON fm.farmer_id = f.id AND fm.deleted_at IS NULL
      LEFT JOIN production_records pr ON pr.farmer_id = f.id AND pr.deleted_at IS NULL
      WHERE g.organization_id = ? AND g.deleted_at IS NULL
    `;
    const args: any[] = [orgId];

    if (groupId) {
      sql += ` AND g.id = ?`;
      args.push(parseInt(groupId, 10));
    }

    // Se for group_manager, restringe aos atribuídos
    if (context!.role === 'group_manager' && context!.allowedGroupIds && context!.allowedGroupIds.length > 0) {
      const placeholders = context!.allowedGroupIds.map(() => '?').join(',');
      sql += ` AND g.id IN (${placeholders})`;
      args.push(...context!.allowedGroupIds);
    }

    sql += ` GROUP BY g.id, g.name, g.district, g.locality ORDER BY g.name ASC`;
    const result = await db.execute({ sql, args });

    const enriched = result.rows.map((row: any) => {
      const harvested = Number(row.harvested_production_kg || 0);
      const losses = Number(row.total_losses_kg || 0);
      const total = harvested + losses;
      const lossRate = total > 0 ? (losses / total) * 100 : 0;
      return {
        ...row,
        loss_rate_percentage: Math.round(lossRate * 10) / 10,
      };
    });

    return apiOk(enriched);
  } catch (err: any) {
    console.error('Group reports GET error:', err);
    return apiError(`Erro ao obter relatórios dos grupos: ${err.message}`, 500);
  }
}
