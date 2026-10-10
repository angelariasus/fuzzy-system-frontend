import { describe, expect, it } from 'vitest';
import membresias from './fixtures/membresias.json';
import caso1900 from './fixtures/evaluar_1900_3_12.json';
import caso1900_19 from './fixtures/evaluar_1900_3_19.json';
import caso300 from './fixtures/evaluar_300_4_12.json';
import { calcularAgregacion } from '@/lib/agregacion';
import type { EvaluacionResponse, MembresiasResponse } from '@/types/api';

const mem = membresias as unknown as MembresiasResponse;

/** Centroide por regla del trapecio. Vive solo en la prueba: la app no calcula el IPA. */
function centroide(x: number[], y: number[]): number {
  let num = 0;
  let den = 0;
  for (let i = 1; i < x.length; i += 1) {
    const dx = x[i] - x[i - 1];
    num += ((x[i] * y[i] + x[i - 1] * y[i - 1]) / 2) * dx;
    den += ((y[i] + y[i - 1]) / 2) * dx;
  }
  return num / den;
}

describe('calcularAgregacion (solo para dibujar)', () => {
  it('caso 1900/3/12: recortes R20 (0,8 Bajo) y R32 (0,2 Medio)', () => {
    const r = caso1900 as unknown as EvaluacionResponse;
    const a = calcularAgregacion(mem.variables.ipa, r.reglas_activadas);
    expect(a.alphaPorSalida.bajo).toBeCloseTo(0.8, 4);
    expect(a.alphaPorSalida.medio).toBeCloseTo(0.2, 4);
    expect(a.alphaPorSalida.muy_bajo).toBe(0);
    expect(Math.max(...a.recortes.bajo)).toBeCloseTo(0.8, 4);
    expect(Math.max(...a.recortes.medio)).toBeCloseTo(0.2, 4);
  });

  it('reproduce el centroide del backend (34,83) con tolerancia de 0,2', () => {
    const r = caso1900 as unknown as EvaluacionResponse;
    const a = calcularAgregacion(mem.variables.ipa, r.reglas_activadas);
    expect(Math.abs(centroide(a.universo, a.agregado) - r.ipa)).toBeLessThan(0.2);
    expect(r.ipa).toBe(34.83);
  });

  it('es coherente con otros casos del informe', () => {
    for (const caso of [caso1900_19, caso300]) {
      const r = caso as unknown as EvaluacionResponse;
      const a = calcularAgregacion(mem.variables.ipa, r.reglas_activadas);
      expect(Math.abs(centroide(a.universo, a.agregado) - r.ipa)).toBeLessThan(0.2);
    }
  });

  it('con varias reglas hacia la misma salida usa el alpha máximo', () => {
    const reglas = [
      { regla: 'R1', potencia: '', ocupantes: '', bloque: '', salida: 'Bajo', alpha: 0.3, calculo: '' },
      { regla: 'R2', potencia: '', ocupantes: '', bloque: '', salida: 'Bajo', alpha: 0.6, calculo: '' },
    ];
    expect(calcularAgregacion(mem.variables.ipa, reglas).alphaPorSalida.bajo).toBe(0.6);
  });
});
