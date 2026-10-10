'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Colapsable } from '@/components/ui/Colapsable';
import { Meter } from '@/components/ui/Meter';
import { EASE, NIVEL_POR_SALIDA } from '@/lib/constants';
import { formatGrado } from '@/lib/format';
import type { ReglaActivada } from '@/types/api';

interface Props {
  reglas: ReglaActivada[];
  /** true mientras hay una petición en curso: el Colapsable crece libre hasta que los datos se estabilizan. */
  pendiente: boolean;
  /** Escalonado de 30-50 ms por fila solo en la primera aparición de la lista. */
  escalonar: boolean;
  animarBarras: boolean;
}

const COLUMNAS = ['Regla', 'Potencia', 'Ocupantes', 'Bloque', 'Salida', 'Grado de activación', 'Cálculo'];

export const ReglasActivadasTable = memo(function ReglasActivadasTable({ reglas, pendiente, escalonar, animarBarras }: Props) {
  const reducido = useReducedMotion();
  const ordenadas = useMemo(() => [...reglas].sort((a, b) => b.alpha - a.alpha), [reglas]);
  const claveDatos = ordenadas.map((r) => `${r.regla}:${r.alpha}`).join('|');

  return (
    <Card titulo={`Reglas activadas (${ordenadas.length})`}>
      <p className="mb-3 text-xs text-ink-muted">Solo se muestran las reglas con grado de activación mayor que 0.</p>
      <Colapsable claveDatos={claveDatos} pendiente={pendiente} alturaMax={288}>
        <div className="scroll-panel overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {COLUMNAS.map((c, i) => (
                  <th key={c} scope="col" className={`etiqueta py-2 pr-3 ${i === 5 ? 'w-44' : ''}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((r, i) => {
                const nivel = NIVEL_POR_SALIDA[r.salida] ?? 1;
                return (
                  <motion.tr
                    key={r.regla}
                    initial={escalonar && !reducido ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: escalonar && !reducido ? i * 0.04 : 0 }}
                    className="border-b border-border transition-colors duration-150 hover:bg-surface-sunken"
                  >
                    <td className="py-2 pr-3">
                      <Link
                        href={`/reglas?regla=${r.regla}`}
                        className="num rounded-md font-medium text-accent underline-offset-2 hover:underline"
                      >
                        {r.regla}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-ink">{r.potencia}</td>
                    <td className="py-2 pr-3 text-ink">{r.ocupantes}</td>
                    <td className="py-2 pr-3 text-ink">{r.bloque}</td>
                    <td className="py-2 pr-3">
                      <Badge nivel={nivel}>{r.salida}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Meter
                          valor={r.alpha}
                          retraso={i * 0.05}
                          animar={animarBarras}
                          etiqueta={`Grado de activación de ${r.regla}`}
                          className="w-20"
                        />
                        <span className="num text-xs text-ink">{formatGrado(r.alpha)}</span>
                      </div>
                    </td>
                    <td className="num py-2 text-xs text-ink-muted">{r.calculo}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Colapsable>
    </Card>
  );
});
