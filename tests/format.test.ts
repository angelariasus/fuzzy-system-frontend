import { describe, expect, it } from 'vitest';
import {
  decimalAHora,
  formatGrado,
  formatIPA,
  formatNumero,
  horaADecimal,
  numeroParaUrl,
  parseHora,
  parseNumeroLocal,
} from '@/lib/format';

describe('formato numérico con coma decimal', () => {
  it('formatea con coma y redondea', () => {
    expect(formatIPA(34.83)).toBe('34,83');
    expect(formatIPA(60)).toBe('60,00');
    expect(formatGrado(0.8)).toBe('0,8000');
    expect(formatNumero(1900, 0)).toBe('1900');
    expect(formatNumero(2.005, 2)).toMatch(/^2,0[01]$/);
  });
  it('no produce -0,00', () => {
    expect(formatNumero(-0.0001, 2)).toBe('0,00');
  });
  it('devuelve guion para valores no finitos', () => {
    expect(formatNumero(Number.NaN)).toBe('-');
  });
});

describe('parseo', () => {
  it('acepta coma o punto', () => {
    expect(parseNumeroLocal('14,5')).toBe(14.5);
    expect(parseNumeroLocal(' 14.5 ')).toBe(14.5);
    expect(Number.isNaN(parseNumeroLocal(''))).toBe(true);
    expect(Number.isNaN(parseNumeroLocal('1,2,3'))).toBe(true);
    expect(Number.isNaN(parseNumeroLocal('abc'))).toBe(true);
  });
  it('parseHora distingue HH:MM de decimal', () => {
    expect(parseHora('14:30')).toBe(14.5);
    expect(parseHora('14,5')).toBe(14.5);
  });
});

describe('hora', () => {
  it('horaADecimal', () => {
    expect(horaADecimal('00:00')).toBe(0);
    expect(horaADecimal('9:15')).toBe(9.25);
    expect(horaADecimal('24:00')).toBe(24);
    expect(Number.isNaN(horaADecimal('12:60'))).toBe(true);
    expect(Number.isNaN(horaADecimal('doce'))).toBe(true);
  });
  it('decimalAHora', () => {
    expect(decimalAHora(14.5)).toBe('14:30');
    expect(decimalAHora(0)).toBe('00:00');
    expect(decimalAHora(24)).toBe('24:00');
    expect(decimalAHora(18.5)).toBe('18:30');
    expect(decimalAHora(9.999)).toBe('10:00');
  });
  it('es consistente en ida y vuelta para pasos de 0,25', () => {
    for (let h = 0; h <= 24; h += 0.25) expect(horaADecimal(decimalAHora(h))).toBeCloseTo(h, 6);
  });
});

describe('URL', () => {
  it('numeroParaUrl usa punto y sin ceros sobrantes', () => {
    expect(numeroParaUrl(14.5)).toBe('14.5');
    expect(numeroParaUrl(12)).toBe('12');
  });
});
