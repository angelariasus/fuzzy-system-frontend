import { memo } from 'react';
import { Card } from '@/components/ui/Card';
import { resumenEntradas } from '@/lib/format';
import type { EvaluacionResponse } from '@/types/api';
import { MedidorIPA } from './MedidorIPA';

/** Card principal del resultado: medidor del IPA y las entradas que el backend evaluó. */
export const ResumenResultado = memo(function ResumenResultado({ resultado }: { resultado: EvaluacionResponse }) {
  const { entradas } = resultado;
  return (
    <Card titulo="Resultado">
      <MedidorIPA ipa={resultado.ipa} interpretacion={resultado.interpretacion} accion={resultado.accion_sugerida} />
      <p className="mt-4 border-t border-border pt-3 text-xs text-ink-muted">
        Entradas evaluadas:{' '}
        <span className="num text-ink">{resumenEntradas(entradas.potencia_w, entradas.ocupantes, entradas.hora)}</span>
      </p>
    </Card>
  );
});
