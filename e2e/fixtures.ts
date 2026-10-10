import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page, Route } from '@playwright/test';

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const leer = (nombre: string) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', 'tests', 'fixtures', nombre), 'utf-8'));

export const fixtures = {
  membresias: leer('membresias.json'),
  reglas: leer('reglas.json'),
  caso12: leer('evaluar_1900_3_12.json'),
  caso19: leer('evaluar_1900_3_19.json'),
  caso300: leer('evaluar_300_4_12.json'),
  barrido: leer('barrido_potencia.json'),
  lote: leer('lote_casos.json'),
};

export interface OpcionesMock {
  evaluar?: 'ok' | '422' | '500';
  health?: 'ok' | 'error';
  /** Simula backend caído (la conexión falla). */
  caido?: boolean;
}

export interface Contadores {
  evaluar: number;
  lote: number;
  barrido: number;
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

const json = (route: Route, cuerpo: unknown, status = 200) =>
  route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });

/** Mockea TODOS los endpoints del backend. Devuelve contadores de peticiones para las aserciones. */
export async function mockearApi(page: Page, opciones: OpcionesMock = {}): Promise<Contadores> {
  const contadores: Contadores = { evaluar: 0, lote: 0, barrido: 0 };
  await page.route(`${API}/**`, async (route) => {
    const peticion = route.request();
    if (opciones.caido) return route.abort('connectionrefused');
    if (peticion.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(peticion.url());

    if (url.pathname === '/health') {
      return json(route, { status: opciones.health === 'error' ? 'error' : 'ok' }, opciones.health === 'error' ? 503 : 200);
    }
    if (url.pathname === '/api/membresias') return json(route, fixtures.membresias);
    if (url.pathname === '/api/reglas') return json(route, fixtures.reglas);
    if (url.pathname === '/api/barrido') {
      contadores.barrido += 1;
      return json(route, fixtures.barrido);
    }
    if (url.pathname === '/api/evaluar/lote') {
      contadores.lote += 1;
      return json(route, fixtures.lote);
    }
    if (url.pathname === '/api/evaluar') {
      contadores.evaluar += 1;
      if (opciones.evaluar === '500') return json(route, { detail: 'Error interno', error_code: 'MOTOR_FALLO' }, 500);
      if (opciones.evaluar === '422') {
        return json(
          route,
          { detail: [{ loc: ['body', 'potencia_w'], msg: 'Valor fuera del universo (mock 422)', type: 'value_error' }] },
          422,
        );
      }
      const cuerpo = peticion.postDataJSON() as { potencia_w: number; ocupantes: number; hora: number };
      const base = cuerpo.hora >= 17 && cuerpo.hora < 23 ? fixtures.caso19 : cuerpo.potencia_w < 500 ? fixtures.caso300 : fixtures.caso12;
      return json(route, { ...base, entradas: { potencia_w: cuerpo.potencia_w, ocupantes: cuerpo.ocupantes, hora: cuerpo.hora } });
    }
    if (url.pathname.startsWith('/api/grafico/')) {
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'image/png' }, body: Buffer.from('') });
    }
    return route.fulfill({ status: 404, headers: CORS, body: 'no mockeado' });
  });
  return contadores;
}
