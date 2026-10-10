'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BANDAS, COLOR_NIVEL } from '@/lib/constants';
import { decimalAHora, formatIPA, formatNumero } from '@/lib/format';
import type { BarridoResponse, PuntoBarrido, VariableBarrido } from '@/types/api';

const TICK_EJE = {
  fontSize: 12,
  fill: 'rgb(var(--ink-faint))',
};

function formatoValor(variable: VariableBarrido, valor: number): string {
  if (variable === 'hora') return decimalAHora(valor);
  return formatNumero(valor, Number.isInteger(valor) ? 0 : 2);
}

interface PropsTooltip {
  active?: boolean;
  payload?: { payload: PuntoBarrido }[];
  variable: VariableBarrido;
}

function TooltipBarrido({ active, payload, variable }: PropsTooltip) {
  const punto = active ? payload?.[0]?.payload : undefined;
  if (!punto) return null;
  return (
    <div className="rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-xs text-ink shadow-popover">
      <p>
        Valor: <span className="num">{formatoValor(variable, punto.valor)}</span>
      </p>
      <p>
        IPA: <span className="num">{formatIPA(punto.ipa)}</span>
      </p>
      <p>{punto.interpretacion}</p>
    </div>
  );
}

interface Props {
  datos: BarridoResponse;
  seleccionado: PuntoBarrido | null;
  onSeleccionar: (punto: PuntoBarrido) => void;
}

/**
 * Curva del IPA sobre las 5 bandas de interpretación. No se afirma monotonía: el sistema solo
 * garantiza la monotonía a nivel de las etiquetas de las reglas, no del valor continuo.
 */
export function GraficoBarrido({ datos, seleccionado, onSeleccionar }: Props) {
  const reducido = useReducedMotion();
  const { variable, puntos } = datos;
  const minX = puntos[0]?.valor ?? 0;
  const maxX = puntos[puntos.length - 1]?.valor ?? 1;
  // La curva aparece con un fade de ~400 ms al llegar resultados nuevos.
  const clave = `${variable}|${minX}|${maxX}|${puntos.length}|${JSON.stringify(datos.fijos)}`;

  const descripcion = `Índice de prioridad de ahorro frente a ${variable === 'potencia_w' ? 'la potencia' : variable === 'hora' ? 'la hora' : 'los ocupantes'}, de ${formatoValor(variable, minX)} a ${formatoValor(variable, maxX)}. IPA mínimo ${formatIPA(Math.min(...puntos.map((p) => p.ipa)))}, máximo ${formatIPA(Math.max(...puntos.map((p) => p.ipa)))}.`;

  return (
    <motion.div
      key={clave}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducido ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div role="img" aria-label={descripcion} className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            data={puntos}
            margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
            onClick={(estado: { activePayload?: { payload: PuntoBarrido }[] }) => {
              const punto = estado?.activePayload?.[0]?.payload;
              if (punto) onSeleccionar(punto);
            }}
          >
            <CartesianGrid stroke="rgb(var(--border) / 0.5)" vertical={false} />
            {BANDAS.map((b) => (
              <ReferenceArea
                key={b.nivel}
                y1={b.desde}
                y2={b.hasta}
                fill={COLOR_NIVEL[b.nivel]}
                fillOpacity={0.14}
                stroke="none"
                ifOverflow="visible"
                label={{
                  value: b.nombre,
                  position: 'insideTopRight',
                  fontSize: 12,
                  fill: 'rgb(var(--ink-muted))',
                }}
              />
            ))}
            <XAxis
              dataKey="valor"
              type="number"
              domain={[minX, maxX]}
              tick={TICK_EJE}
              tickFormatter={(v: number) => formatoValor(variable, v)}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--border))' }}
              allowDataOverflow
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={TICK_EJE}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={<TooltipBarrido variable={variable} />}
              cursor={{ stroke: 'rgb(var(--ink-faint))', strokeDasharray: '4 3' }}
              isAnimationActive={false}
            />
            <Line
              dataKey="ipa"
              type="monotone"
              dot={false}
              activeDot={{ r: 4, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--surface-raised))' }}
              stroke="rgb(var(--accent))"
              strokeWidth={2.5}
              isAnimationActive={false}
            />
            {seleccionado ? (
              <ReferenceDot
                x={seleccionado.valor}
                y={seleccionado.ipa}
                r={5}
                fill="rgb(var(--ink))"
                stroke="rgb(var(--surface-raised))"
                strokeWidth={2}
                isFront
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
