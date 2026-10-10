'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { COLOR_CURVA } from '@/lib/constants';
import { formatGrado, formatNumero } from '@/lib/format';

export interface EtiquetaCurva {
  clave: string;
  texto: string;
  grado: number;
}

interface CurvasMembresiaProps {
  /** Nombre de la variable, para el texto alternativo. */
  nombre: string;
  universo: number[];
  curvas: Record<string, number[]>;
  etiquetas: EtiquetaCurva[];
  /** Valor de entrada: línea vertical y puntos sobre cada curva. */
  valor: number;
  dominio: [number, number];
  ticks: number[];
  unidad: string;
}

const TICK_EJE = {
  fontSize: 12,
  fill: 'rgb(var(--ink-faint))',
};

/** Índice central de la meseta máxima de la curva: ahí se rotula directamente sobre ella. */
function indicePico(valores: number[]): number {
  const max = Math.max(...valores);
  const picos: number[] = [];
  valores.forEach((v, i) => {
    if (v >= max - 1e-9) picos.push(i);
  });
  return picos[Math.floor(picos.length / 2)] ?? 0;
}

/**
 * Gráfico pequeño de funciones de pertenencia con la entrada marcada. Las etiquetas se rotulan
 * sobre las curvas (no dependen del color ni de una leyenda). Sin animación: se actualiza con
 * cada resultado y el marcador del medidor es el protagonista del evento.
 */
export function CurvasMembresia({ nombre, universo, curvas, etiquetas, valor, dominio, ticks, unidad }: CurvasMembresiaProps) {
  // Las claves se estabilizan por su texto para que los useMemo dependan de valores primitivos.
  const clavesTexto = etiquetas.map((e) => e.clave).join('|');
  const claves = useMemo(() => clavesTexto.split('|'), [clavesTexto]);

  const datos = useMemo(
    () =>
      universo.map((x, i) => {
        const fila: Record<string, number> = { x };
        for (const k of claves) fila[k] = curvas[k]?.[i] ?? 0;
        return fila;
      }),
    [universo, curvas, claves],
  );

  const picos = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const k of claves) mapa[k] = indicePico(curvas[k] ?? [0]);
    return mapa;
  }, [curvas, claves]);

  const descripcion = `Funciones de pertenencia de ${nombre}. Valor de entrada ${formatNumero(valor, 2)} ${unidad}. ${etiquetas
    .map((e) => `${e.texto}: ${formatGrado(e.grado)}`)
    .join('; ')}.`;

  return (
    <div>
      <div role="img" aria-label={descripcion} className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={datos} margin={{ top: 16, right: 14, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="rgb(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={dominio}
              ticks={ticks}
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
            {etiquetas.map((e, i) => {
              const activa = e.grado > 0;
              return (
                <Line
                  key={e.clave}
                  dataKey={e.clave}
                  type="linear"
                  dot={false}
                  activeDot={false}
                  stroke={COLOR_CURVA[i % COLOR_CURVA.length]}
                  strokeWidth={activa ? 2 : 1.25}
                  strokeOpacity={activa ? 1 : 0.35}
                  isAnimationActive={false}
                  label={(props: { x?: number; y?: number; index?: number }) => {
                    const indice = props.index ?? -1;
                    if (indice !== picos[e.clave] || props.x === undefined || props.y === undefined) {
                      return <g key={`${e.clave}-${indice}`} />;
                    }
                    const proporcion = indice / Math.max(universo.length - 1, 1);
                    const ancla = proporcion < 0.12 ? 'start' : proporcion > 0.88 ? 'end' : 'middle';
                    return (
                      <text
                        key={`${e.clave}-${indice}`}
                        x={props.x}
                        y={props.y}
                        dy={-6}
                        textAnchor={ancla}
                        fontSize={12}
                        fill="rgb(var(--ink-muted))"
                        fillOpacity={activa ? 1 : 0.6}
                      >
                        {e.texto}
                      </text>
                    );
                  }}
                />
              );
            })}
            <ReferenceLine x={valor} stroke="rgb(var(--ink))" strokeDasharray="4 3" strokeOpacity={0.7} />
            {etiquetas.map((e, i) =>
              e.grado > 0 ? (
                <ReferenceDot
                  key={`punto-${e.clave}`}
                  x={valor}
                  y={e.grado}
                  r={4}
                  fill={COLOR_CURVA[i % COLOR_CURVA.length]}
                  stroke="rgb(var(--surface-raised))"
                  strokeWidth={1.5}
                  isFront
                  label={{
                    value: formatGrado(e.grado),
                    position: valor > (dominio[0] + dominio[1]) / 2 ? 'left' : 'right',
                    fontSize: 12,
                    fill: 'rgb(var(--ink))',
                  }}
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Tabla alternativa para lectores de pantalla. */}
      <table className="sr-only">
        <caption>{`Grados de pertenencia de ${nombre}`}</caption>
        <thead>
          <tr>
            <th scope="col">Etiqueta</th>
            <th scope="col">Grado</th>
          </tr>
        </thead>
        <tbody>
          {etiquetas.map((e) => (
            <tr key={e.clave}>
              <th scope="row">{e.texto}</th>
              <td>{formatGrado(e.grado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
