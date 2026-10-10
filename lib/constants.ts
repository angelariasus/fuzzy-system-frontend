import type {
  EtiquetaBloque,
  EtiquetaIPA,
  EtiquetaOcupantes,
  EtiquetaPotencia,
  Entradas,
  NivelIPA,
  VariableBarrido,
} from '@/types/api';

/**
 * Curva de easing única de todo el proyecto (ease-out fuerte). Se define una sola vez
 * para que ninguna animación use una curva distinta por descuido.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Límites del dominio. Replican las restricciones del backend (el backend rechaza con 422, nunca recorta). */
export const LIMITES = {
  potencia_w: { min: 0, max: 3000, paso: 10, unidad: 'W' },
  ocupantes: { min: 0, max: 6, paso: 0.5, unidad: 'personas' },
  hora: { min: 0, max: 24, paso: 0.25, unidad: 'h' },
  idMaxCaracteres: 100,
  filasLote: 1000,
  pasosBarrido: { min: 2, max: 500, defecto: 100 },
} as const;

export const VALORES_POR_DEFECTO: Entradas = { potencia_w: 1900, ocupantes: 3, hora: 12 };

export const DEBOUNCE_MS = 250;
/** La barra lineal de carga solo aparece si la petición supera este tiempo (evita parpadeo). */
export const RETRASO_BARRA_CARGA_MS = 300;
export const TIMEOUT_API_MS = 10_000;
export const PUNTOS_MEMBRESIAS = 501;

/** Bandas de interpretación (Tabla 9). Intervalos cerrados a la izquierda, abiertos a la derecha, salvo la última. */
export interface Banda {
  nivel: 1 | 2 | 3 | 4 | 5;
  nombre: NivelIPA;
  desde: number;
  hasta: number;
}

export const BANDAS: readonly Banda[] = [
  { nivel: 1, nombre: 'Sin necesidad de ahorro', desde: 0, hasta: 20 },
  { nivel: 2, nombre: 'Ahorro leve', desde: 20, hasta: 40 },
  { nivel: 3, nombre: 'Ahorro moderado', desde: 40, hasta: 60 },
  { nivel: 4, nombre: 'Ahorro alto', desde: 60, hasta: 80 },
  { nivel: 5, nombre: 'Ahorro crítico', desde: 80, hasta: 100 },
] as const;

export type Nivel = 1 | 2 | 3 | 4 | 5;

/**
 * Clases completas (no construidas por interpolación) para que el compilador de Tailwind
 * las detecte. Todas salen de los tokens `nivel-N`.
 */
export const NIVEL_FONDO_SUAVE: Record<Nivel, string> = {
  1: 'bg-nivel-1/20',
  2: 'bg-nivel-2/20',
  3: 'bg-nivel-3/20',
  4: 'bg-nivel-4/20',
  5: 'bg-nivel-5/20',
};
export const NIVEL_PUNTO: Record<Nivel, string> = {
  1: 'bg-nivel-1',
  2: 'bg-nivel-2',
  3: 'bg-nivel-3',
  4: 'bg-nivel-4',
  5: 'bg-nivel-5',
};

/** Etiqueta de interpretación del backend a nivel 1-5. */
export const NIVEL_POR_INTERPRETACION: Record<string, Nivel> = {
  'Sin necesidad de ahorro': 1,
  'Ahorro leve': 2,
  'Ahorro moderado': 3,
  'Ahorro alto': 4,
  'Ahorro crítico': 5,
};

/** Etiqueta de salida de una regla (conjunto de salida) a nivel 1-5. */
export const NIVEL_POR_SALIDA: Record<string, Nivel> = {
  'Muy bajo': 1,
  Bajo: 2,
  Medio: 3,
  Alto: 4,
  'Muy alto': 5,
};

export const CLAVE_POR_SALIDA: Record<string, EtiquetaIPA> = {
  'Muy bajo': 'muy_bajo',
  Bajo: 'bajo',
  Medio: 'medio',
  Alto: 'alto',
  'Muy alto': 'muy_alto',
};

export const TEXTO_POR_CLAVE_IPA: Record<EtiquetaIPA, string> = {
  muy_bajo: 'Muy bajo',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  muy_alto: 'Muy alto',
};

export const ORDEN_IPA: readonly EtiquetaIPA[] = ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto'];

export const NIVEL_POR_CLAVE_IPA: Record<EtiquetaIPA, Nivel> = {
  muy_bajo: 1,
  bajo: 2,
  medio: 3,
  alto: 4,
  muy_alto: 5,
};

export const ETIQUETAS_POTENCIA: Record<EtiquetaPotencia, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};
export const ETIQUETAS_OCUPANTES: Record<EtiquetaOcupantes, string> = {
  pocas: 'Pocas',
  moderadas: 'Moderadas',
  muchas: 'Muchas',
};
export const ETIQUETAS_BLOQUE: Record<EtiquetaBloque, string> = {
  madrugada: 'Madrugada',
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
};

export const NOMBRE_VARIABLE: Record<VariableBarrido, string> = {
  potencia_w: 'Potencia instantánea',
  ocupantes: 'Ocupantes',
  hora: 'Hora del día',
};

/** Colores de las curvas de pertenencia: siempre por token, nunca hex. */
export const COLOR_CURVA = [
  'rgb(var(--curva-1))',
  'rgb(var(--curva-2))',
  'rgb(var(--curva-3))',
  'rgb(var(--curva-4))',
  'rgb(var(--curva-5))',
] as const;

export const COLOR_NIVEL: Record<Nivel, string> = {
  1: 'rgb(var(--nivel-1))',
  2: 'rgb(var(--nivel-2))',
  3: 'rgb(var(--nivel-3))',
  4: 'rgb(var(--nivel-4))',
  5: 'rgb(var(--nivel-5))',
};

/** Las 4 corridas del informe, que también están en public/casos_informe.csv. */
export interface CasoEjemplo {
  id: string;
  entradas: Entradas;
}

export const CASOS_EJEMPLO: readonly CasoEjemplo[] = [
  { id: 'caso-1', entradas: { potencia_w: 300, ocupantes: 4, hora: 12 } },
  { id: 'caso-2', entradas: { potencia_w: 1900, ocupantes: 3, hora: 12 } },
  { id: 'caso-3', entradas: { potencia_w: 1900, ocupantes: 3, hora: 19 } },
  { id: 'caso-4', entradas: { potencia_w: 2800, ocupantes: 1, hora: 2 } },
];

export const NAVEGACION = [
  { href: '/', texto: 'Simulador' },
  { href: '/explorar', texto: 'Explorar' },
  { href: '/lote', texto: 'Lote' },
  { href: '/reglas', texto: 'Reglas' },
  { href: '/acerca', texto: 'Acerca del método' },
] as const;
