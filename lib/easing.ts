import { EASE } from '@/lib/constants';

/**
 * Evalúa una curva cubic-bezier(x1, y1, x2, y2) en JS (Newton-Raphson con bisección de respaldo).
 * Se usa para que los tweens hechos con requestAnimationFrame (controles que se animan hacia un
 * caso de ejemplo) sigan exactamente la misma curva que el CSS y framer-motion.
 */
function crearBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (progreso: number): number => {
    if (progreso <= 0) return 0;
    if (progreso >= 1) return 1;
    let t = progreso;
    for (let i = 0; i < 8; i += 1) {
      const error = x(t) - progreso;
      if (Math.abs(error) < 1e-6) return y(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= error / d;
    }
    let bajo = 0;
    let alto = 1;
    t = progreso;
    while (bajo < alto) {
      const valor = x(t);
      if (Math.abs(valor - progreso) < 1e-6) break;
      if (progreso > valor) bajo = t;
      else alto = t;
      t = (alto - bajo) / 2 + bajo;
      if (alto - bajo < 1e-7) break;
    }
    return y(t);
  };
}

export const easeSalida = crearBezier(EASE[0], EASE[1], EASE[2], EASE[3]);
