import { describe, expect, it } from 'vitest';
import { barridoSchema, evaluacionSchema, filaCsvSchema } from '@/lib/schemas';

const base = { potencia_w: 1900, ocupantes: 3, hora: 12 };

describe('evaluacionSchema', () => {
  it('acepta los bordes del dominio', () => {
    for (const e of [
      { potencia_w: 0, ocupantes: 0, hora: 0 },
      { potencia_w: 3000, ocupantes: 6, hora: 24 },
    ]) {
      expect(evaluacionSchema.safeParse(e).success).toBe(true);
    }
  });

  it('rechaza lo que queda fuera de rango sin recortar', () => {
    expect(evaluacionSchema.safeParse({ ...base, potencia_w: 3000.01 }).success).toBe(false);
    expect(evaluacionSchema.safeParse({ ...base, potencia_w: -1 }).success).toBe(false);
    expect(evaluacionSchema.safeParse({ ...base, ocupantes: 6.5 }).success).toBe(false);
    expect(evaluacionSchema.safeParse({ ...base, hora: 24.5 }).success).toBe(false);
  });

  it('rechaza NaN, Infinity y texto vacío', () => {
    expect(evaluacionSchema.safeParse({ ...base, potencia_w: Number.NaN }).success).toBe(false);
    expect(evaluacionSchema.safeParse({ ...base, ocupantes: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(evaluacionSchema.safeParse({ ...base, hora: '' }).success).toBe(false);
  });

  it('acepta coma decimal y hora HH:MM', () => {
    const r = evaluacionSchema.safeParse({ potencia_w: '1900,5', ocupantes: '2,5', hora: '14,5' });
    expect(r.success && r.data.hora).toBe(14.5);
    const h = evaluacionSchema.safeParse({ ...base, hora: '14:30' });
    expect(h.success && h.data.hora).toBe(14.5);
    expect(evaluacionSchema.safeParse({ ...base, hora: '24:00' }).success).toBe(true);
    expect(evaluacionSchema.safeParse({ ...base, hora: '12:75' }).success).toBe(false);
  });

  it('limita el id a 100 caracteres', () => {
    expect(evaluacionSchema.safeParse({ ...base, id_evaluacion: 'a'.repeat(100) }).success).toBe(true);
    expect(evaluacionSchema.safeParse({ ...base, id_evaluacion: 'a'.repeat(101) }).success).toBe(false);
  });

  it('el mensaje de potencia es específico y en español', () => {
    const r = evaluacionSchema.safeParse({ ...base, potencia_w: 6000 });
    expect(!r.success && r.error.issues[0].message).toContain('entre 0 y 3000 W');
  });
});

describe('filaCsvSchema', () => {
  it('valida una fila con hora decimal o HH:MM', () => {
    expect(filaCsvSchema.safeParse({ id: 'a', potencia_w: '300', ocupantes: '4', hora: '12:00' }).success).toBe(true);
    expect(filaCsvSchema.safeParse({ potencia_w: '300', ocupantes: '4', hora: '14.5' }).success).toBe(true);
    expect(filaCsvSchema.safeParse({ potencia_w: 'abc', ocupantes: '4', hora: '1' }).success).toBe(false);
  });
});

describe('barridoSchema', () => {
  const valido = { variable: 'potencia_w', desde: 0, hasta: 3000, pasos: 100, fijos: { ocupantes: 3, hora: 12 } };

  it('acepta el universo completo', () => {
    expect(barridoSchema.safeParse(valido).success).toBe(true);
  });

  it('exige desde menor que hasta y rango dentro del universo', () => {
    expect(barridoSchema.safeParse({ ...valido, desde: 3000, hasta: 1000 }).success).toBe(false);
    expect(barridoSchema.safeParse({ ...valido, hasta: 3001 }).success).toBe(false);
    expect(barridoSchema.safeParse({ ...valido, variable: 'ocupantes', hasta: 7 }).success).toBe(false);
  });

  it('limita los pasos a 2-500', () => {
    expect(barridoSchema.safeParse({ ...valido, pasos: 1 }).success).toBe(false);
    expect(barridoSchema.safeParse({ ...valido, pasos: 501 }).success).toBe(false);
    expect(barridoSchema.safeParse({ ...valido, pasos: 500 }).success).toBe(true);
  });
});
