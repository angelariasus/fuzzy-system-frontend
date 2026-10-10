import { Suspense } from 'react';
import { SimuladorView } from '@/components/simulador/SimuladorView';

export default function PaginaSimulador() {
  // useSearchParams exige un límite de Suspense para poder compilar la página.
  return (
    <Suspense fallback={null}>
      <SimuladorView />
    </Suspense>
  );
}
