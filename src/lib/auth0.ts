import { initAuth0 } from '@auth0/nextjs-auth0';

/**
 * 🛡️ Centralização de Autenticação Wamini
 * Forçamos a leitura das variáveis para garantir que o Coolify as injecta correctamente.
 */
// Limpeza e Validação da Issuer URL
let issuerUrl = process.env.AUTH0_ISSUER_BASE_URL || '';
if (issuerUrl && !issuerUrl.startsWith('http')) {
  issuerUrl = `https://${issuerUrl}`;
}

export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: issuerUrl,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // Opções para evitar erros de sessão no server-side
  session: {
    rolling: true,
    absoluteDuration: 7 * 24 * 60 * 60, // 7 dias
  },
});
