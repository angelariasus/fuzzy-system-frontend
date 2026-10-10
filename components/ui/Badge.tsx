import type { ReactNode } from 'react';
import { NIVEL_FONDO_SUAVE, NIVEL_PUNTO, type Nivel } from '@/lib/constants';
import { cn } from '@/lib/cn';

/**
 * Badge de nivel: fondo nivel-N al 20 %, texto ink y un punto del color pleno. El nivel nunca
 * se comunica solo con color: siempre lleva texto.
 */
export function Badge({ nivel, children, className }: { nivel: Nivel; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-ink',
        NIVEL_FONDO_SUAVE[nivel],
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', NIVEL_PUNTO[nivel])} />
      {children}
    </span>
  );
}
