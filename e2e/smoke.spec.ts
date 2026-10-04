import { expect, test, type Page } from '@playwright/test';

async function mockPublicApi(page: Page) {
  await page.route(/\/(?:api|api-filereport)\/public\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/public/menu')) {
      await route.fulfill({ json: { recipes: [], categories: [] } });
      return;
    }
    if (path.endsWith('/public/events')) {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: {} });
  });
}

test.beforeEach(async ({ page }) => {
  await mockPublicApi(page);
  await page.addInitScript(() => localStorage.clear());
});

test('public home renders primary navigation and reservation actions', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Baja el\s+volumen\s+de la ciudad/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Reservar mesa/ }).first()).toHaveAttribute('href', '/reservar/mesa');
  await expect(page.getByRole('link', { name: /Cena con desconocidos/i }).first()).toHaveAttribute(
    'href',
    '/reservar/cena-con-desconocidos'
  );
  await expect(page.locator('footer').getByRole('link', { name: 'Eventos' })).toHaveAttribute(
    'href',
    '/reservar/eventos'
  );
  await page.locator('footer').getByRole('link', { name: 'Eventos' }).click();
  await expect(page).toHaveURL(/\/reservar\/eventos$/);
  await expect(page.getByRole('heading', { name: /Eventos y experiencias/i })).toBeVisible();
});

test('public menu handles an empty published menu', async ({ page }) => {
  await page.goto('/menu');

  await expect(page.getByRole('heading', { name: 'Menú', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carta en preparación' })).toBeVisible();
});

test('public menu distinguishes a loading error from an empty menu', async ({ page }) => {
  await page.unroute(/\/(?:api|api-filereport)\/public\//);
  await page.route(/\/(?:api|api-filereport)\/public\/menu$/, async (route) => {
    await route.fulfill({ status: 503, json: { error: 'Temporalmente no disponible' } });
  });

  await page.goto('/menu');

  await expect(page.getByRole('heading', { name: 'No pudimos cargar la carta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carta en preparación' })).not.toBeVisible();
});

test('dinner registration cannot start when there are no available dates', async ({ page }) => {
  await page.goto('/reservar/cena-con-desconocidos');

  await expect(page.getByText('No hay fechas disponibles en este momento.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Quiero participar/ })).toBeDisabled();
});

test('table reservation blocks incomplete first step', async ({ page }) => {
  await page.goto('/reservar/mesa');

  await expect(page.getByRole('heading', { name: 'Reservar una mesa' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Por favor completa todos los campos.')).toBeVisible();
});

test('anonymous admin access redirects to login', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
});

test('mobile public navigation opens and closes', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only navigation check');
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.pnav-drawer').getByRole('link', { name: 'Menu' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar menú' }).click();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
});
