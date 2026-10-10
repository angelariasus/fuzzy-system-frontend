import { z } from 'zod';
import { LIMITES } from '@/lib/constants';
import { parseHora, parseNumeroLocal } from '@/lib/format';
import type { VariableBarrido } from '@/types/api';

/**
 * Espejo de las restricciones del backend. Un valor fuera de rango es un error visible:
 * nunca se recorta (clamp) en silencio, igual que el backend, que responde 422.
 */

const aNumero = (v: unknown): unknown => (typeof v === 'string' ? parseNumeroLocal(v) : v);
const aHora = (v: unknown): unknown => (typeof v === 'string' ? parseHora(v) : v);

function numeroEnRango(
  preprocesar: (v: unknown) => unknown,
  min: number,
  max: number,
  msgRango: string,
  msgInvalido: string,
) {
  return z.preprocess(
    preprocesar,
    z
      .number({ invalid_type_error: msgInvalido, required_error: msgInvalido })
      .finite(msgInvalido)
      .min(min, msgRango)
      .max(max, msgRango),
  );
}

const MSG_POTENCIA = 'La potencia debe estar entre 0 y 3000 W (universo del caso de estudio)';
const MSG_OCUPANTES = 'Los ocupantes deben estar entre 0 y 6 (universo del caso de estudio)';
const MSG_HORA = 'La hora debe estar entre 00:00 y 24:00 (use HH:MM o un decimal como 14,5)';

export const potenciaSchema = numeroEnRango(
  aNumero,
  LIMITES.potencia_w.min,
  LIMITES.potencia_w.max,
  MSG_POTENCIA,
  'Ingresa la potencia como un número, por ejemplo 1900',
);
export const ocupantesSchema = numeroEnRango(
  aNumero,
  LIMITES.ocupantes.min,
  LIMITES.ocupantes.max,
  MSG_OCUPANTES,
  'Ingresa los ocupantes como un número, por ejemplo 3',
);
export const horaSchema = numeroEnRango(
  aHora,
  LIMITES.hora.min,
  LIMITES.hora.max,
  MSG_HORA,
  'Ingresa la hora como HH:MM o decimal, por ejemplo 14:30 o 14,5',
);

export const idEvaluacionSchema = z
  .string()
  .max(LIMITES.idMaxCaracteres, `El id admite como máximo ${LIMITES.idMaxCaracteres} caracteres`)
  .nullish();

/** Esquema de EvaluacionRequest. */
export const evaluacionSchema = z.object({
  id_evaluacion: idEvaluacionSchema,
  potencia_w: potenciaSchema,
  ocupantes: ocupantesSchema,
  hora: horaSchema,
});
export type EvaluacionValidada = z.output<typeof evaluacionSchema>;

/** Campos del formulario del simulador (texto crudo, antes de validar). */
export const formularioSchema = z.object({
  potencia: potenciaSchema,
  ocupantes: ocupantesSchema,
  hora: horaSchema,
});

/** Fila de CSV: id opcional; hora decimal o HH:MM. */
export const filaCsvSchema = z.object({
  id: z
    .string()
    .trim()
    .max(LIMITES.idMaxCaracteres, `El id admite como máximo ${LIMITES.idMaxCaracteres} caracteres`)
    .optional(),
  potencia_w: potenciaSchema,
  ocupantes: ocupantesSchema,
  hora: horaSchema,
});
export type FilaCsvValidada = z.output<typeof filaCsvSchema>;

const UNIVERSO: Record<VariableBarrido, { min: number; max: number; nombre: string }> = {
  potencia_w: { min: LIMITES.potencia_w.min, max: LIMITES.potencia_w.max, nombre: 'potencia' },
  ocupantes: { min: LIMITES.ocupantes.min, max: LIMITES.ocupantes.max, nombre: 'ocupantes' },
  hora: { min: LIMITES.hora.min, max: LIMITES.hora.max, nombre: 'hora' },
};

export function universoDe(variable: VariableBarrido) {
  return UNIVERSO[variable];
}

/** Esquema de BarridoRequest: el rango debe caer dentro del universo de la variable y desde < hasta. */
export const barridoSchema = z
  .object({
    variable: z.enum(['potencia_w', 'ocupantes', 'hora']),
    desde: z.number({ invalid_type_error: 'Ingresa un valor numérico para "desde"' }).finite(),
    hasta: z.number({ invalid_type_error: 'Ingresa un valor numérico para "hasta"' }).finite(),
    pasos: z
      .number({ invalid_type_error: 'Ingresa un número de pasos' })
      .int('Los pasos deben ser un entero')
      .min(LIMITES.pasosBarrido.min, `Mínimo ${LIMITES.pasosBarrido.min} pasos`)
      .max(LIMITES.pasosBarrido.max, `Máximo ${LIMITES.pasosBarrido.max} pasos`),
    fijos: z.object({
      potencia_w: z.number().finite().min(0).max(3000).optional(),
      ocupantes: z.number().finite().min(0).max(6).optional(),
      hora: z.number().finite().min(0).max(24).optional(),
    }),
  })
  .superRefine((valor, ctx) => {
    const u = UNIVERSO[valor.variable];
    if (valor.desde < u.min || valor.desde > u.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['desde'],
        message: `"Desde" debe estar entre ${u.min} y ${u.max}`,
      });
    }
    if (valor.hasta < u.min || valor.hasta > u.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasta'],
        message: `"Hasta" debe estar entre ${u.min} y ${u.max}`,
      });
    }
    if (valor.desde >= valor.hasta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasta'],
        message: '"Hasta" debe ser mayor que "desde"',
      });
    }
  });
