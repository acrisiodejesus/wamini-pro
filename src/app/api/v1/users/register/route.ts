import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(255),
  mobile_number: z.string().min(9, 'Número de telefone inválido').max(20),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  localization: z.string().optional(),
  role: z.string().optional().default('buyer'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Dados de registo inválidos';
      return apiError(errorMsg, 400);
    }

    const { name, mobile_number, password, localization, role } = parseResult.data;
    const db = await getDb();

    // Verificar se número já existe
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE mobile_number = ? AND deleted_at IS NULL',
      args: [mobile_number],
    });

    if (existing.rows.length > 0) {
      return apiError('Este número de telefone já se encontra registado', 409);
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: `INSERT INTO users (name, mobile_number, password_hash, localization, role)
            VALUES (?, ?, ?, ?, ?)`,
      args: [name, mobile_number, password_hash, localization || null, role],
    });

    const user_id = Number(result.lastInsertRowid);

    return apiOk(
      {
        message: 'Conta criada com sucesso',
        user_id,
      },
      201
    );
  } catch (error: any) {
    console.error('[Register] Erro ao registar utilizador:', error);
    return apiError('Erro interno ao processar registo', 500);
  }
}
