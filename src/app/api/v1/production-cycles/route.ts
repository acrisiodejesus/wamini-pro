import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

// GET /api/v1/production-cycles - Listar ciclos de produção
export async function GET(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context);
    if (authErr) return authErr;

    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT pc.*,
                   (SELECT COUNT(*) FROM production_records pr WHERE pr.cycle_id = pc.id AND pr.deleted_at IS NULL) as total_plantings,
                   (SELECT COALESCE(SUM(pr.planted_area_ha), 0) FROM production_records pr WHERE pr.cycle_id = pc.id AND pr.deleted_at IS NULL) as total_planted_area,
                   (SELECT COALESCE(SUM(pr.harvested_quantity), 0) FROM production_records pr WHERE pr.cycle_id = pc.id AND pr.deleted_at IS NULL) as total_harvested_kg
            FROM production_cycles pc
            WHERE pc.organization_id = ? AND pc.deleted_at IS NULL
            ORDER BY pc.start_date DESC`,
      args: [context!.organizationId],
    });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Cycles GET error:', err);
    return apiError(`Erro ao obter ciclos: ${err.message}`, 500);
  }
}

// POST /api/v1/production-cycles - Criar novo ciclo de produção
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin']);
    if (authErr) return authErr;

    const body = await req.json();
    const { client_uuid, name, start_date, end_date, season, status } = body;

    if (!name || !start_date || !end_date) {
      return apiError('Nome, data de início e data de fim são obrigatórios', 400);
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO production_cycles (client_uuid, organization_id, name, start_date, end_date, season, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        client_uuid || null,
        context!.organizationId,
        name,
        start_date,
        end_date,
        season || null,
        status || 'active',
      ],
    });

    const cycleId = Number(result.lastInsertRowid);

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'production_cycles',
      entity_id: cycleId,
      new_data: { name, start_date, end_date, season },
    });

    return apiOk({ message: 'Ciclo de produção criado com sucesso', cycle_id: cycleId }, 201);
  } catch (err: any) {
    console.error('Cycles POST error:', err);
    return apiError(`Erro ao criar ciclo: ${err.message}`, 500);
  }
}
