import { expect, test } from '@playwright/test';
import { mockearApi } from './fixtures';

test.use({ viewport: { width: 1280, height: 720 } });

const subir = (contenido: string) => ({ name: 'datos.csv', mimeType: 'text/csv', buffer: Buffer.from(contenido) });

test('un CSV válido se evalúa y muestra resultados', async ({ page }) => {
  const contadores = await mockearApi(page);
  await page.goto('/lote');
  await page.locator('input[type="file"]').setInputFiles(
    subir('id,potencia_w,ocupantes,hora\ninforme-1,300,4,12\ninforme-2,1900,3,12\ninforme-3,1900,3,19\ninforme-4,4500,0,20\n'),
  );
  await expect(page.getByText('datos.csv')).toBeVisible();
  await page.getByRole('button', { name: 'Evaluar 4 filas' }).click();
  await expect(page.getByRole('cell', { name: '34,83' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar resultados (CSV)' })).toBeVisible();
  expect(contadores.lote).toBe(1);
});

test('un CSV con errores lista fila y columna y no envía nada', async ({ page }) => {
  const contadores = await mockearApi(page);
  await page.goto('/lote');
  await page.locator('input[type="file"]').setInputFiles(subir('id,potencia_w,ocupantes,hora\na,300,4,12\nb,6000,3,12\n'));
  await expect(page.getByText(/Fila 3, potencia_w: la potencia debe estar entre 0 y 5000 W/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evaluar lote' })).toBeDisabled();
  expect(contadores.lote).toBe(0);
});
