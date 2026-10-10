import { Badge } from '@/components/ui/Badge';
import { BANDAS, NIVEL_POR_INTERPRETACION, NIVEL_PUNTO } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatIPA } from '@/lib/format';
import type { NivelIPA } from '@/types/api';

interface MedidorIPAProps {
  ipa: number;
  /** Interpretación y acción: siempre tal como las devuelve el backend. */
  interpretacion: NivelIPA;
  accion: string;
}

/**
 * Hero de resultados y único elemento distintivo del simulador.
 *
 * - El número usa DM Mono 500 con ancho reservado (6 caracteres): el layout no se mueve al pasar
 *   de 9,28 a 89,17. Cambia sin tween.
 * - El marcador es el único elemento animado del evento "arrastrar un slider": solo `transform`
 *   y 150 ms. Se mueve el contenedor (ancho = barra) con translateX(%), porque el % de translateX
 *   se mide sobre el propio elemento y así coincide con el porcentaje del IPA sin medir en JS.
 * - Las bandas llevan borde de 1 px en border-strong: nivel-1 y nivel-2 no se sostienen solos
 *   como relleno sobre el fondo (contraste 1,2:1 y 2,2:1).
 */
export function MedidorIPA({ ipa, interpretacion, accion }: MedidorIPAProps) {
  const pct = Math.min(Math.max(ipa, 0), 100);
  const nivel = NIVEL_POR_INTERPRETACION[interpretacion] ?? 1;
  const texto = formatIPA(ipa);

  return (
    <div>
      <p className="etiqueta">Índice de prioridad de ahorro</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="num inline-block min-w-[6ch] text-ipa font-medium text-ink">{texto}</span>
        <span className="text-sm text-ink-muted">puntos</span>
      </div>

      <div className="mt-5 px-3">
        <div className="relative">
          <div className="flex h-3 overflow-hidden rounded-full border border-border-strong">
            {BANDAS.map((b, i) => (
              <div
                key={b.nivel}
                className={cn('flex-1', NIVEL_PUNTO[b.nivel], i > 0 && 'border-l border-border-strong')}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-transform duration-150 ease-salida motion-reduce:transition-none"
            style={{ transform: `translateX(${pct}%)` }}
          >
            <span className="absolute -top-1.5 left-0 h-6 w-1 -translate-x-1/2 rounded-full bg-ink ring-2 ring-surface-raised" />
          </div>
        </div>
        <div className="mt-2 flex">
          {BANDAS.map((b) => (
            <span
              key={b.nivel}
              className={cn(
                'flex-1 text-center text-xs',
                b.nivel === nivel ? 'font-medium text-ink' : 'text-ink-faint',
              )}
            >
              {b.nombre}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Badge nivel={nivel}>{interpretacion}</Badge>
        <p className="text-sm text-ink">{accion}</p>
      </div>

      {/* Se anuncia solo cuando llega un resultado estable (tras el debounce), no en cada tick del slider. */}
      <p aria-live="polite" className="sr-only">
        {`Índice de prioridad de ahorro ${texto} puntos, nivel ${interpretacion}`}
      </p>
    </div>
  );
}
