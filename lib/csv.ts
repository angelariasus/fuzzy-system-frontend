import Papa from 'papaparse';
import { LIMITES } from '@/lib/constants';
import { filaCsvSchema } from '@/lib/schemas';
import type { EvaluacionRequest, EvaluacionResponse } from '@/types/api';

export interface ErrorFila {
  /** Número de fila tal como la ve la persona en el archivo (la cabecera es la fila 1). */
  fila: number;
  columna?: string;
  mensaje: string;
}

export interface FilaValida extends EvaluacionRequest {
  id_evaluacion: string;
  /** Fila del archivo de origen, para trazabilidad. */
  fila: number;
}

export interface ResultadoCsv {
  totalFilas: number;
  validas: FilaValida[];
  errores: ErrorFila[];
  excedeLimite: boolean;
}

const COLUMNAS_REQUERIDAS = ['potencia_w', 'ocupantes', 'hora'] as const;

function minusculaInicial(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

/** Texto listo para mostrar: "Fila 7, potencia_w: la potencia debe estar entre 0 y 5000 W ...". */
export function textoErrorFila(e: ErrorFila): string {
  const donde = e.columna ? `Fila ${e.fila}, ${e.columna}` : `Fila ${e.fila}`;
  return `${donde}: ${minusculaInicial(e.mensaje)}`;
}

/**
 * Parsea y valida un CSV fila por fila con el mismo esquema zod del simulador.
 * Si hay errores o se supera el límite, `validas` queda vacío: no se envía nada, porque el
 * backend valida de forma atómica y así se evita el roundtrip.
 */
export function parsearCsv(texto: string): ResultadoCsv {
  const parseo = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (cabecera) => cabecera.trim().toLowerCase().replace(/^\uFEFF/, ''),
  });

  const errores: ErrorFila[] = [];
  const filas = parseo.data;
  const columnas = parseo.meta.fields ?? [];

  const faltantes = COLUMNAS_REQUERIDAS.filter((c) => !columnas.includes(c));
  if (faltantes.length > 0) {
    errores.push({
      fila: 1,
      mensaje: `Faltan columnas en la cabecera: ${faltantes.join(', ')}. Se esperan id, potencia_w, ocupantes y hora.`,
    });
    return { totalFilas: filas.length, validas: [], errores, excedeLimite: false };
  }

  if (filas.length > LIMITES.filasLote) {
    errores.push({
      fila: LIMITES.filasLote + 2,
      mensaje: `El archivo tiene ${filas.length} filas y el máximo es ${LIMITES.filasLote}.`,
    });
    return { totalFilas: filas.length, validas: [], errores, excedeLimite: true };
  }

  for (const e of parseo.errors) {
    // Con una sola columna Papa no detecta el delimitador; la cabecera ya se validó arriba.
    if (e.code === 'UndetectableDelimiter') continue;
    errores.push({ fila: (e.row ?? 0) + 2, mensaje: e.message });
  }

  const validas: FilaValida[] = [];
  filas.forEach((registro, indice) => {
    const fila = indice + 2;
    const crudo = {
      id: registro.id === undefined || registro.id === '' ? undefined : registro.id,
      potencia_w: registro.potencia_w ?? '',
      ocupantes: registro.ocupantes ?? '',
      hora: registro.hora ?? '',
    };
    const resultado = filaCsvSchema.safeParse(crudo);
    if (resultado.success) {
      validas.push({
        id_evaluacion: resultado.data.id ?? `fila-${fila}`,
        potencia_w: resultado.data.potencia_w,
        ocupantes: resultado.data.ocupantes,
        hora: resultado.data.hora,
        fila,
      });
    } else {
      for (const issue of resultado.error.issues) {
        errores.push({ fila, columna: String(issue.path[0] ?? ''), mensaje: issue.message });
      }
    }
  });

  return {
    totalFilas: filas.length,
    validas: errores.length === 0 ? validas : [],
    errores,
    excedeLimite: false,
  };
}

/** Columnas de la exportación, en este orden. */
export const COLUMNAS_EXPORTACION = [
  'id',
  'potencia_w',
  'ocupantes',
  'hora',
  'ipa',
  'interpretacion',
  'accion_sugerida',
  'reglas_activadas',
] as const;

export function construirCsvResultados(resultados: EvaluacionResponse[]): string {
  const datos = resultados.map((r) => ({
    id: r.id_evaluacion ?? '',
    potencia_w: r.entradas.potencia_w,
    ocupantes: r.entradas.ocupantes,
    hora: r.entradas.hora,
    ipa: r.ipa,
    interpretacion: r.interpretacion,
    accion_sugerida: r.accion_sugerida,
    reglas_activadas: r.reglas_activadas.map((x) => `${x.regla} (${x.alpha.toFixed(4)})`).join('; '),
  }));
  return Papa.unparse({ fields: [...COLUMNAS_EXPORTACION], data: datos.map((d) => COLUMNAS_EXPORTACION.map((c) => d[c])) });
}
