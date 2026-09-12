import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  mobile_number: z.string().min(9, 'Número de telefone inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Dados de login inválidos';
      return apiError(errorMsg, 400);
    }

    const { mobile_number, password } = parseResult.data;
    const db = await getDb();

    const result = await db.execute({
      sql: `SELECT id, name, mobile_number, password_hash, localization, photo, role, subscription_plan, subscription_status
            FROM users
            WHERE mobile_number = ? AND deleted_at IS NULL`,
      args: [mobile_number],
    });

    const user = result.rows[0] as any;

    if (!user) {
      return apiError('Número de telefone ou senha incorretos', 401);
    }

    if (!user.password_hash) {
      return apiError('Conta configurada sem senha local. Por favor contacte o suporte.', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return apiError('Número de telefone ou senha incorretos', 401);
    }

    const userId = Number(user.id);
    const token = await signJwt({
      userId,
      role: user.role,
      name: user.name,
      mobile_number: user.mobile_number,
    });

    const response = apiOk({
      access_token: token,
      user: {
        id: userId,
        name: user.name,
        mobile_number: user.mobile_number,
        role: user.role,
        localization: user.localization,
        photo: user.photo,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
      },
    });

    response.cookies.set('wamini_token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('[Login] Erro ao autenticar utilizador:', error);
    return apiError('Erro interno ao processar autenticação', 500);
  }
}
