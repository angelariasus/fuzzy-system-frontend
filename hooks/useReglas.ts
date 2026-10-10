import { useQuery } from '@tanstack/react-query';
import { obtenerReglas } from '@/lib/api';
import { reintentarSoloSiTransitorio } from './useEvaluar';

/** Base de 36 reglas: datos estáticos que comparten caché el simulador y /reglas. */
export function useReglas() {
  return useQuery({
    queryKey: ['reglas'],
    queryFn: ({ signal }) => obtenerReglas(signal),
    staleTime: Infinity,
    retry: reintentarSoloSiTransitorio,
  });
}
