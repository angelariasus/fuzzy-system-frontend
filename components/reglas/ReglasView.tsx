'use client';

import { useReducedMotion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { UnPanel } from '@/components/layout/Paneles';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useEvaluar } from '@/hooks/useEvaluar';
import { useReglas } from '@/hooks/useReglas';
import { NIVEL_POR_SALIDA } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatGrado, formatNumero, decimalAHora } from '@/lib/format';
import { leerEntradasDeUrl } from '@/lib/url-state';
import type { ReglaItem } from '@/types/api';
import { MatrizReglas } from './MatrizReglas';

type Vista = 'matriz' | 'tabla';
const TODAS = '__todas__';

function opcionesDe(reglas: ReglaItem[], campo: 'potencia' | 'ocupantes' | 'bloque' | 'salida', titulo: string) {
  const unicos = Array.from(new Set(reglas.map((r) => r[campo])));
  return [{ valor: TODAS, etiqueta: `${titulo}: todas` }, ...unicos.map((u) => ({ valor: u, etiqueta: u }))];
}

function BotonVista({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'h-9 rounded-md border px-3 text-sm transition-[transform,background-color,border-color] duration-150 ease-salida active:scale-[0.97]',
        activo ? 'border-border-strong bg-accent-tint/50 font-medium text-ink' : 'border-border text-ink-muted hover:border-border-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function ReglasView() {
  const reducido = useReducedMotion();
  const params = useSearchParams();
  const entradas = useMemo(() => leerEntradasDeUrl(params), [params]);
  const resaltada = params.get('regla');

  const reglas = useReglas();
  const evaluacion = useEvaluar(entradas);

  const [vista, setVista] = useState<Vista>('matriz');
  const [fPotencia, setFPotencia] = useState(TODAS);
  const [fOcupantes, setFOcupantes] = useState(TODAS);
  const [fBloque, setFBloque] = useState(TODAS);
  const [fSalida, setFSalida] = useState(TODAS);
  const [busqueda, setBusqueda] = useState('');

  const activadas = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const r of entradas ? (evaluacion.data?.reglas_activadas ?? []) : []) mapa[r.regla] = r.alpha;
    return mapa;
  }, [entradas, evaluacion.data]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (reglas.data ?? []).filter(
      (r) =>
        (fPotencia === TODAS || r.potencia === fPotencia) &&
        (fOcupantes === TODAS || r.ocupantes === fOcupantes) &&
        (fBloque === TODAS || r.bloque === fBloque) &&
        (fSalida === TODAS || r.salida === fSalida) &&
        (q === '' || r.regla.toLowerCase().includes(q)),
    );
  }, [reglas.data, fPotencia, fOcupantes, fBloque, fSalida, busqueda]);

  // ?regla=R20: scroll hasta la regla una vez que hay datos pintados.
  useEffect(() => {
    if (!resaltada || !reglas.data) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`regla-${resaltada}`)?.scrollIntoView({ block: 'center', behavior: reducido ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [resaltada, reglas.data, vista, reducido]);

  return (
    <UnPanel ancho="max-w-5xl" className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Base de reglas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          36 reglas Mamdani que combinan potencia, ocupantes y bloque horario. Los datos vienen del backend.
        </p>
      </div>

      <Card titulo="Función ordinal del informe">
        <div className="space-y-2 text-sm text-ink-muted">
          <p>
            La salida de cada regla sale de <span className="num text-ink">S = rP + rO + rH</span>, limitada al rango de
            0 a 4.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="num text-ink">rP</span>: Baja 0, Media 1, Alta 2.
            </li>
            <li>
              <span className="num text-ink">rO</span>: Sin ocupantes 1; las demás etiquetas 0.
            </li>
            <li>
              <span className="num text-ink">rH</span>: Punta 1; Base y Media 0.
            </li>
          </ul>
          <p>
            Conversión de S a la etiqueta de salida: 0 Muy bajo, 1 Bajo, 2 Medio, 3 Alto, 4 Muy alto.
          </p>
        </div>
      </Card>

      {entradas && evaluacion.data ? (
        <p className="rounded-md border border-border bg-surface/80 px-3 py-2 text-sm text-ink-muted">
          Resaltadas las reglas activadas por{' '}
          <span className="num text-ink">
            {formatNumero(entradas.potencia_w, 0)} W, {formatNumero(entradas.ocupantes, 1)} ocupantes, {decimalAHora(entradas.hora)}
          </span>
          .
        </p>
      ) : null}

      <div className="flex items-center gap-2" role="group" aria-label="Vista">
        <BotonVista activo={vista === 'matriz'} onClick={() => setVista('matriz')}>
          Matriz
        </BotonVista>
        <BotonVista activo={vista === 'tabla'} onClick={() => setVista('tabla')}>
          Tabla
        </BotonVista>
      </div>

      {reglas.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : reglas.isError ? (
        <EstadoError error={reglas.error} titulo="No se pudo cargar la base de reglas" onReintentar={() => void reglas.refetch()} />
      ) : vista === 'matriz' ? (
        <Card aparecer>
          <MatrizReglas reglas={reglas.data} activadas={activadas} resaltada={resaltada} />
        </Card>
      ) : (
        <Card aparecer>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select etiqueta="Filtrar por potencia" valor={fPotencia} opciones={opcionesDe(reglas.data, 'potencia', 'Potencia')} onChange={setFPotencia} />
            <Select etiqueta="Filtrar por ocupantes" valor={fOcupantes} opciones={opcionesDe(reglas.data, 'ocupantes', 'Ocupantes')} onChange={setFOcupantes} />
            <Select etiqueta="Filtrar por bloque" valor={fBloque} opciones={opcionesDe(reglas.data, 'bloque', 'Bloque')} onChange={setFBloque} />
            <Select etiqueta="Filtrar por salida" valor={fSalida} opciones={opcionesDe(reglas.data, 'salida', 'Salida')} onChange={setFSalida} />
            <Input
              aria-label="Buscar por código de regla"
              placeholder="Buscar código, p. ej. R20"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              mono
            />
          </div>
          {filtradas.length === 0 ? (
            <EstadoVacio titulo="Ninguna regla coincide con los filtros">Cambia o quita algún filtro.</EstadoVacio>
          ) : (
            <div className="scroll-panel max-h-[28rem] overflow-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    {['Regla', 'Potencia', 'Ocupantes', 'Bloque', 'Salida', 'Cálculo ordinal', 'Activación'].map((c) => (
                      <th key={c} scope="col" className="etiqueta sticky top-0 z-10 border-b border-border bg-surface px-3 py-2 text-left">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => {
                    const alpha = activadas[r.regla];
                    const marcada = alpha !== undefined || resaltada === r.regla;
                    return (
                      <tr
                        key={r.regla}
                        id={`regla-${r.regla}`}
                        className={cn(
                          'border-b border-border transition-colors duration-150 hover:bg-surface-sunken',
                          marcada && 'bg-accent-tint/30',
                        )}
                      >
                        <td className="num px-3 py-2 font-medium text-ink">{r.regla}</td>
                        <td className="px-3 py-2 text-ink">{r.potencia}</td>
                        <td className="px-3 py-2 text-ink">{r.ocupantes}</td>
                        <td className="px-3 py-2 text-ink">{r.bloque}</td>
                        <td className="px-3 py-2">
                          <Badge nivel={NIVEL_POR_SALIDA[r.salida] ?? 1}>{r.salida}</Badge>
                        </td>
                        <td className="num px-3 py-2 text-xs text-ink-muted">{r.calculo_ordinal}</td>
                        <td className="num px-3 py-2 text-xs text-ink">{alpha !== undefined ? formatGrado(alpha) : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </UnPanel>
  );
}
