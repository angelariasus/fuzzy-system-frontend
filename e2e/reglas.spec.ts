import { expect, test } from '@playwright/test';
import { mockearApi } from './fixtures';

test.use({ viewport: { width: 1280, height: 720 } });

test('muestra las 36 reglas', async ({ page }) => {
  await mockearApi(page);
  await page.goto('/reglas');
  await expect(page.locator('[id^="regla-"]')).toHaveCount(36);
});

test('con ?p&n&h resalta las reglas activadas con su grado', async ({ page }) => {
  await mockearApi(page);
  await page.goto('/reglas?p=1900&n=3&h=12');
  await expect(page.getByText('Grado de activación')).toHaveCount(2);
  await expect(page.locator('#regla-R20')).toContainText('0,8000');
  await expect(page.locator('#regla-R32')).toContainText('0,2000');
});

test('con ?regla=R20 resalta esa regla', async ({ page }) => {
  await mockearApi(page);
  await page.goto('/reglas?regla=R20');
  await expect(page.locator('#regla-R20')).toBeVisible();
});

test('la vista tabla filtra por código', async ({ page }) => {
  await mockearApi(page);
  await page.goto('/reglas');
  await page.getByRole('button', { name: 'Tabla' }).click();
  await page.getByLabel('Buscar por código de regla').fill('R20');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});
