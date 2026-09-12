// GET /api/v1/negotiations/[id]/messages
// POST /api/v1/negotiations/[id]/messages
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Verificar acesso e se a negociação não foi "apagada"
    const negResult = await db.execute({
      sql: 'SELECT id FROM negotiations WHERE id = ? AND (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL',
      args: [Number(id), actorId, actorId],
    });
    if (negResult.rows.length === 0) return apiError('Negociação não encontrada', 404);

    // Marcar como lida as mensagens enviadas por outros para nós
    await db.execute({
      sql: `UPDATE messages SET is_read = 1 
      WHERE negotiation_id = ? AND sender_id != ? AND is_read = 0 AND deleted_at IS NULL`,
      args: [Number(id), actorId],
    });

    const messagesResult = await db.execute({
      sql: `SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.negotiation_id = ? AND m.deleted_at IS NULL
      ORDER BY m.timestamp ASC`,
      args: [Number(id)],
    });

    // COMPLIANCE: Audit chat history access
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'ACCESS',
      entity_type: 'messages',
      entity_id: Number(id),
      old_data: { context: 'Negotiation messages list' },
      new_data: { messageCount: messagesResult.rows.length }
    });

    return apiOk(messagesResult.rows);
  } catch (err: any) {
    console.error('Messages GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const bodyText = await req.json();
    const { body: msgBody, attachment_url, attachment_type } = bodyText;

    if ((!msgBody || !msgBody.trim()) && !attachment_url) {
      return apiError('Mensagem não pode estar vazia sem anexos', 400);
    }

    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Verificar acesso
    const negResult = await db.execute({
      sql: 'SELECT id FROM negotiations WHERE id = ? AND (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL',
      args: [Number(id), actorId, actorId],
    });
    if (negResult.rows.length === 0) return apiError('Negociação não encontrada', 404);

    const result = await db.execute({
      sql: `INSERT INTO messages (negotiation_id, sender_id, body, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)`,
      args: [
        Number(id), 
        actorId, 
        msgBody ? msgBody.trim() : null,
        attachment_url || null,
        attachment_type || null,
      ],
    });

    const msgResult = await db.execute({
      sql: `SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      args: [Number(result.lastInsertRowid)],
    });
    const message = msgResult.rows[0];

    // COMPLIANCE: Audit message creation
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'CREATE',
      entity_type: 'messages',
      entity_id: Number(result.lastInsertRowid),
      new_data: { negotiation_id: id, body_length: msgBody?.length }
    });

    return apiOk({ message: 'Mensagem enviada', data: message }, 201);
  } catch (err: any) {
    console.error('Messages POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
