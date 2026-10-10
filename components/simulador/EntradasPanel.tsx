'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { LIMITES } from '@/lib/constants';
import { decimalAHora, formatNumero } from '@/lib/format';
import { formularioSchema, horaSchema, ocupantesSchema, potenciaSchema } from '@/lib/schemas';
import type { Entradas } from '@/types/api';

interface Formulario {
  potencia: string;
  ocupantes: string;
  hora: string;
}

type Campo = keyof Formulario;

export interface CasoSolicitado {
  entradas: Entradas;
  /** Cambia en cada solicitud para aplicar el caso aunque sea el mismo. */
  nonce: number;
}

interface EntradasPanelProps {
  valoresIniciales: Entradas;
  /** Recibe las entradas válidas, o null mientras el formulario tenga errores. */
  onEntradas: (entradas: Entradas | null) => void;
  /** Se llama cuando la persona mueve un control a mano (no en tweens de casos de ejemplo). */
  onInteraccion?: () => void;
  casoSolicitado?: CasoSolicitado | null;
  /** Errores 422 inesperados del backend, por nombre de campo del backend. */
  erroresServidor?: Record<string, string>;
}

const CAMPO_BACKEND: Record<string, Campo> = {
  potencia_w: 'potencia',
  ocupantes: 'ocupantes',
  hora: 'hora',
};

/** Texto con coma decimal y sin ceros sobrantes: 3 a "3", 2.5 a "2,5". */
const textoNumero = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

const AYUDA: Record<Campo, string> = {
  potencia: 'Universo del caso de estudio: vivienda de más de 90 a 150 m² sin información específica de cargas.',
  ocupantes: 'Admite promedios; el caso de estudio llega hasta 6.',
  hora: 'La hora es circular: 24:00 equivale a 00:00. Acepta 14:30 o 14,5.',
};

/**
 * Tres controles con input de texto + slider sincronizados (react-hook-form + zod).
 * El formulario guarda texto crudo para aceptar coma decimal y HH:MM; el esquema zod lo
 * convierte y valida. Un valor fuera de rango es un error visible, nunca se recorta.
 */
export function EntradasPanel({
  valoresIniciales,
  onEntradas,
  onInteraccion,
  casoSolicitado,
  erroresServidor,
}: EntradasPanelProps) {
  const {
    register,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<Formulario>({
    // El resolver valida texto y entrega números; el cast evita mezclar tipos de entrada y salida de zod.
    resolver: zodResolver(formularioSchema) as unknown as Resolver<Formulario>,
    mode: 'onChange',
    defaultValues: {
      potencia: textoNumero(valoresIniciales.potencia_w),
      ocupantes: textoNumero(valoresIniciales.ocupantes),
      hora: decimalAHora(valoresIniciales.hora),
    },
  });

  const potencia = watch('potencia');
  const ocupantes = watch('ocupantes');
  const hora = watch('hora');

  const parseadas = useMemo(() => {
    const p = potenciaSchema.safeParse(potencia);
    const o = ocupantesSchema.safeParse(ocupantes);
    const h = horaSchema.safeParse(hora);
    return {
      p: p.success ? (p.data as number) : null,
      o: o.success ? (o.data as number) : null,
      h: h.success ? (h.data as number) : null,
    };
  }, [potencia, ocupantes, hora]);

  // Último valor válido de cada control: el slider se queda ahí mientras el texto es inválido.
  const ultimo = useRef<Entradas>({ ...valoresIniciales });
  if (parseadas.p !== null) ultimo.current.potencia_w = parseadas.p;
  if (parseadas.o !== null) ultimo.current.ocupantes = parseadas.o;
  if (parseadas.h !== null) ultimo.current.hora = parseadas.h;

  const entradasValidas = useMemo<Entradas | null>(
    () =>
      parseadas.p !== null && parseadas.o !== null && parseadas.h !== null
        ? { potencia_w: parseadas.p, ocupantes: parseadas.o, hora: parseadas.h }
        : null,
    [parseadas],
  );

  useEffect(() => {
    onEntradas(entradasValidas);
  }, [entradasValidas, onEntradas]);

  // 422 inesperado del backend: se asigna a su campo.
  useEffect(() => {
    if (!erroresServidor) return;
    for (const [campoBackend, mensaje] of Object.entries(erroresServidor)) {
      const campo = CAMPO_BACKEND[campoBackend];
      if (campo) setError(campo, { type: 'server', message: mensaje });
    }
  }, [erroresServidor, setError]);

  // Los casos de ejemplo se aplican de inmediato: los inputs no animan sus valores.
  const nonceAplicado = useRef<number | null>(null);
  useEffect(() => {
    if (!casoSolicitado || nonceAplicado.current === casoSolicitado.nonce) return;
    nonceAplicado.current = casoSolicitado.nonce;
    const destino = casoSolicitado.entradas;
    const opciones = { shouldValidate: true, shouldDirty: true };
    setValue('potencia', textoNumero(destino.potencia_w), opciones);
    setValue('ocupantes', textoNumero(destino.ocupantes), opciones);
    setValue('hora', decimalAHora(destino.hora), opciones);
  }, [casoSolicitado, setValue]);

  const desdeSlider = (campo: Campo, texto: string) => {
    onInteraccion?.();
    setValue(campo, texto, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6"
      aria-label="Entradas del simulador"
    >
      <Control
        campo="potencia"
        etiqueta="Potencia instantánea"
        unidad="W"
        error={errors.potencia?.message}
        ayuda={AYUDA.potencia}
        input={
          <Input
            id="potencia"
            mono
            inputMode="decimal"
            autoComplete="off"
            className="w-28 text-right"
            invalido={Boolean(errors.potencia)}
            aria-describedby="potencia-ayuda potencia-error"
            {...register('potencia', { onChange: () => onInteraccion?.() })}
          />
        }
        slider={
          <Slider
            aria-label="Potencia instantánea (deslizador)"
            value={ultimo.current.potencia_w}
            min={LIMITES.potencia_w.min}
            max={LIMITES.potencia_w.max}
            step={LIMITES.potencia_w.paso}
            valueText={`${formatNumero(ultimo.current.potencia_w, 0)} vatios`}
            onChange={(v) => desdeSlider('potencia', textoNumero(v))}
          />
        }
      />
      <Control
        campo="ocupantes"
        etiqueta="Ocupantes"
        unidad="personas"
        error={errors.ocupantes?.message}
        ayuda={AYUDA.ocupantes}
        input={
          <Input
            id="ocupantes"
            mono
            inputMode="decimal"
            autoComplete="off"
            className="w-28 text-right"
            invalido={Boolean(errors.ocupantes)}
            aria-describedby="ocupantes-ayuda ocupantes-error"
            {...register('ocupantes', { onChange: () => onInteraccion?.() })}
          />
        }
        slider={
          <Slider
            aria-label="Ocupantes (deslizador)"
            value={ultimo.current.ocupantes}
            min={LIMITES.ocupantes.min}
            max={LIMITES.ocupantes.max}
            step={LIMITES.ocupantes.paso}
            valueText={`${formatNumero(ultimo.current.ocupantes, 1)} ocupantes`}
            onChange={(v) => desdeSlider('ocupantes', textoNumero(v))}
          />
        }
      />
      <Control
        campo="hora"
        etiqueta="Hora del día"
        unidad="HH:MM"
        error={errors.hora?.message}
        ayuda={AYUDA.hora}
        input={
          <Input
            id="hora"
            mono
            inputMode="text"
            autoComplete="off"
            className="w-28 text-right"
            invalido={Boolean(errors.hora)}
            aria-describedby="hora-ayuda hora-error"
            {...register('hora', { onChange: () => onInteraccion?.() })}
          />
        }
        slider={
          <Slider
            aria-label="Hora del día (deslizador)"
            value={ultimo.current.hora}
            min={LIMITES.hora.min}
            max={LIMITES.hora.max}
            step={LIMITES.hora.paso}
            valueText={decimalAHora(ultimo.current.hora)}
            onChange={(v) => desdeSlider('hora', decimalAHora(v))}
          />
        }
      />
    </form>
  );
}

function Control({
  campo,
  etiqueta,
  unidad,
  error,
  ayuda,
  input,
  slider,
}: {
  campo: Campo;
  etiqueta: string;
  unidad: string;
  error?: string;
  ayuda: string;
  input: ReactNode;
  slider: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={campo} className="text-sm font-medium text-ink">
          {etiqueta}
          <span className="ml-1.5 text-xs font-normal text-ink-faint">{unidad}</span>
        </label>
        {input}
      </div>
      <div className="mt-1">{slider}</div>
      <p id={`${campo}-ayuda`} className="text-xs text-ink-faint">
        {ayuda}
      </p>
      {/* Reserva el alto de una línea para que el error no empuje el resto del panel al aparecer. */}
      <p id={`${campo}-error`} role="alert" className="mt-1 min-h-4 text-xs text-danger">
        {error ?? ''}
      </p>
    </div>
  );
}
