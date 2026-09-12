import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    const db = await getDb();
    const result = await db.execute('SELECT * FROM prices ORDER BY product ASC');

    // COMPLIANCE: Audit read access to market prices
    await recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'market_prices',
      entity_id: null,
      new_data: { productCount: result.rows.length }
    });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Prices GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
