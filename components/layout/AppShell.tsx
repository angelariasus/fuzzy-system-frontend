import type { ReactNode } from 'react';
import { Header } from './Header';

/**
 * Layout de alto fijo: la app ocupa el viewport y el scroll vive dentro de cada panel, nunca en el body.
 * `#barra-inferior` es un hueco `flex-shrink-0` entre main y el pie: el simulador lo rellena en
 * móvil con la barra compacta del IPA (forma parte del shell, no es `position: fixed`).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <div id="barra-inferior" className="flex-shrink-0 lg:hidden" />
    </div>
  );
}
