import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'wamini_default_secret_key_minimum_32_characters_long_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  userId: number;
  role?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Assina um token JWT com expiração padrão de 7 dias
 */
export async function signJwt(payload: JwtPayload, expiresIn = '7d'): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verifica e decodifica um token JWT. Retorna o payload ou null se for inválido/expirado.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
