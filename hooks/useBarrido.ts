import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { barrido } from '@/lib/api';
import type { BarridoRequest } from '@/types/api';
import { reintentarSoloSiTransitorio } from './useEvaluar';

/** Barrido de una variable. `peticion` es null si el formulario aún no es válido. */
export function useBarrido(peticion: BarridoRequest | null) {
  return useQuery({
    queryKey: ['barrido', peticion],
    queryFn: ({ signal }) => {
      if (!peticion) throw new Error('Petición no disponible');
      return barrido(peticion, signal);
    },
    enabled: peticion !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: reintentarSoloSiTransitorio,
  });
}
