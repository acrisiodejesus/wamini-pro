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
    const { id } = await params;
    const db = await getDb();

    const result = await db.execute({
      sql: `SELECT p.*, u.name as seller_name
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL`,
      args: [Number(id)],
    });

    const product = result.rows[0];
    if (!product) return apiError('Produto não encontrado ou removido', 404);

    // COMPLIANCE: Audit read access
    await recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: { context: 'Individual product view' }
    });

    return apiOk(product);
  } catch (err: any) {
    console.error('Product GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Fetch previous state for audit log
    const oldResult = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      args: [Number(id)],
    });
    const oldProduct = oldResult.rows[0] as any;
    if (!oldProduct) return apiError('Produto não encontrado', 404);
    if (Number(oldProduct.user_id) !== actorId) return apiError('Sem permissão para editar', 403);

    const body = await req.json();
    const { name, quantity, price, location, category } = body;

    await db.execute({
      sql: `UPDATE products 
      SET name = COALESCE(?, name),
          quantity = COALESCE(?, quantity),
          price = COALESCE(?, price),
          location = COALESCE(?, location),
          category = COALESCE(?, category),
          updated_at = datetime('now')
      WHERE id = ?`,
      args: [name ?? null, quantity ?? null, price ?? null, location ?? null, category ?? null, Number(id)],
    });

    const newResult = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [Number(id)] });
    const newProduct = newResult.rows[0];

    // COMPLIANCE: Audit update - fraud-proof record of what changed
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'UPDATE',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: oldProduct,
      new_data: newProduct
    });

    return apiOk({ message: 'Produto atualizado com sucesso', product: newProduct });
  } catch (err: any) {
    console.error('Product PUT error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Só o dono pode apagar
    const result = await db.execute({
      sql: 'SELECT user_id, name FROM products WHERE id = ? AND deleted_at IS NULL',
      args: [Number(id)],
    });
    const product = result.rows[0] as any;
    if (!product) return apiError('Produto não encontrado', 404);
    if (Number(product.user_id) !== actorId) return apiError('Sem permissão', 403);

    // SOFT DELETE: Mark as deleted but keep the record
    await db.execute({
      sql: "UPDATE products SET deleted_at = datetime('now') WHERE id = ?",
      args: [Number(id)],
    });

    // COMPLIANCE: Audit deletion
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'SOFT_DELETE',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: { name: product.name, context: 'Soft deletion by user requested' }
    });

    return apiOk({ message: 'Produto removido com sucesso' });
  } catch (err: any) {
    console.error('Product DELETE error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
