'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { DosPaneles } from '@/components/layout/Paneles';
import { Button, EnlaceBoton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colapsable } from '@/components/ui/Colapsable';
import { LinearProgress } from '@/components/ui/LinearProgress';
import { Meter } from '@/components/ui/Meter';
import { useEvaluarLote } from '@/hooks/useEvaluarLote';
import { useRetraso } from '@/hooks/useRetraso';
import { ApiValidationError } from '@/lib/api';
import { construirCsvResultados, parsearCsv, textoErrorFila, type ResultadoCsv } from '@/lib/csv';
import { BANDAS, EASE, NIVEL_PUNTO, RETRASO_BARRA_CARGA_MS } from '@/lib/constants';
import { descargarTexto } from '@/lib/descarga';
import { notificarError } from '@/lib/errores';
import { CargaCsv, type ResumenArchivo } from './CargaCsv';
import { TablaResultados } from './TablaResultados';

export function LoteView() {
  const reducido = useReducedMotion();
  const [nombre, setNombre] = useState<string | null>(null);
  const [parseo, setParseo] = useState<ResultadoCsv | null>(null);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);
  const lote = useEvaluarLote();
  const barra = useRetraso(lote.isPending, RETRASO_BARRA_CARGA_MS);

  useEffect(() => {
    if (lote.isError) notificarError(lote.error);
  }, [lote.isError, lote.error]);

  const alArchivo = async (archivo: File) => {
    lote.reset();
    setErrorLectura(null);
    try {
      const texto = await archivo.text();
      setNombre(archivo.name);
      setParseo(parsearCsv(texto));
    } catch {
      setNombre(null);
      setParseo(null);
      setErrorLectura('No se pudo leer el archivo.');
    }
  };

  const quitar = () => {
    setNombre(null);
    setParseo(null);
    setErrorLectura(null);
    lote.reset();
  };

  const resumen: ResumenArchivo | null =
    nombre && parseo
      ? {
          nombre,
          filasLeidas: parseo.totalFilas,
          validas: parseo.errores.length === 0 ? parseo.validas.length : parseo.totalFilas - new Set(parseo.errores.map((e) => e.fila)).size,
          invalidas: new Set(parseo.errores.map((e) => e.fila)).size,
        }
      : null;

  const listo = parseo !== null && parseo.errores.length === 0 && parseo.validas.length > 0;

  const evaluar = () => {
    if (!parseo || !listo) return;
    lote.mutate({
      evaluaciones: parseo.validas.map((f) => ({
        id_evaluacion: f.id_evaluacion,
        potencia_w: f.potencia_w,
        ocupantes: f.ocupantes,
        hora: f.hora,
      })),
    });
  };

  const conteo = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const r of lote.data?.resultados ?? []) mapa[r.interpretacion] = (mapa[r.interpretacion] ?? 0) + 1;
    return mapa;
  }, [lote.data]);

  const izquierda = (
    <div className="space-y-5">
      <CargaCsv resumen={resumen} onArchivo={(f) => void alArchivo(f)} onQuitar={quitar} />
      {errorLectura ? (
        <p role="alert" className="text-sm text-danger">
          {errorLectura}
        </p>
      ) : null}

      {parseo && parseo.errores.length > 0 ? (
        <div role="alert">
          <h2 className="mb-2 text-sm font-medium text-danger">
            {parseo.errores.length === 1 ? '1 error de validación' : `${parseo.errores.length} errores de validación`}
          </h2>
          <p className="mb-2 text-xs text-ink-muted">No se envía nada al backend hasta corregir el archivo.</p>
          <Colapsable claveDatos={`${nombre}-${parseo.errores.length}`} alturaMax={132}>
            <ul className="space-y-1.5">
              {parseo.errores.map((e, i) => (
                <li key={`${e.fila}-${e.columna}-${i}`} className="text-xs text-ink">
                  {textoErrorFila(e)}
                </li>
              ))}
            </ul>
          </Colapsable>
        </div>
      ) : null}

      <Button
        variante="primario"
        className="w-full"
        disabled={!listo}
        cargando={lote.isPending}
        onClick={evaluar}
      >
        {listo ? `Evaluar ${parseo?.validas.length} filas` : 'Evaluar lote'}
      </Button>

      <div>
        <h2 className="etiqueta mb-2">Archivos de ejemplo</h2>
        <div className="grid gap-2">
          <EnlaceBoton href="/plantilla_lote.csv" download>
            Descargar plantilla
          </EnlaceBoton>
          <EnlaceBoton href="/casos_informe.csv" download>
            Descargar casos del informe
          </EnlaceBoton>
        </div>
      </div>
    </div>
  );

  let derecha;
  if (lote.isError) {
    const indice = lote.error instanceof ApiValidationError ? lote.error.indice : undefined;
    derecha = (
      <EstadoError
        error={lote.error}
        titulo={indice !== undefined ? `El backend rechazó el ítem ${indice + 1} del lote` : 'No se pudo evaluar el lote'}
        onReintentar={evaluar}
      />
    );
  } else if (lote.data) {
    const resultados = lote.data.resultados;
    derecha = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducido ? 0.15 : 0.3, ease: EASE }}
        className="space-y-4"
      >
        <Card titulo={`Resumen por nivel (${lote.data.total} filas)`}>
          <ul className="space-y-3">
            {BANDAS.map((b, i) => (
              <li key={b.nivel}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{b.nombre}</span>
                  <span className="num text-ink">{conteo[b.nombre] ?? 0}</span>
                </div>
                <Meter
                  className="mt-1"
                  valor={conteo[b.nombre] ?? 0}
                  max={Math.max(lote.data.total, 1)}
                  colorClase={NIVEL_PUNTO[b.nivel]}
                  retraso={i * 0.05}
                  etiqueta={`Filas con prioridad ${b.nombre}`}
                />
              </li>
            ))}
          </ul>
        </Card>
        <Card
          titulo="Resultados"
          acciones={
            <Button
              className="h-9"
              onClick={() => descargarTexto('resultados_ipa.csv', construirCsvResultados(resultados))}
            >
              Exportar resultados (CSV)
            </Button>
          }
        >
          <TablaResultados resultados={resultados} />
        </Card>
      </motion.div>
    );
  } else {
    derecha = (
      <EstadoVacio titulo="Aún no hay filas válidas">
        Sube un CSV con las columnas id, potencia_w, ocupantes y hora.
      </EstadoVacio>
    );
  }

  return (
    <DosPaneles
      izquierda={izquierda}
      derecha={
        <>
          <LinearProgress visible={barra} />
          {derecha}
        </>
      }
    />
  );
}
