'use client';

import { memo, useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { EnlaceBoton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EstadoError } from '@/components/EstadoError';
import { useMembresias } from '@/hooks/useMembresias';
import { urlGraficoAgregacion } from '@/lib/api';
import { calcularAgregacion } from '@/lib/agregacion';
import {
  COLOR_NIVEL,
  NIVEL_POR_CLAVE_IPA,
  ORDEN_IPA,
  TEXTO_POR_CLAVE_IPA,
} from '@/lib/constants';
import { formatGrado, formatIPA, formatNumero } from '@/lib/format';
import type { Entradas, ReglaActivada } from '@/types/api';

/*
 * AVISO: este componente NO es una segunda implementación del motor difuso.
 * El IPA (y por tanto el centroide que se rotula) es el `ipa` que devuelve el backend; las
 * reglas activadas y sus grados de activación también. Aquí solo se combinan, para DIBUJAR,
 * las curvas de salida de /api/membresias con esos grados: recorte de cada conjunto de salida
 * y máximo punto a punto (ver lib/agregacion.ts y tests/agregacion.test.ts, que comprueba que
 * el dibujo es coherente con el centroide oficial).
 */

const TICK_EJE = {
  fontSize: 12,
  fill: 'rgb(var(--ink-faint))',
};

interface Props {
  ipa: number;
  reglas: ReglaActivada[];
  entradas: Entradas;
}

export const AgregacionChart = memo(function AgregacionChart({ ipa, reglas, entradas }: Props) {
  const membresias = useMembresias();

  const agregacion = useMemo(
    () => (membresias.data ? calcularAgregacion(membresias.data.variables.ipa, reglas) : null),
    [membresias.data, reglas],
  );

  const datos = useMemo(() => {
    if (!agregacion) return [];
    return agregacion.universo.map((x, i) => {
      const fila: Record<string, number> = { x, agregado: agregacion.agregado[i] };
      for (const k of ORDEN_IPA) {
        fila[`curva_${k}`] = agregacion.curvas[k][i];
        fila[`recorte_${k}`] = agregacion.recortes[k][i];
      }
      return fila;
    });
  }, [agregacion]);

  const accion = (
    <EnlaceBoton
      href={urlGraficoAgregacion(entradas)}
      target="_blank"
      rel="noopener noreferrer"
      className="h-9"
    >
      Descargar figura (PNG)
    </EnlaceBoton>
  );

  if (membresias.isPending) {
    return (
      <Card titulo="Agregación y centroide">
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }
  if (membresias.isError || !agregacion) {
    return (
      <Card titulo="Agregación y centroide">
        <EstadoError
          error={membresias.error}
          titulo="No se pudieron cargar las funciones de salida"
          onReintentar={() => void membresias.refetch()}
        />
      </Card>
    );
  }

  const activas = ORDEN_IPA.filter((k) => agregacion.alphaPorSalida[k] > 0);
  const descripcion = `Conjunto agregado de salida. Centroide en ${formatIPA(ipa)} puntos. ${activas
    .map((k) => `${TEXTO_POR_CLAVE_IPA[k]} recortado a ${formatGrado(agregacion.alphaPorSalida[k])}`)
    .join('; ')}.`;

  return (
    <Card titulo="Agregación y centroide" acciones={accion}>
      <p className="mb-3 text-xs text-ink-muted">
        Cada conjunto de salida se recorta al mayor grado de activación de sus reglas; el contorno es el máximo punto a
        punto. El centroide del conjunto agregado es el IPA que calcula el backend.
      </p>
      <div role="img" aria-label={descripcion} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={datos} margin={{ top: 24, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="rgb(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={TICK_EJE}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--border))' }}
              allowDataOverflow
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              tick={TICK_EJE}
              tickFormatter={(v: number) => formatNumero(v, 1)}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            {/* (b) conjuntos recortados, rellenos con la rampa de niveles */}
            {ORDEN_IPA.map((k) =>
              agregacion.alphaPorSalida[k] > 0 ? (
                <Area
                  key={`area-${k}`}
                  dataKey={`recorte_${k}`}
                  type="linear"
                  stroke="none"
                  fill={COLOR_NIVEL[NIVEL_POR_CLAVE_IPA[k]]}
                  fillOpacity={0.4}
                  isAnimationActive={false}
                  activeDot={false}
                />
              ) : null,
            )}
            {/* (a) las 5 etiquetas de salida en trazo tenue, rotuladas sobre la curva */}
            {ORDEN_IPA.map((k) => (
              <Line
                key={`curva-${k}`}
                dataKey={`curva_${k}`}
                type="linear"
                dot={false}
                activeDot={false}
                stroke="rgb(var(--ink-faint))"
                strokeOpacity={0.45}
                strokeWidth={1}
                isAnimationActive={false}
                label={(props: { x?: number; y?: number; index?: number }) => {
                  const pico = Math.round(((NIVEL_POR_CLAVE_IPA[k] - 1) / 4) * (agregacion.universo.length - 1));
                  if (props.index !== pico || props.x === undefined || props.y === undefined) {
                    return <g key={`${k}-${props.index}`} />;
                  }
                  const ancla = NIVEL_POR_CLAVE_IPA[k] === 1 ? 'start' : NIVEL_POR_CLAVE_IPA[k] === 5 ? 'end' : 'middle';
                  return (
                    <text
                      key={`${k}-${props.index}`}
                      x={props.x}
                      y={props.y}
                      dy={-6}
                      textAnchor={ancla}
                      fontSize={12}
                      fill="rgb(var(--ink-muted))"
                    >
                      {TEXTO_POR_CLAVE_IPA[k]}
                    </text>
                  );
                }}
              />
            ))}
            {/* (c) contorno del conjunto agregado */}
            <Line
              dataKey="agregado"
              type="linear"
              dot={false}
              activeDot={false}
              stroke="rgb(var(--ink))"
              strokeWidth={2}
              isAnimationActive={false}
            />
            {/* (d) centroide: el ipa del backend */}
            <ReferenceLine
              x={ipa}
              stroke="rgb(var(--accent))"
              strokeWidth={2}
              label={{
                value: `Centroide ${formatIPA(ipa)}`,
                position: 'top',
                fontSize: 12,
                fill: 'rgb(var(--ink))',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Recortes de los conjuntos de salida</caption>
        <thead>
          <tr>
            <th scope="col">Salida</th>
            <th scope="col">Recorte</th>
          </tr>
        </thead>
        <tbody>
          {activas.map((k) => (
            <tr key={k}>
              <th scope="row">{TEXTO_POR_CLAVE_IPA[k]}</th>
              <td>{formatGrado(agregacion.alphaPorSalida[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
});
