import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Providers } from '@/components/Providers';
import './globals.css';

/** DM Sans es la única tipografía de la interfaz, incluidos números y valores. */
const sans = DM_Sans({ subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Matiz · Prioridad de ahorro eléctrico', template: '%s · Matiz' },
  description:
    'Simulador del sistema de inferencia difusa Mamdani que calcula el índice de prioridad de ahorro eléctrico (IPA) de una vivienda.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={sans.variable}>
      <body className="h-dvh overflow-hidden bg-canvas text-ink antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
