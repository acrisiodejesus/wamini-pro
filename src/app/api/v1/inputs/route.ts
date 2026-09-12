// GET /api/v1/inputs
// POST /api/v1/inputs
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    const db = await getDb();
    const result = await db.execute(
      `SELECT i.*, u.name as seller_name
       FROM inputs i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.deleted_at IS NULL
       ORDER BY i.created_at DESC`
    );

    // COMPLIANCE: Audit read access
    await recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'inputs_list',
      entity_id: null,
      new_data: { count: result.rows.length }
    });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Inputs GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, quantity, price, photo } = body;

    if (!name || price === undefined) {
      return apiError('Nome e preço são obrigatórios', 400);
    }

    const fallbackImages: Record<string, string> = {
      fertilizante: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=400',
      semente: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400',
      pesticida: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&q=80&w=400',
      composto: 'https://images.unsplash.com/photo-1585513692055-8fe3beea5b3f?auto=format&fit=crop&q=80&w=400',
      default: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = name.toLowerCase();
      const match = Object.keys(fallbackImages).find(key => lowerName.includes(key));
      finalPhoto = match ? fallbackImages[match] : fallbackImages['default'];
    }

    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;
    const result = await db.execute({
      sql: `INSERT INTO inputs (name, quantity, price, photo, user_id) VALUES (?, ?, ?, ?, ?)`,
      args: [name, quantity ?? 0, price, finalPhoto, actorId],
    });

    const inputId = Number(result.lastInsertRowid);

    // COMPLIANCE: Audit creation
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'CREATE',
      entity_type: 'inputs',
      entity_id: inputId,
      new_data: { name, quantity, price }
    });

    return apiOk({ message: 'Insumo criado com sucesso', input_id: inputId }, 201);
  } catch (err: any) {
    console.error('Inputs POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
