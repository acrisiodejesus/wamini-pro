import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export interface AuthUserPayload {
  userId: number;
  name: string;
  role: string;
  mobile_number?: string;
  sub?: string;
  [key: string]: any;
}

/**
 * Função utilitária para autenticar requisições via Token JWT (Bearer Token ou Cookie).
 * Retorna o payload do utilizador com dados atualizados da base de dados local, ou null se não autenticado.
 */
export async function getAuthPayload(req?: NextRequest): Promise<AuthUserPayload | null> {
  if (!req) return null;

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  // Test Backdoor ONLY for Playwright Pentests / Testes E2E
  if (process.env.NODE_ENV !== 'production' && authHeader === 'Bearer TEST_TOKEN_USER_1') {
    return { sub: 'mock_user_1', userId: 1, name: 'Test User', role: 'super_admin' };
  }

  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    // Tenta obter de cookies se disponível
    const cookieToken = req.cookies.get('wamini_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return null;
  }

  const jwtPayload = await verifyJwt(token);
  if (!jwtPayload || !jwtPayload.userId) {
    return null;
  }

  try {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT id, name, mobile_number, role, localization FROM users WHERE id = ? AND deleted_at IS NULL',
      args: [jwtPayload.userId],
    });

    const user = result.rows[0] as any;
    if (!user) {
      return null;
    }

    return {
      userId: Number(user.id),
      name: user.name,
      role: user.role || 'buyer',
      mobile_number: user.mobile_number,
      localization: user.localization,
      sub: String(user.id),
    };
  } catch (error) {
    console.error('[Auth] Erro ao validar utilizador na base de dados:', error);
    return null;
  }
}

/** Resposta de erro JSON padrão */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Resposta de sucesso JSON padrão */
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
