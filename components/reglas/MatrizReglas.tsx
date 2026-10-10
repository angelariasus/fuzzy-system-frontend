'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { NIVEL_POR_SALIDA } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatGrado } from '@/lib/format';
import type { ReglaItem } from '@/types/api';

interface Props {
  reglas: ReglaItem[];
  /** Reglas activadas por la entrada de la URL: código a grado de activación. */
  activadas: Record<string, number>;
  /** Regla pedida con ?regla=R20: se resalta y se hace scroll hasta ella. */
  resaltada: string | null;
}

/**
 * Matriz de la base de reglas: 12 filas (potencia por ocupantes) y 3 columnas (bloque horario).
 * Filas y columnas salen de los datos de /api/reglas en su orden de aparición: no hay nada
 * de la base de reglas escrito a mano en el frontend.
 */
export function MatrizReglas({ reglas, activadas, resaltada }: Props) {
  const { filas, columnas, mapa } = useMemo(() => {
    const filasVistas: { clave: string; potencia: string; ocupantes: string }[] = [];
    const columnasVistas: string[] = [];
    const celdas = new Map<string, ReglaItem>();
    for (const r of reglas) {
      const clave = `${r.potencia}|${r.ocupantes}`;
      if (!filasVistas.some((f) => f.clave === clave)) filasVistas.push({ clave, potencia: r.potencia, ocupantes: r.ocupantes });
      if (!columnasVistas.includes(r.bloque)) columnasVistas.push(r.bloque);
      celdas.set(`${clave}|${r.bloque}`, r);
    }
    return { filas: filasVistas, columnas: columnasVistas, mapa: celdas };
  }, [reglas]);

  return (
    <div className="scroll-panel overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">Matriz de reglas por potencia, ocupantes y bloque horario</caption>
        <thead>
          <tr>
            <th scope="col" className="etiqueta px-2 py-1 text-left">Potencia</th>
            <th scope="col" className="etiqueta px-2 py-1 text-left">Ocupantes</th>
            {columnas.map((c) => (
              <th key={c} scope="col" className="etiqueta px-2 py-1 text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.clave}>
              <th scope="row" className="px-2 py-1 text-left font-medium text-ink">{fila.potencia}</th>
              <td className="px-2 py-1 text-ink-muted">{fila.ocupantes}</td>
              {columnas.map((bloque) => {
                const regla = mapa.get(`${fila.clave}|${bloque}`);
                if (!regla) return <td key={bloque} />;
                const alpha = activadas[regla.regla];
                const activa = alpha !== undefined && alpha > 0;
                const marcada = resaltada === regla.regla;
                return (
                  <td key={bloque} className="p-0">
                    <Tooltip contenido={<span className="num">{`rP + rO + rH = ${regla.calculo_ordinal}`}</span>} className="w-full">
                      <button
                        type="button"
                        id={`regla-${regla.regla}`}
                        className={cn(
                          'w-full rounded-md border bg-surface/80 px-2 py-1.5 text-left transition-colors duration-150 hover:border-border-strong',
                          activa || marcada ? 'border-accent ring-1 ring-accent' : 'border-border',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="num text-xs text-ink-muted">{regla.regla}</span>
                          <Badge nivel={NIVEL_POR_SALIDA[regla.salida] ?? 1}>{regla.salida}</Badge>
                        </span>
                        {activa ? (
                          <span className="mt-1 block text-xs text-ink-muted">
                            Grado de activación <span className="num text-ink">{formatGrado(alpha)}</span>
                          </span>
                        ) : null}
                      </button>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
