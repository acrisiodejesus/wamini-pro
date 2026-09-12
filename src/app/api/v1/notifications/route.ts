import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload?.userId) return apiError('Utilizador não vinculado à base de dados local', 403);

    const db = await getDb();
    
    // Obter todas as mensagens não lidas enviadas para mim
    const result = await db.execute({
      sql: `SELECT m.id, m.negotiation_id, m.sender_id, m.body, m.timestamp, u.name as sender_name
      FROM messages m
      JOIN negotiations n ON m.negotiation_id = n.id
      JOIN users u ON m.sender_id = u.id
      WHERE (n.buyer_id = ? OR n.seller_id = ?)
        AND m.sender_id != ?
        AND m.is_read = 0
      ORDER BY m.timestamp DESC`,
      args: [payload.userId, payload.userId, payload.userId],
    });

    return apiOk({
      total: result.rows.length,
      notifications: result.rows 
    });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
