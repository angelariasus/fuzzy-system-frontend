import { expect, test } from '@playwright/test';
import { mockearApi } from './fixtures';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('simulador', () => {
  test('carga con 1900/3/12 y muestra 34,83 / Baja / R20 y R32', async ({ page }) => {
    await mockearApi(page);
    await page.goto('/');
    await expect(page.getByText('34,83').first()).toBeVisible();
    await expect(page.getByText('Baja', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'R20' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'R32' })).toBeVisible();
    await expect(page.getByText('Aplicar recomendaciones de uso eficiente')).toBeVisible();
  });

  test('mover un control dispara una petición con debounce y actualiza el resultado y la URL', async ({ page }) => {
    const contadores = await mockearApi(page);
    await page.goto('/');
    await expect(page.getByText('34,83').first()).toBeVisible();
    const antes = contadores.evaluar;
    const hora = page.getByLabel(/Hora del día/, { exact: false }).and(page.locator('input[type="text"]'));
    await hora.fill('18:30');
    await expect(page.getByText('54,83').first()).toBeVisible();
    // Un solo cambio de valor, una sola petición nueva (el debounce evita las intermedias).
    expect(contadores.evaluar - antes).toBe(1);
    await expect(page).toHaveURL(/h=18\.5/);
  });

  test('un 422 inesperado se muestra en el campo', async ({ page }) => {
    await mockearApi(page, { evaluar: '422' });
    await page.goto('/');
    await expect(page.getByText('Valor fuera del universo (mock 422)')).toBeVisible();
  });

  test('un 500 muestra el estado de error con Reintentar y el código', async ({ page }) => {
    await mockearApi(page, { evaluar: '500' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('MOTOR_FALLO').first()).toBeVisible();
    await expect(page.getByText('El backend respondió con un error interno.').first()).toBeVisible();
  });

  test('el body no tiene scroll en ninguna vista de escritorio', async ({ page }) => {
    await mockearApi(page);
    for (const ruta of ['/', '/explorar', '/lote', '/reglas', '/acerca']) {
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      const cabe = await page.evaluate(() => document.body.scrollHeight <= window.innerHeight);
      expect(cabe, `body con scroll en ${ruta}`).toBe(true);
    }
  });

  test('el toggle de tema alterna la clase dark sin cambiar el tamaño del botón', async ({ page }) => {
    await mockearApi(page);
    await page.goto('/');
    const boton = page.getByRole('button', { name: /Cambiar a tema/ });
    const antes = await boton.boundingBox();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await boton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const despues = await page.getByRole('button', { name: /Cambiar a tema/ }).boundingBox();
    expect(despues?.width).toBe(antes?.width);
    expect(despues?.height).toBe(antes?.height);
  });
});

test.describe('explorar', () => {
  test('dibuja la curva del barrido', async ({ page }) => {
    const contadores = await mockearApi(page);
    await page.goto('/explorar');
    await expect(page.getByRole('img', { name: /Índice de prioridad de ahorro frente a la potencia/ })).toBeVisible();
    expect(contadores.barrido).toBeGreaterThan(0);
    await expect(page.getByText('cambia de forma gradual')).toBeVisible();
  });
});

// Smoke test contra el backend real (sin mocks): E2E_REAL_BACKEND=1 npm run e2e
test('smoke contra el backend real', async ({ page }) => {
  test.skip(!process.env.E2E_REAL_BACKEND, 'Activar con E2E_REAL_BACKEND=1 y el backend en marcha');
  await page.goto('/?p=1900&n=3&h=12');
  await expect(page.getByText('34,83').first()).toBeVisible({ timeout: 15_000 });
});
