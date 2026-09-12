import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { plan } = body; // 'basic', 'plus', 'premium'

    if (!['basic', 'plus', 'premium'].includes(plan)) {
      return apiError('Plano inválido', 400);
    }

    const db = await getDb();
    
    // Calcula a data de expiração (1 mês a partir de hoje)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const expiryStr = expiryDate.toISOString();

    await db.execute({
      sql: `UPDATE users 
      SET subscription_plan = ?, 
          subscription_status = 'active', 
          subscription_expiry = ?
      WHERE id = ?`,
      args: [plan, expiryStr, payload.userId as number],
    });

    const result = await db.execute({
      sql: 'SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry FROM users WHERE id = ?',
      args: [payload.userId as number],
    });
    const updatedUser = result.rows[0];

    return apiOk({ message: 'Assinatura activada com sucesso!', user: updatedUser });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return apiError('Erro ao processar assinatura', 500);
  }
}
