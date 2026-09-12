import { auth0 } from '@/lib/auth0';

export const GET = auth0.handleAuth({
  login: auth0.handleLogin((req: any) => {
    try {
      const url = new URL(req.url, process.env.AUTH0_BASE_URL || 'https://wamini.co.mz');
      const screen_hint = url.searchParams.get('screen_hint');

      return {
        // Redireccionar sempre para o mercado após login bem-sucedido
        returnTo: '/market',
        authorizationParams: {
          screen_hint: screen_hint || undefined,
        },
      };
    } catch (e) {
      return {};
    }
  }),
});
