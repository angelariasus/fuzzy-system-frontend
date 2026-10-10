import type { Metadata } from 'next';
import { LoteView } from '@/components/lote/LoteView';

export const metadata: Metadata = { title: 'Lote' };

export default function PaginaLote() {
  return <LoteView />;
}
