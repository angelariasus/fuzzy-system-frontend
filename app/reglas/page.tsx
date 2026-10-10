import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReglasView } from '@/components/reglas/ReglasView';

export const metadata: Metadata = { title: 'Reglas' };

export default function PaginaReglas() {
  // useSearchParams exige un límite de Suspense para poder compilar la página.
  return (
    <Suspense fallback={null}>
      <ReglasView />
    </Suspense>
  );
}
