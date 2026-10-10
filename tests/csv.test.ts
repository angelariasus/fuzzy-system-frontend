import { describe, expect, it } from 'vitest';
import evaluar from './fixtures/evaluar_1900_3_12.json';
import { COLUMNAS_EXPORTACION, construirCsvResultados, parsearCsv, textoErrorFila } from '@/lib/csv';
import type { EvaluacionResponse } from '@/types/api';

describe('parsearCsv', () => {
  it('valida filas correctas (hora decimal o HH:MM)', () => {
    const r = parsearCsv('id,potencia_w,ocupantes,hora\na,300,4,12\nb,1900,3,19:30\n');
    expect(r.errores).toEqual([]);
    expect(r.validas).toHaveLength(2);
    expect(r.validas[1].hora).toBe(19.5);
  });

  it('informa errores con número de fila y columna (la cabecera es la fila 1)', () => {
    const r = parsearCsv('id,potencia_w,ocupantes,hora\na,300,4,12\nb,6000,3,12\nc,100,2,25\n');
    expect(r.validas).toHaveLength(0);
    expect(r.errores.map((e) => [e.fila, e.columna])).toEqual([
      [3, 'potencia_w'],
      [4, 'hora'],
    ]);
    expect(textoErrorFila(r.errores[0])).toMatch(/^Fila 3, potencia_w: la potencia debe estar entre 0 y 3000 W/);
  });

  it('exige las columnas de la cabecera', () => {
    const r = parsearCsv('id,potencia,ocupantes,hora\na,300,4,12\n');
    expect(r.errores[0].mensaje).toContain('potencia_w');
    expect(r.validas).toHaveLength(0);
  });

  it('respeta el límite de 1000 filas', () => {
    const filas = Array.from({ length: 1001 }, (_, i) => `f${i},300,4,12`).join('\n');
    const r = parsearCsv(`id,potencia_w,ocupantes,hora\n${filas}`);
    expect(r.excedeLimite).toBe(true);
    expect(r.validas).toHaveLength(0);
    const justo = parsearCsv(`id,potencia_w,ocupantes,hora\n${filas.split('\n').slice(0, 1000).join('\n')}`);
    expect(justo.excedeLimite).toBe(false);
    expect(justo.validas).toHaveLength(1000);
  });

  it('genera un id por fila cuando falta', () => {
    const r = parsearCsv('id,potencia_w,ocupantes,hora\n,300,4,12\n');
    expect(r.validas[0].id_evaluacion).toBe('fila-2');
  });
});

describe('construirCsvResultados', () => {
  it('exporta las columnas esperadas', () => {
    const csv = construirCsvResultados([evaluar as unknown as EvaluacionResponse]);
    const [cabecera, fila] = csv.split(/\r?\n/);
    expect(cabecera).toBe(COLUMNAS_EXPORTACION.join(','));
    expect(cabecera).toBe('id,potencia_w,ocupantes,hora,ipa,interpretacion,accion_sugerida,reglas_activadas');
    expect(fila).toContain('34.83');
    expect(fila).toContain('R20 (0.8000); R32 (0.2000)');
  });
});
