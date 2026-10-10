'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { DosPaneles } from '@/components/layout/Paneles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LinearProgress } from '@/components/ui/LinearProgress';
import { Skeleton } from '@/components/ui/Skeleton';
import { GrupoTiles } from '@/components/ui/Tile';
import { useBarrido } from '@/hooks/useBarrido';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRetraso } from '@/hooks/useRetraso';
import { DEBOUNCE_MS, LIMITES, NOMBRE_VARIABLE, RETRASO_BARRA_CARGA_MS, VALORES_POR_DEFECTO } from '@/lib/constants';
import { notificarError } from '@/lib/errores';
import { decimalAHora, formatIPA, formatNumero, parseHora, parseNumeroLocal } from '@/lib/format';
import { barridoSchema, horaSchema, ocupantesSchema, potenciaSchema, universoDe } from '@/lib/schemas';
import { rutaSimulador } from '@/lib/url-state';
import type { BarridoRequest, Entradas, PuntoBarrido, VariableBarrido } from '@/types/api';
import { GraficoBarrido } from './GraficoBarrido';

const VARIABLES: VariableBarrido[] = ['potencia_w', 'ocupantes', 'hora'];
const OPCIONES = VARIABLES.map((v) => ({
  valor: v,
  titulo: NOMBRE_VARIABLE[v],
  descripcion: `${universoDe(v).min} a ${universoDe(v).max}`,
}));

const SCHEMA_FIJO = { potencia_w: potenciaSchema, ocupantes: ocupantesSchema, hora: horaSchema } as const;

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  error,
  ancho = 'w-full',
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  ancho?: string;
}) {
  return (
    <div className={ancho}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {etiqueta}
      </label>
      <Input
        id={id}
        mono
        inputMode="decimal"
        autoComplete="off"
        value={valor}
        invalido={Boolean(error)}
        aria-describedby={`${id}-error`}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
      <p id={`${id}-error`} role="alert" className="mt-1 min-h-4 text-xs text-danger">
        {error ?? ''}
      </p>
    </div>
  );
}

export function ExplorarView() {
  const router = useRouter();
  const [variable, setVariable] = useState<VariableBarrido>('potencia_w');
  const [desde, setDesde] = useState('0');
  const [hasta, setHasta] = useState(String(LIMITES.potencia_w.max));
  const [pasos, setPasos] = useState(String(LIMITES.pasosBarrido.defecto));
  const [fijos, setFijos] = useState<Record<VariableBarrido, string>>({
    potencia_w: String(VALORES_POR_DEFECTO.potencia_w),
    ocupantes: String(VALORES_POR_DEFECTO.ocupantes),
    hora: decimalAHora(VALORES_POR_DEFECTO.hora),
  });
  const [seleccionado, setSeleccionado] = useState<PuntoBarrido | null>(null);

  const cambiarVariable = (v: VariableBarrido) => {
    const u = universoDe(v);
    setVariable(v);
    setDesde(String(u.min));
    setHasta(String(u.max));
    setSeleccionado(null);
  };

  // Valida el formulario completo con los esquemas zod; si hay errores no se hace ninguna petición.
  const { peticion, errores } = useMemo(() => {
    const err: Record<string, string> = {};
    const otras = VARIABLES.filter((v) => v !== variable);
    const fijosNum: Partial<Entradas> = {};
    for (const v of otras) {
      const r = SCHEMA_FIJO[v].safeParse(fijos[v]);
      if (r.success) fijosNum[v] = r.data as number;
      else err[v] = r.error.issues[0]?.message ?? 'Valor inválido';
    }
    const valorDesde = variable === 'hora' ? parseHora(desde) : parseNumeroLocal(desde);
    const valorHasta = variable === 'hora' ? parseHora(hasta) : parseNumeroLocal(hasta);
    const valorPasos = parseNumeroLocal(pasos);
    const candidata = { variable, desde: valorDesde, hasta: valorHasta, pasos: valorPasos, fijos: fijosNum };
    const r = barridoSchema.safeParse(candidata);
    if (!r.success) {
      for (const issue of r.error.issues) {
        const campo = String(issue.path[0]);
        if (!(campo in err)) err[campo] = issue.message;
      }
    }
    const completa = Object.keys(err).length === 0 && r.success;
    return { peticion: completa ? (candidata as BarridoRequest) : null, errores: err };
  }, [variable, desde, hasta, pasos, fijos]);

  const peticionEstable = useDebouncedValue(peticion, DEBOUNCE_MS);
  const consulta = useBarrido(peticionEstable);
  const pendiente = consulta.isFetching || peticion !== peticionEstable;
  const barra = useRetraso(pendiente, RETRASO_BARRA_CARGA_MS);

  useEffect(() => {
    if (consulta.isError) notificarError(consulta.error);
  }, [consulta.isError, consulta.error]);

  const abrirEnSimulador = () => {
    if (!seleccionado) return;
    const base: Entradas = {
      potencia_w: VALORES_POR_DEFECTO.potencia_w,
      ocupantes: VALORES_POR_DEFECTO.ocupantes,
      hora: VALORES_POR_DEFECTO.hora,
    };
    const fijosFinales = consulta.data?.fijos ?? {};
    router.push(rutaSimulador({ ...base, ...fijosFinales, [variable]: seleccionado.valor }));
  };

  const otras = VARIABLES.filter((v) => v !== variable);
  const etiquetaFijo = (v: VariableBarrido) =>
    `${NOMBRE_VARIABLE[v]} fija (${v === 'potencia_w' ? 'W' : v === 'hora' ? 'HH:MM' : 'personas'})`;

  const izquierda = (
    <div className="space-y-5">
      <div>
        <h2 className="etiqueta mb-2">Variable a barrer</h2>
        <GrupoTiles
          etiqueta="Variable a barrer"
          opciones={OPCIONES}
          valor={variable}
          onChange={cambiarVariable}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo id="desde" etiqueta="Desde" valor={desde} onChange={setDesde} error={errores.desde} />
        <Campo id="hasta" etiqueta="Hasta" valor={hasta} onChange={setHasta} error={errores.hasta} />
      </div>
      <Campo id="pasos" etiqueta="Pasos (2 a 500)" valor={pasos} onChange={setPasos} error={errores.pasos} />
      <div>
        <h2 className="etiqueta mb-2">Valores fijos</h2>
        <div className="space-y-1">
          {otras.map((v) => (
            <Campo
              key={v}
              id={`fijo-${v}`}
              etiqueta={etiquetaFijo(v)}
              valor={fijos[v]}
              onChange={(texto) => setFijos((f) => ({ ...f, [v]: texto }))}
              error={errores[v]}
            />
          ))}
        </div>
      </div>
    </div>
  );

  let contenido;
  if (!consulta.data && consulta.isError) {
    contenido = <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  } else if (!consulta.data && peticionEstable === null) {
    contenido = (
      <EstadoVacio titulo="Corrige los valores para ver la curva">
        Hay campos con errores en el panel de la izquierda. No se envía ninguna petición hasta que sean válidos.
      </EstadoVacio>
    );
  } else if (!consulta.data) {
    contenido = <Skeleton className="h-96 w-full" />;
  } else {
    contenido = (
      <GraficoBarrido datos={consulta.data} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
    );
  }

  return (
    <DosPaneles
      izquierda={izquierda}
      derecha={
        <>
          <LinearProgress visible={barra} />
          <Card
            titulo="Índice de prioridad de ahorro frente a la variable barrida"
            acciones={
              <Button onClick={abrirEnSimulador} disabled={!seleccionado} className="h-9">
                Abrir en el simulador
              </Button>
            }
          >
            <p className="mb-3 text-sm text-ink-muted">
              A diferencia de un umbral rígido, la salida cambia de forma gradual al mover la entrada. Pulsa un punto de
              la curva para seleccionarlo y abrirlo en el simulador.
            </p>
            {contenido}
            {seleccionado ? (
              <p className="mt-3 text-xs text-ink-muted">
                Punto seleccionado: <span className="num text-ink">{variable === 'hora' ? decimalAHora(seleccionado.valor) : formatNumero(seleccionado.valor, Number.isInteger(seleccionado.valor) ? 0 : 2)}</span>
                {' '}con IPA <span className="num text-ink">{formatIPA(seleccionado.ipa)}</span> ({seleccionado.interpretacion}).
              </p>
            ) : null}
          </Card>
        </>
      }
    />
  );
}
