'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cloneElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { EASE } from '@/lib/constants';
import { cn } from '@/lib/cn';

interface TooltipProps {
  contenido: ReactNode;
  /** El disparador debe ser enfocable (botón, enlace o elemento con tabIndex=0). */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  className?: string;
}

/** Espacio mínimo (px) que necesita el tooltip para abrirse hacia abajo. */
const ESPACIO_MINIMO = 96;

/**
 * Tooltip que se abre hacia el lado con espacio: cerca del borde inferior del viewport se abre
 * hacia arriba (`bottom-full`, `origin-bottom`). El lado se calcula al abrir, no al renderizar,
 * porque depende de dónde esté el disparador en ese momento (los paneles tienen scroll propio).
 */
export function Tooltip({ contenido, children, className }: TooltipProps) {
  const id = useId();
  const reducido = useReducedMotion();
  const raiz = useRef<HTMLSpanElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [arriba, setArriba] = useState(false);

  const abrir = useCallback(() => {
    const caja = raiz.current?.getBoundingClientRect();
    if (caja) setArriba(window.innerHeight - caja.bottom < ESPACIO_MINIMO && caja.top > ESPACIO_MINIMO);
    setAbierto(true);
  }, []);
  const cerrar = useCallback(() => setAbierto(false), []);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  return (
    <span
      ref={raiz}
      className={cn('relative inline-flex', className)}
      onMouseEnter={abrir}
      onMouseLeave={cerrar}
      onFocus={abrir}
      onBlur={cerrar}
    >
      {cloneElement(children, { 'aria-describedby': abierto ? id : undefined })}
      <AnimatePresence>
        {abierto ? (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: reducido ? 0 : arriba ? -6 : 6, scale: reducido ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: EASE }}
            className={cn(
              'pointer-events-none absolute left-1/2 z-30 w-max max-w-[260px] -translate-x-1/2 rounded-md border border-border-strong',
              'bg-surface-raised px-2.5 py-1.5 text-xs text-ink shadow-popover',
              arriba ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
            )}
          >
            {contenido}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
