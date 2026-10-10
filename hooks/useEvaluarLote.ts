import { useMutation } from '@tanstack/react-query';
import { evaluarLote } from '@/lib/api';
import type { LoteRequest } from '@/types/api';

/** Evaluación por lote (validación atómica en el backend). Es una mutación: se dispara a mano. */
export function useEvaluarLote() {
  return useMutation({
    mutationFn: (cuerpo: LoteRequest) => evaluarLote(cuerpo),
  });
}
