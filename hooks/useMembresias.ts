import { useQuery } from '@tanstack/react-query';
import { obtenerMembresias } from '@/lib/api';
import { PUNTOS_MEMBRESIAS } from '@/lib/constants';
import { reintentarSoloSiTransitorio } from './useEvaluar';

/** Funciones de pertenencia: datos estáticos, se cargan una vez y se comparten entre vistas. */
export function useMembresias() {
  return useQuery({
    queryKey: ['membresias', PUNTOS_MEMBRESIAS],
    queryFn: ({ signal }) => obtenerMembresias(PUNTOS_MEMBRESIAS, signal),
    staleTime: Infinity,
    retry: reintentarSoloSiTransitorio,
  });
}
