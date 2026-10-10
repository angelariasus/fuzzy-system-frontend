import { LIMITES, VALORES_POR_DEFECTO } from '@/lib/constants';
import { numeroParaUrl, parseHora, parseNumeroLocal } from '@/lib/format';
import type { Entradas } from '@/types/api';

/**
 * Estado del simulador en la URL: ?p=1900&n=3&h=12 (enlace compartible).
 * Solo usa comprobaciones de rango simples para poder probarse sin dependencias.
 */

interface ParametrosLeibles {
  get(nombre: string): string | null;
}

function enRango(valor: number, min: number, max: number): boolean {
  return Number.isFinite(valor) && valor >= min && valor <= max;
}

/** Devuelve las entradas de la URL si las tres son válidas; si no, null (se usan los valores por defecto). */
export function leerEntradasDeUrl(params: ParametrosLeibles): Entradas | null {
  const p = params.get('p');
  const n = params.get('n');
  const h = params.get('h');
  if (p === null || n === null || h === null) return null;
  const potencia = parseNumeroLocal(p);
  const ocupantes = parseNumeroLocal(n);
  const hora = parseHora(h);
  if (
    !enRango(potencia, LIMITES.potencia_w.min, LIMITES.potencia_w.max) ||
    !enRango(ocupantes, LIMITES.ocupantes.min, LIMITES.ocupantes.max) ||
    !enRango(hora, LIMITES.hora.min, LIMITES.hora.max)
  ) {
    return null;
  }
  return { potencia_w: potencia, ocupantes, hora };
}

export function entradasIniciales(params: ParametrosLeibles): Entradas {
  return leerEntradasDeUrl(params) ?? VALORES_POR_DEFECTO;
}

export function consultaDeEntradas(e: Entradas): string {
  return `p=${numeroParaUrl(e.potencia_w)}&n=${numeroParaUrl(e.ocupantes)}&h=${numeroParaUrl(e.hora)}`;
}

/** Ruta relativa al simulador con las entradas dadas: "/?p=...&n=...&h=...". */
export function rutaSimulador(e: Entradas): string {
  return `/?${consultaDeEntradas(e)}`;
}
