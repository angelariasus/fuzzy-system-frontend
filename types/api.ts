/**
 * Tipos del contrato del backend FastAPI. Espejo exacto de la especificación:
 * si el backend cambia, este archivo es el único punto que debe actualizarse.
 */

export type NivelIPA =
  | 'Sin necesidad de ahorro'
  | 'Ahorro leve'
  | 'Ahorro moderado'
  | 'Ahorro alto'
  | 'Ahorro crítico';

export type EtiquetaPotencia = 'baja' | 'media' | 'alta';
export type EtiquetaOcupantes = 'pocas' | 'moderadas' | 'muchas';
export type EtiquetaBloque = 'madrugada' | 'manana' | 'tarde' | 'noche';
export type EtiquetaIPA = 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';

export type VariableBarrido = 'potencia_w' | 'ocupantes' | 'hora';

export interface Entradas {
  potencia_w: number;
  ocupantes: number;
  hora: number;
}

export interface EvaluacionRequest extends Entradas {
  id_evaluacion?: string | null;
}

export interface Fuzzificacion {
  potencia: Record<EtiquetaPotencia, number>;
  ocupantes: Record<EtiquetaOcupantes, number>;
  bloque: Record<EtiquetaBloque, number>;
}

export interface ReglaActivada {
  regla: string;
  potencia: string;
  ocupantes: string;
  bloque: string;
  salida: string;
  alpha: number;
  calculo: string;
}

export interface EvaluacionResponse {
  id_evaluacion: string | null;
  entradas: Entradas;
  ipa: number;
  interpretacion: NivelIPA;
  accion_sugerida: string;
  fuzzificacion: Fuzzificacion;
  reglas_activadas: ReglaActivada[];
}

export interface LoteRequest {
  evaluaciones: EvaluacionRequest[];
}

export interface LoteResponse {
  total: number;
  resultados: EvaluacionResponse[];
}

export interface BarridoRequest {
  variable: VariableBarrido;
  desde: number;
  hasta: number;
  pasos: number;
  /** Valores de las otras dos variables. */
  fijos: Partial<Entradas>;
}

export interface PuntoBarrido {
  valor: number;
  ipa: number;
  interpretacion: string;
}

export interface BarridoResponse {
  variable: VariableBarrido;
  fijos: Partial<Entradas>;
  puntos: PuntoBarrido[];
}

export interface ReglaItem {
  regla: string;
  potencia: string;
  ocupantes: string;
  bloque: string;
  salida: string;
  calculo_ordinal: string;
}

export interface VariableMembresia<E extends string = string> {
  unidad: string;
  universo: number[];
  etiquetas: Record<E, number[]>;
}

export interface MembresiasResponse {
  variables: {
    potencia: VariableMembresia<EtiquetaPotencia>;
    ocupantes: VariableMembresia<EtiquetaOcupantes>;
    bloque: VariableMembresia<EtiquetaBloque>;
    ipa: VariableMembresia<EtiquetaIPA>;
  };
}

export interface HealthResponse {
  status: 'ok' | 'error';
}

/** Error 500 del backend. */
export interface ErrorResponse {
  detail: string;
  error_code: string;
}

/** Error 422 (formato estándar de FastAPI). */
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationErrorItem[];
}
