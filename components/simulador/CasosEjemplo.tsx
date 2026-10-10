'use client';

import { Tile } from '@/components/ui/Tile';
import { CASOS_EJEMPLO } from '@/lib/constants';
import { resumenEntradas } from '@/lib/format';
import type { Entradas } from '@/types/api';

/** Chips con las corridas del informe. Cada tile es una acción: carga valores y se marca activo si coinciden. */
export function CasosEjemplo({ entradas, onElegir }: { entradas: Entradas | null; onElegir: (e: Entradas) => void }) {
  return (
    <div>
      <h2 className="etiqueta mb-2">Casos de ejemplo</h2>
      <div className="grid gap-2">
        {CASOS_EJEMPLO.map((caso, i) => {
          const e = caso.entradas;
          const activo =
            entradas !== null &&
            entradas.potencia_w === e.potencia_w &&
            entradas.ocupantes === e.ocupantes &&
            entradas.hora === e.hora;
          return (
            <Tile
              key={caso.id}
              titulo={`Caso ${i + 1}`}
              descripcion={resumenEntradas(e.potencia_w, e.ocupantes, e.hora)}
              tag="Ejemplo del informe"
              activo={activo}
              onClick={() => onElegir(e)}
            />
          );
        })}
      </div>
    </div>
  );
}
