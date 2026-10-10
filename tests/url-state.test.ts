import { describe, expect, it } from 'vitest';
import { consultaDeEntradas, entradasIniciales, leerEntradasDeUrl } from '@/lib/url-state';

const params = (q: string) => new URLSearchParams(q);

describe('url-state', () => {
  it('lee entradas válidas', () => {
    expect(leerEntradasDeUrl(params('p=1900&n=3&h=18.5'))).toEqual({ potencia_w: 1900, ocupantes: 3, hora: 18.5 });
  });
  it('ignora valores inválidos o incompletos y usa los de por defecto', () => {
    expect(leerEntradasDeUrl(params('p=9999&n=3&h=12'))).toBeNull();
    expect(leerEntradasDeUrl(params('p=1900&n=3'))).toBeNull();
    expect(entradasIniciales(params('p=abc&n=3&h=12'))).toEqual({ potencia_w: 1900, ocupantes: 3, hora: 12 });
  });
  it('serializa y vuelve a leer lo mismo', () => {
    const e = { potencia_w: 2500, ocupantes: 6, hora: 19 };
    expect(leerEntradasDeUrl(params(consultaDeEntradas(e)))).toEqual(e);
  });
});
