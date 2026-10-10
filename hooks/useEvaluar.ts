import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiNetworkError, ApiServerError, ApiTimeoutError, evaluar } from '@/lib/api';
import type { Entradas } from '@/types/api';

/** Solo se reintenta (una vez) ante red, timeout o 500; un 422 no se reintenta jamás. */
export function reintentarSoloSiTransitorio(intentos: number, error: unknown): boolean {
  const transitorio =
    error instanceof ApiNetworkError || error instanceof ApiTimeoutError || error instanceof ApiServerError;
  return transitorio && intentos < 1;
}

/**
 * Evaluación en vivo. `entradas` es null mientras el formulario no pasa el esquema zod
 * (entradas inválidas no disparan peticiones).
 *
 * - keepPreviousData: el resultado anterior sigue visible mientras llega el nuevo, así el
 *   slider no provoca parpadeos de skeleton.
 * - staleTime Infinity: la función es determinista, la misma entrada da siempre el mismo resultado.
 * - La señal de React Query cancela las peticiones obsoletas.
 */
export function useEvaluar(entradas: Entradas | null) {
  return useQuery({
    queryKey: ['evaluar', entradas?.potencia_w, entradas?.ocupantes, entradas?.hora],
    queryFn: ({ signal }) => {
      if (!entradas) throw new Error('Entradas no disponibles');
      return evaluar(entradas, signal);
    },
    enabled: entradas !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: reintentarSoloSiTransitorio,
  });
}
