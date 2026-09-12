import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('deve carregar a página inicial corretamente', async ({ page }) => {
    // Navega para a página inicial
    await page.goto('/');

    // Verifica a presença do título principal Wamini no Hero
    const heroTitle = page.locator('h1').filter({ hasText: /Wamini/i });
    await expect(heroTitle).toBeVisible();

    // Verifica a presença da navegação com o nome Wamini
    const logo = page.locator('nav').getByText(/Wamini/i, { exact: false }).first();
    await expect(logo).toBeVisible();
  });
});
