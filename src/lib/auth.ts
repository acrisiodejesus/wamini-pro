import { auth0 } from '@/lib/auth0';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

// DIAGNÓSTICO: Validar variaveis de ambiente na inicialização (Produção)
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AUTH0_ISSUER_BASE_URL) {
    console.error('[CRITICAL] AUTH0_ISSUER_BASE_URL não está definida no ambiente!');
  } else if (!process.env.AUTH0_ISSUER_BASE_URL.startsWith('https://')) {
    console.error('[CRITICAL] AUTH0_ISSUER_BASE_URL deve começar com https://. Valor actual:', process.env.AUTH0_ISSUER_BASE_URL);
  }
}

/**
 * Função utilitária para verificar se existe uma sessão Auth0 válida 
 * em chamadas Edge/API de forma segura.
 * Se nula, o chamador deve disparar 401.
 * 
 * Agora retorna também o 'userId' interno da base SQLite.
 */
export async function getAuthPayload(req?: NextRequest) {
  // Test Backdoor ONLY for Playwright Pentests
  if (req && process.env.NODE_ENV !== 'production') {
    const authHeader = req.headers.get('Authorization');
    if (authHeader === 'Bearer TEST_TOKEN_USER_1') {
      return { sub: 'auth0|mock_user_1', userId: 1, name: 'Test User' };
    }
  }

  let session;
  try {
    session = await auth0.getSession();
  } catch (err) {
    console.error('[Auth] Error getting session:', err);
    return null;
  }
  if (!session || !session.user) return null;

  const sub = session.user.sub;
  const db = await getDb();

  // Procurar utilizador interno pelo Auth0 sub
  const result = await db.execute({
    sql: 'SELECT id, name, role FROM users WHERE auth0_sub = ? AND deleted_at IS NULL',
    args: [sub],
  });
  let user = result.rows[0] as any;

  // AUTO-LINKER: Se não existe na DB local, cria-o agora (Primeiro acesso)
  if (!user) {
    try {
      const name = session.user.name || session.user.nickname || 'Novo Utilizador';
      
      // Criar com mobile_number placeholder pois o Auth0 não o fornece por defeito
      const info = await db.execute({
        sql: `INSERT INTO users (name, auth0_sub, mobile_number, role) VALUES (?, ?, ?, 'buyer')`,
        args: [name, sub, `auth0_${sub.split('|')[1] || Date.now()}`],
      });
      
      user = { id: Number(info.lastInsertRowid), name, role: 'buyer' };
      console.log(`[AuthLinker] Novo utilizador local criado: ${name} (ID: ${user.id})`);
    } catch (err) {
      console.error('[AuthLinker] Erro ao criar utilizador local:', err);
      // Se falhar a criação (ex: constraint de mobile_number), devolvemos o payload básico mas avisamos
    }
  }
  
  return {
    ...session.user,
    userId: user?.id ? Number(user.id) : undefined,
    internalRole: user?.role,
    name: user?.name || session.user.name
  };
}

/** Resposta de erro JSON padrão */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Resposta de sucesso JSON padrão */
export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
