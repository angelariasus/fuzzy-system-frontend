'use client';

import { useMemo, useState } from 'react';
import { Orden } from '@/components/icons/glifos';
import { Badge } from '@/components/ui/Badge';
import { NIVEL_POR_INTERPRETACION } from '@/lib/constants';
import { decimalAHora, formatIPA, formatNumero } from '@/lib/format';
import type { EvaluacionResponse } from '@/types/api';

type Columna = 'id' | 'ipa' | 'interpretacion';
type Direccion = 'asc' | 'desc';

/** Tabla ordenable (por id, IPA o interpretación) con cabecera fija y alto acotado con scroll interno. */
export function TablaResultados({ resultados }: { resultados: EvaluacionResponse[] }) {
  const [orden, setOrden] = useState<{ columna: Columna; direccion: Direccion }>({ columna: 'ipa', direccion: 'desc' });

  const filas = useMemo(() => {
    const copia = [...resultados];
    const signo = orden.direccion === 'asc' ? 1 : -1;
    copia.sort((a, b) => {
      if (orden.columna === 'ipa') return (a.ipa - b.ipa) * signo;
      if (orden.columna === 'interpretacion') {
        return ((NIVEL_POR_INTERPRETACION[a.interpretacion] ?? 0) - (NIVEL_POR_INTERPRETACION[b.interpretacion] ?? 0)) * signo;
      }
      return (a.id_evaluacion ?? '').localeCompare(b.id_evaluacion ?? '', 'es', { numeric: true }) * signo;
    });
    return copia;
  }, [resultados, orden]);

  const alternar = (columna: Columna) =>
    setOrden((o) =>
      o.columna === columna ? { columna, direccion: o.direccion === 'asc' ? 'desc' : 'asc' } : { columna, direccion: 'asc' },
    );

  const cabecera = (columna: Columna, texto: string, alinear = 'text-left') => (
    <th
      scope="col"
      aria-sort={orden.columna === columna ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`sticky top-0 z-10 border-b border-border bg-surface px-3 py-2 ${alinear}`}
    >
      <button
        type="button"
        onClick={() => alternar(columna)}
        className="etiqueta inline-flex items-center gap-1 rounded-md hover:text-ink"
      >
        {texto}
        <Orden size={16} direccion={orden.columna === columna ? orden.direccion : null} />
      </button>
    </th>
  );

  const cabeceraFija = (texto: string, alinear = 'text-left') => (
    <th scope="col" className={`etiqueta sticky top-0 z-10 border-b border-border bg-surface px-3 py-2 ${alinear}`}>
      {texto}
    </th>
  );

  return (
    <div className="scroll-panel max-h-[28rem] overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            {cabecera('id', 'Id')}
            {cabeceraFija('Potencia (W)', 'text-right')}
            {cabeceraFija('Ocupantes', 'text-right')}
            {cabeceraFija('Hora', 'text-right')}
            {cabecera('ipa', 'IPA', 'text-right')}
            {cabecera('interpretacion', 'Interpretación')}
            {cabeceraFija('Acción sugerida')}
          </tr>
        </thead>
        <tbody>
          {filas.map((r, i) => (
            <tr key={`${r.id_evaluacion ?? 'sin-id'}-${i}`} className="border-b border-border transition-colors duration-150 hover:bg-surface-sunken">
              <td className="num px-3 py-2 text-ink">{r.id_evaluacion ?? ''}</td>
              <td className="num px-3 py-2 text-right text-ink">{formatNumero(r.entradas.potencia_w, 0)}</td>
              <td className="num px-3 py-2 text-right text-ink">{formatNumero(r.entradas.ocupantes, 1)}</td>
              <td className="num px-3 py-2 text-right text-ink">{decimalAHora(r.entradas.hora)}</td>
              <td className="num px-3 py-2 text-right font-medium text-ink">{formatIPA(r.ipa)}</td>
              <td className="px-3 py-2">
                <Badge nivel={NIVEL_POR_INTERPRETACION[r.interpretacion] ?? 1}>{r.interpretacion}</Badge>
              </td>
              <td className="px-3 py-2 text-ink-muted">{r.accion_sugerida}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
