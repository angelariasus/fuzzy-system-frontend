import type { Metadata } from 'next';
import { ExplorarView } from '@/components/explorar/ExplorarView';

export const metadata: Metadata = { title: 'Explorar' };

export default function PaginaExplorar() {
  return <ExplorarView />;
}
