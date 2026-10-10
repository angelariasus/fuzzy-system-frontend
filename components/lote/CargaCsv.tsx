'use client';

import { useId, useRef, useState, type DragEvent } from 'react';
import { Cerrar } from '@/components/icons/glifos';
import { cn } from '@/lib/cn';

export interface ResumenArchivo {
  nombre: string;
  filasLeidas: number;
  validas: number;
  invalidas: number;
}

interface Props {
  resumen: ResumenArchivo | null;
  onArchivo: (archivo: File) => void;
  onQuitar: () => void;
}

/**
 * Zona de carga: arrastrar y soltar, o botón accesible por teclado (input de archivo real, visible
 * solo para lectores de pantalla y con el foco mostrado en la zona). Borde y tinte cambian en hover
 * y drag-over con transiciones de propiedades concretas, nunca `all`.
 */
export function CargaCsv({ resumen, onArchivo, onQuitar }: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const alSoltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files?.[0];
    if (archivo) onArchivo(archivo);
  };

  if (resumen) {
    return (
      <div className="rounded-lg border border-border bg-surface/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="num break-all text-sm font-medium text-ink">{resumen.nombre}</p>
          <button
            type="button"
            onClick={() => {
              onQuitar();
              if (entrada.current) entrada.current.value = '';
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
          >
            <Cerrar size={16} />
            Quitar archivo
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-ink-muted">Filas leídas</dt>
            <dd className="num text-base text-ink">{resumen.filasLeidas}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Válidas</dt>
            <dd className="num text-base text-ink">{resumen.validas}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Inválidas</dt>
            <dd className={cn('num text-base', resumen.invalidas > 0 ? 'text-danger' : 'text-ink')}>
              {resumen.invalidas}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={alSoltar}
      className={cn(
        'relative rounded-lg border border-dashed p-6 text-center',
        'transition-[border-color,background-color] duration-150 ease-salida',
        'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
        arrastrando
          ? 'border-accent bg-accent-tint/30'
          : 'border-border-strong bg-surface/60 hover:border-accent hover:bg-accent-tint/20',
      )}
    >
      <input
        ref={entrada}
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) onArchivo(archivo);
        }}
      />
      <p className="text-sm text-ink">Arrastra un archivo CSV aquí</p>
      <p className="mt-1 text-xs text-ink-muted">Columnas: id, potencia_w, ocupantes y hora (decimal o HH:MM). Máximo 1000 filas.</p>
      <label
        htmlFor={id}
        className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-md border border-border-strong bg-surface-raised px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-sunken"
      >
        Seleccionar archivo
      </label>
    </div>
  );
}
