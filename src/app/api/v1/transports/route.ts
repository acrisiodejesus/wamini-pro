// GET /api/v1/transports
// POST /api/v1/transports
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    const db = await getDb();
    const result = await db.execute(
      `SELECT t.*, u.name as owner_name
       FROM transports t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.deleted_at IS NULL
       ORDER BY t.created_at DESC`
    );

    // COMPLIANCE: Audit read access
    await recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'transports_list',
      entity_id: null,
      new_data: { count: result.rows.length }
    });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Transports GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { transport_type, name, price_per_km, photo, location } = body;

    if (!transport_type || !name || price_per_km === undefined) {
      return apiError('Tipo, nome e preço/km são obrigatórios', 400);
    }

    const fallbackImages: Record<string, string> = {
      'camião': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
      camiao: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
      'pick-up': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400',
      moto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400',
      camioneta: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
      bicicleta: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400',
      default: 'https://images.unsplash.com/photo-1627522460108-215683bdc9ee?auto=format&fit=crop&q=80&w=400'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = transport_type.toLowerCase();
      const match = Object.keys(fallbackImages).find(key => lowerName.includes(key));
      finalPhoto = match ? fallbackImages[match] : fallbackImages['default'];
    }

    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;
    const result = await db.execute({
      sql: `INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [transport_type, name, price_per_km, finalPhoto, location ?? null, actorId],
    });

    const transportId = Number(result.lastInsertRowid);

    // COMPLIANCE: Audit creation
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'CREATE',
      entity_type: 'transports',
      entity_id: transportId,
      new_data: { name, transport_type, price_per_km }
    });

    return apiOk({ message: 'Transporte criado com sucesso', transport_id: transportId }, 201);
  } catch (err: any) {
    console.error('Transports POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
