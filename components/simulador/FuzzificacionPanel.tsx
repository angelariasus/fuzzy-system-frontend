'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';
import { EnlaceBoton } from '@/components/ui/Button';
import { Meter } from '@/components/ui/Meter';
import { Skeleton } from '@/components/ui/Skeleton';
import { EstadoError } from '@/components/EstadoError';
import { useMembresias } from '@/hooks/useMembresias';
import { urlGraficoMembresias } from '@/lib/api';
import { COLOR_CURVA, ETIQUETAS_BLOQUE, ETIQUETAS_OCUPANTES, ETIQUETAS_POTENCIA } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatGrado, formatNumero, decimalAHora } from '@/lib/format';
import type { Entradas, Fuzzificacion } from '@/types/api';
import { CurvasMembresia, type EtiquetaCurva } from './CurvasMembresia';

interface Props {
  fuzzificacion: Fuzzificacion;
  entradas: Entradas;
  /** Las barras animan (~700 ms) solo al elegir un caso de ejemplo, no al arrastrar un slider. */
  animarBarras: boolean;
}

function etiquetasDe<K extends string>(grados: Record<K, number>, textos: Record<K, string>): EtiquetaCurva[] {
  return (Object.keys(textos) as K[]).map((k) => ({ clave: k, texto: textos[k], grado: grados[k] }));
}

export const FuzzificacionPanel = memo(function FuzzificacionPanel({ fuzzificacion, entradas, animarBarras }: Props) {
  const membresias = useMembresias();

  const acciones = (
    <div className="flex items-center gap-2" role="group" aria-label="Descargar figuras 1-3 (PNG)">
      <span className="hidden text-xs text-ink-muted sm:inline">Descargar figuras 1-3</span>
      {([1, 2, 3] as const).map((n) => (
        <EnlaceBoton
          key={n}
          href={urlGraficoMembresias(n)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Descargar figura ${n} (PNG)`}
          className="h-9 w-9 px-0"
        >
          {n}
        </EnlaceBoton>
      ))}
    </div>
  );

  if (membresias.isPending) {
    return (
      <Card titulo="Fuzzificación" acciones={acciones}>
        <div className="grid gap-4 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-40 w-full" />
              <Skeleton className="mt-3 h-24 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }
  if (membresias.isError) {
    return (
      <Card titulo="Fuzzificación">
        <EstadoError
          error={membresias.error}
          titulo="No se pudieron cargar las funciones de pertenencia"
          onReintentar={() => void membresias.refetch()}
        />
      </Card>
    );
  }

  const v = membresias.data.variables;
  const variables = [
    {
      id: 'potencia',
      nombre: 'Potencia',
      subtitulo: `${formatNumero(entradas.potencia_w, 0)} W`,
      universo: v.potencia.universo,
      curvas: v.potencia.etiquetas,
      etiquetas: etiquetasDe(fuzzificacion.potencia, ETIQUETAS_POTENCIA),
      valor: entradas.potencia_w,
      dominio: [0, 3000] as [number, number],
      ticks: [0, 600, 1200, 1800, 2400, 3000],
      unidad: 'W',
    },
    {
      id: 'ocupantes',
      nombre: 'Ocupantes',
      subtitulo: `${formatNumero(entradas.ocupantes, 1)} personas`,
      universo: v.ocupantes.universo,
      curvas: v.ocupantes.etiquetas,
      etiquetas: etiquetasDe(fuzzificacion.ocupantes, ETIQUETAS_OCUPANTES),
      valor: entradas.ocupantes,
      dominio: [0, 6] as [number, number],
      ticks: [0, 1.5, 3, 4.5, 6],
      unidad: 'personas',
    },
    {
      id: 'bloque',
      nombre: 'Hora del día',
      subtitulo: decimalAHora(entradas.hora),
      universo: v.bloque.universo,
      curvas: v.bloque.etiquetas,
      etiquetas: etiquetasDe(fuzzificacion.bloque, ETIQUETAS_BLOQUE),
      valor: entradas.hora === 24 ? 0 : entradas.hora,
      dominio: [0, 24] as [number, number],
      ticks: [0, 3, 6, 9, 12, 15, 18, 21, 24],
      unidad: 'h',
    },
  ];

  return (
    <Card titulo="Fuzzificación" acciones={acciones}>
      <p className="mb-4 text-xs text-ink-muted">
        Cada entrada pertenece a varias etiquetas a la vez, con un grado entre 0 y 1. La hora es circular:
        00:00 y 24:00 son el mismo instante.
      </p>
      <div className="grid gap-6 xl:grid-cols-3">
        {variables.map((variable) => {
          const mayor = Math.max(...variable.etiquetas.map((e) => e.grado));
          return (
            <div key={variable.id}>
              <h3 className="mb-1 flex items-baseline justify-between text-sm font-medium text-ink">
                {variable.nombre}
                <span className="num text-xs font-normal text-ink-muted">{variable.subtitulo}</span>
              </h3>
              <CurvasMembresia
                nombre={variable.nombre}
                universo={variable.universo}
                curvas={variable.curvas}
                etiquetas={variable.etiquetas}
                valor={variable.valor}
                dominio={variable.dominio}
                ticks={variable.ticks}
                unidad={variable.unidad}
              />
              <ul className="mt-3 space-y-2">
                {variable.etiquetas.map((e, i) => {
                  const esMayor = e.grado > 0 && e.grado === mayor;
                  return (
                    <li
                      key={e.clave}
                      className={cn(
                        'rounded-md px-2 py-1.5',
                        esMayor && 'ring-1 ring-accent',
                        e.grado === 0 && 'opacity-60',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 text-ink">
                          <span
                            aria-hidden="true"
                            className="h-0.5 w-3 rounded-full"
                            style={{ backgroundColor: COLOR_CURVA[i % COLOR_CURVA.length] }}
                          />
                          {e.texto}
                        </span>
                        <span className="num text-ink">{formatGrado(e.grado)}</span>
                      </div>
                      <Meter
                        className="mt-1"
                        valor={e.grado}
                        retraso={i * 0.05}
                        animar={animarBarras}
                        etiqueta={`Grado de pertenencia a ${e.texto}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
