import { TIMEOUT_API_MS } from '@/lib/constants';
import type {
  BarridoRequest,
  BarridoResponse,
  ErrorResponse,
  EvaluacionRequest,
  EvaluacionResponse,
  HealthResponse,
  LoteRequest,
  LoteResponse,
  MembresiasResponse,
  ReglaItem,
  ValidationErrorItem,
  ValidationErrorResponse,
} from '@/types/api';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
);

/* ------------------------------ Errores tipados ------------------------------ */

/** Backend caído, sin red o bloqueado por CORS. */
export class ApiNetworkError extends Error {
  constructor(message = 'No se pudo conectar con el backend') {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(message = 'El backend no respondió a tiempo') {
    super(message);
    this.name = 'ApiTimeoutError';
  }
}

/** 422. `fieldErrors` mapea el nombre del campo del backend a su mensaje. */
export class ApiValidationError extends Error {
  readonly fieldErrors: Record<string, string>;
  readonly items: ValidationErrorItem[];
  /** Índice del ítem inválido en una petición por lote (si aplica). */
  readonly indice?: number;

  constructor(items: ValidationErrorItem[]) {
    super('Entradas inválidas según el backend');
    this.name = 'ApiValidationError';
    this.items = items;
    this.fieldErrors = {};
    for (const item of items) {
      const campo = [...item.loc].reverse().find((parte): parte is string => typeof parte === 'string');
      if (campo && campo !== 'body' && !(campo in this.fieldErrors)) {
        this.fieldErrors[campo] = item.msg;
      }
      const posicion = item.loc.find((parte): parte is number => typeof parte === 'number');
      if (posicion !== undefined && this.indice === undefined) this.indice = posicion;
    }
  }
}

/** 500 (o cualquier otro estado de error que no sea 422). */
export class ApiServerError extends Error {
  readonly status: number;
  readonly errorCode?: string;

  constructor(status: number, detail: string, errorCode?: string) {
    super(detail);
    this.name = 'ApiServerError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

/* ------------------------------ Núcleo HTTP ------------------------------ */

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST';
  cuerpo?: unknown;
  signal?: AbortSignal;
}

async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, signal } = opciones;
  const controlador = new AbortController();
  let vencido = false;
  const temporizador = setTimeout(() => {
    vencido = true;
    controlador.abort();
  }, TIMEOUT_API_MS);

  // Une la señal de React Query (cancelación de peticiones obsoletas) con el timeout propio.
  const alAbortar = () => controlador.abort();
  if (signal) {
    if (signal.aborted) controlador.abort();
    else signal.addEventListener('abort', alAbortar, { once: true });
  }

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: controlador.signal,
    });

    if (respuesta.ok) return (await respuesta.json()) as T;

    let cuerpoError: unknown = null;
    try {
      cuerpoError = await respuesta.json();
    } catch {
      cuerpoError = null;
    }
    if (respuesta.status === 422) {
      const detalle = (cuerpoError as ValidationErrorResponse | null)?.detail;
      const errores = (cuerpoError as { errors?: { campo: string; mensaje: string; tipo: string }[] } | null)
        ?.errors;
      const items = Array.isArray(detalle)
        ? detalle.map(normalizarItemValidacion)
        : (errores ?? []).map((error) => ({
            loc: campoBackendALoc(error.campo),
            msg: error.mensaje,
            type: error.tipo,
          }));
      throw new ApiValidationError(items);
    }
    const err = cuerpoError as Partial<ErrorResponse> | null;
    throw new ApiServerError(
      respuesta.status,
      typeof err?.detail === 'string' ? err.detail : `Error ${respuesta.status} del backend`,
      err?.error_code,
    );
  } catch (error) {
    if (
      error instanceof ApiValidationError ||
      error instanceof ApiServerError ||
      error instanceof ApiTimeoutError ||
      error instanceof ApiNetworkError
    ) {
      throw error;
    }
    // Cancelada por el consumidor (React Query la ignora): se propaga como AbortError.
    if (signal?.aborted && !vencido) throw error;
    if (vencido) throw new ApiTimeoutError();
    // Nunca se deja salir un TypeError crudo de fetch.
    throw new ApiNetworkError();
  } finally {
    clearTimeout(temporizador);
    signal?.removeEventListener('abort', alAbortar);
  }
}

const CAMPO_FRONTEND: Record<string, string> = {
  consumo_w: 'potencia_w',
  personas: 'ocupantes',
};

function normalizarItemValidacion(item: ValidationErrorItem): ValidationErrorItem {
  return {
    ...item,
    loc: item.loc.map((parte) => (typeof parte === 'string' ? (CAMPO_FRONTEND[parte] ?? parte) : parte)),
  };
}

function campoBackendALoc(campo: string): (string | number)[] {
  const loc: (string | number)[] = ['body'];
  for (const parte of campo.split('.')) {
    const coincidencia = /^(\w+)\[(\d+)]$/.exec(parte);
    if (coincidencia) {
      loc.push(CAMPO_FRONTEND[coincidencia[1]] ?? coincidencia[1], Number(coincidencia[2]));
    } else {
      loc.push(CAMPO_FRONTEND[parte] ?? parte);
    }
  }
  return loc;
}

/* -------------------- Adaptación al contrato del backend -------------------- */

type EntradaBackend = { consumo_w: number; personas: number; hora: number };

interface EvaluacionBackend {
  id_evaluacion: string | null;
  entradas: EntradaBackend;
  salida_pct: number;
  interpretacion: EvaluacionResponse['interpretacion'];
  accion_sugerida: string;
  fuzzificacion: {
    consumo: Record<'bajo' | 'medio' | 'alto', number>;
    personas: Record<'pocas' | 'moderadas' | 'muchas', number>;
    hora: Record<'madrugada' | 'manana' | 'tarde' | 'noche', number>;
  };
  reglas_activadas: {
    regla: string;
    consumo: string;
    personas: string;
    hora: string;
    salida: string;
    alpha: number;
    calculo: string;
  }[];
}

interface MembresiasBackend {
  variables: Record<
    'consumo' | 'personas' | 'hora' | 'salida',
    { unidad: string; x: number[]; conjuntos: Record<string, number[]> }
  >;
}

const VARIABLE_BACKEND = {
  potencia_w: 'consumo_w',
  ocupantes: 'personas',
  hora: 'hora',
} as const;

const VARIABLE_FRONTEND = {
  consumo_w: 'potencia_w',
  personas: 'ocupantes',
  hora: 'hora',
} as const;

function entradaABackend(entrada: EvaluacionRequest): EntradaBackend & { id_evaluacion?: string | null } {
  return {
    id_evaluacion: entrada.id_evaluacion,
    consumo_w: entrada.potencia_w,
    personas: entrada.ocupantes,
    hora: entrada.hora,
  };
}

function adaptarEvaluacion(respuesta: EvaluacionBackend): EvaluacionResponse {
  return {
    id_evaluacion: respuesta.id_evaluacion,
    entradas: {
      potencia_w: respuesta.entradas.consumo_w,
      ocupantes: respuesta.entradas.personas,
      hora: respuesta.entradas.hora,
    },
    ipa: respuesta.salida_pct,
    interpretacion: respuesta.interpretacion,
    accion_sugerida: respuesta.accion_sugerida,
    fuzzificacion: {
      potencia: {
        baja: respuesta.fuzzificacion.consumo.bajo,
        media: respuesta.fuzzificacion.consumo.medio,
        alta: respuesta.fuzzificacion.consumo.alto,
      },
      ocupantes: respuesta.fuzzificacion.personas,
      bloque: respuesta.fuzzificacion.hora,
    },
    reglas_activadas: respuesta.reglas_activadas.map((regla) => ({
      regla: regla.regla,
      potencia: regla.consumo,
      ocupantes: regla.personas,
      bloque: regla.hora,
      salida: regla.salida,
      alpha: regla.alpha,
      calculo: regla.calculo,
    })),
  };
}

/* ------------------------------ Endpoints ------------------------------ */

export const evaluar = async (cuerpo: EvaluacionRequest, signal?: AbortSignal) =>
  adaptarEvaluacion(
    await peticion<EvaluacionBackend>('/api/evaluar', {
      metodo: 'POST',
      cuerpo: entradaABackend(cuerpo),
      signal,
    }),
  );

export const evaluarLote = async (cuerpo: LoteRequest, signal?: AbortSignal): Promise<LoteResponse> => {
  const respuesta = await peticion<{ total: number; resultados: EvaluacionBackend[] }>('/api/evaluar/lote', {
    metodo: 'POST',
    cuerpo: { evaluaciones: cuerpo.evaluaciones.map(entradaABackend) },
    signal,
  });
  return { total: respuesta.total, resultados: respuesta.resultados.map(adaptarEvaluacion) };
};

export const barrido = async (cuerpo: BarridoRequest, signal?: AbortSignal): Promise<BarridoResponse> => {
  const fijos = Object.fromEntries(
    Object.entries(cuerpo.fijos).map(([campo, valor]) => [
      VARIABLE_BACKEND[campo as keyof typeof VARIABLE_BACKEND],
      valor,
    ]),
  );
  const respuesta = await peticion<{
    variable: keyof typeof VARIABLE_FRONTEND;
    puntos: { valor: number; salida_pct: number; interpretacion: string }[];
  }>('/api/barrido', {
    metodo: 'POST',
    cuerpo: {
      variable: VARIABLE_BACKEND[cuerpo.variable],
      desde: cuerpo.desde,
      hasta: cuerpo.hasta,
      pasos: cuerpo.pasos,
      ...fijos,
    },
    signal,
  });
  return {
    variable: VARIABLE_FRONTEND[respuesta.variable],
    fijos: cuerpo.fijos,
    puntos: respuesta.puntos.map((punto) => ({
      valor: punto.valor,
      ipa: punto.salida_pct,
      interpretacion: punto.interpretacion,
    })),
  };
};

export const obtenerReglas = async (signal?: AbortSignal): Promise<ReglaItem[]> => {
  const reglas = await peticion<
    { id: string; consumo: string; personas: string; hora: string; salida: string }[]
  >('/api/reglas', { signal });
  return reglas.map((regla) => ({
    regla: regla.id,
    potencia: regla.consumo,
    ocupantes: regla.personas,
    bloque: regla.hora,
    salida: regla.salida,
    calculo_ordinal: 'Definida por la base de reglas del backend',
  }));
};

export const obtenerMembresias = async (_puntos = 501, signal?: AbortSignal): Promise<MembresiasResponse> => {
  const respuesta = await peticion<MembresiasBackend>('/api/membresias', { signal });
  const { consumo, personas, hora, salida } = respuesta.variables;
  return {
    variables: {
      potencia: {
        unidad: consumo.unidad,
        universo: consumo.x,
        etiquetas: {
          baja: consumo.conjuntos.bajo,
          media: consumo.conjuntos.medio,
          alta: consumo.conjuntos.alto,
        },
      },
      ocupantes: {
        unidad: personas.unidad,
        universo: personas.x,
        etiquetas: personas.conjuntos as MembresiasResponse['variables']['ocupantes']['etiquetas'],
      },
      bloque: {
        unidad: hora.unidad,
        universo: hora.x,
        etiquetas: hora.conjuntos as MembresiasResponse['variables']['bloque']['etiquetas'],
      },
      ipa: {
        unidad: salida.unidad,
        universo: salida.x,
        etiquetas: salida.conjuntos as MembresiasResponse['variables']['ipa']['etiquetas'],
      },
    },
  };
};

export const healthCheck = (signal?: AbortSignal) => peticion<HealthResponse>('/health', { signal });

/* ------------------------------ URLs de descarga (no incrustadas) ------------------------------ */

export function urlGraficoAgregacion(params: {
  potencia_w: number;
  ocupantes: number;
  hora: number;
}): string {
  const q = new URLSearchParams({
    consumo_w: String(params.potencia_w),
    personas: String(params.ocupantes),
    hora: String(params.hora),
  });
  return `${API_URL}/api/grafico/agregacion?${q.toString()}`;
}

export function urlGraficoMembresias(n: 1 | 2 | 3): string {
  return `${API_URL}/api/grafico/membresias/${n}`;
}
