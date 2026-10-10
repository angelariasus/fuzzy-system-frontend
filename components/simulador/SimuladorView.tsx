'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { EstadoError } from '@/components/EstadoError';
import { DosPaneles } from '@/components/layout/Paneles';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinearProgress } from '@/components/ui/LinearProgress';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEvaluar } from '@/hooks/useEvaluar';
import { useRetraso } from '@/hooks/useRetraso';
import { ApiValidationError } from '@/lib/api';
import { DEBOUNCE_MS, NIVEL_POR_INTERPRETACION, RETRASO_BARRA_CARGA_MS } from '@/lib/constants';
import { notificarError } from '@/lib/errores';
import { formatIPA } from '@/lib/format';
import { consultaDeEntradas, entradasIniciales } from '@/lib/url-state';
import type { Entradas, EvaluacionResponse } from '@/types/api';
import { AgregacionChart } from './AgregacionChart';
import { CasosEjemplo } from './CasosEjemplo';
import { EntradasPanel, type CasoSolicitado } from './EntradasPanel';
import { FuzzificacionPanel } from './FuzzificacionPanel';
import { ReglasActivadasTable } from './ReglasActivadasTable';
import { ResumenResultado } from './ResumenResultado';

/** Barra compacta de móvil: se monta en el hueco #barra-inferior del shell (no es position: fixed). */
function BarraCompacta({ resultado }: { resultado: EvaluacionResponse }) {
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  useEffect(() => setDestino(document.getElementById('barra-inferior')), []);
  if (!destino) return null;
  const nivel = NIVEL_POR_INTERPRETACION[resultado.interpretacion] ?? 1;
  return createPortal(
    <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2">
      <span className="flex items-baseline gap-2">
        <span className="num min-w-[6ch] text-lg font-medium text-ink">{formatIPA(resultado.ipa)}</span>
        <span className="text-xs text-ink-muted">puntos</span>
      </span>
      <Badge nivel={nivel}>{resultado.interpretacion}</Badge>
    </div>,
    destino,
  );
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando resultados">
      <div className="rounded-lg border border-border p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-12 w-40" />
        <Skeleton className="mt-5 h-3 w-full" />
        <Skeleton className="mt-4 h-5 w-64" />
      </div>
      <div className="rounded-lg border border-border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
      <div className="rounded-lg border border-border p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    </div>
  );
}

export function SimuladorView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // La URL solo inicializa el formulario; después el estado vive en el formulario y se refleja en la URL.
  const [iniciales] = useState<Entradas>(() => entradasIniciales(searchParams));
  const [entradas, setEntradas] = useState<Entradas | null>(iniciales);
  const [caso, setCaso] = useState<CasoSolicitado | null>(null);
  const [origen, setOrigen] = useState<'caso' | 'control'>('caso');

  const entradasEstables = useDebouncedValue(entradas, DEBOUNCE_MS);
  const consulta = useEvaluar(entradasEstables);

  const enMovimiento = consulta.isFetching || entradas !== entradasEstables;
  const barraVisible = useRetraso(enMovimiento, RETRASO_BARRA_CARGA_MS);

  // Estado en la URL: ?p=&n=&h= con router.replace sin scroll (enlace compartible).
  useEffect(() => {
    if (!entradasEstables) return;
    router.replace(`${pathname}?${consultaDeEntradas(entradasEstables)}`, { scroll: false });
  }, [entradasEstables, pathname, router]);

  // Toast de error deduplicado por id (ver lib/errores.ts).
  useEffect(() => {
    if (consulta.isError) notificarError(consulta.error);
  }, [consulta.isError, consulta.error]);

  const erroresServidor = useMemo(
    () => (consulta.error instanceof ApiValidationError ? consulta.error.fieldErrors : undefined),
    [consulta.error],
  );

  // Escalonado de entrada solo en la primera aparición de resultados.
  const huboDatos = useRef(false);
  const escalonar = !huboDatos.current;
  useEffect(() => {
    if (consulta.data) huboDatos.current = true;
  }, [consulta.data]);

  const elegirCaso = useCallback((e: Entradas) => {
    setOrigen('caso');
    setCaso((anterior) => ({ entradas: e, nonce: (anterior?.nonce ?? 0) + 1 }));
  }, []);
  const actualizarEntradas = useCallback((nuevas: Entradas | null) => {
    // La respuesta visual de los controles tiene prioridad sobre el panel pesado de resultados.
    startTransition(() => setEntradas(nuevas));
  }, []);
  const alInteractuar = useCallback(() => setOrigen('control'), []);

  const copiarEnlace = async () => {
    if (!entradas) {
      toast.error('Corrige las entradas antes de copiar el enlace.', { id: 'enlace' });
      return;
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${pathname}?${consultaDeEntradas(entradas)}`);
      toast.success('Enlace copiado', { id: 'enlace' });
    } catch {
      toast.error('No se pudo copiar el enlace.', { id: 'enlace' });
    }
  };

  const resultado = consulta.data;
  const animarBarras = origen === 'caso';

  const izquierda = (
    <div className="space-y-8">
      <EntradasPanel
        valoresIniciales={iniciales}
        onEntradas={actualizarEntradas}
        onInteraccion={alInteractuar}
        casoSolicitado={caso}
        erroresServidor={erroresServidor}
      />
      <CasosEjemplo entradas={entradas} onElegir={elegirCaso} />
      <Button className="w-full" onClick={() => void copiarEnlace()}>
        Copiar enlace
      </Button>
    </div>
  );

  let contenido;
  if (!resultado && consulta.isError) {
    contenido = <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  } else if (!resultado) {
    contenido = <ResultadosSkeleton />;
  } else {
    contenido = (
      <div className="space-y-4">
        {consulta.isError ? (
          <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />
        ) : null}
        <ResumenResultado resultado={resultado} />
        <FuzzificacionPanel
          fuzzificacion={resultado.fuzzificacion}
          entradas={resultado.entradas}
          animarBarras={animarBarras}
        />
        <ReglasActivadasTable
          reglas={resultado.reglas_activadas}
          pendiente={enMovimiento}
          escalonar={escalonar}
          animarBarras={animarBarras}
        />
        <AgregacionChart ipa={resultado.ipa} reglas={resultado.reglas_activadas} entradas={resultado.entradas} />
      </div>
    );
  }

  return (
    <>
      <DosPaneles
        izquierda={izquierda}
        derecha={
          <>
            <LinearProgress visible={barraVisible} />
            {contenido}
          </>
        }
      />
      {resultado ? <BarraCompacta resultado={resultado} /> : null}
    </>
  );
}
