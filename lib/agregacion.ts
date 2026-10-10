import { CLAVE_POR_SALIDA, ORDEN_IPA } from '@/lib/constants';
import type { EtiquetaIPA, MembresiasResponse, ReglaActivada } from '@/types/api';

/**
 * SOLO PARA DIBUJAR. Este módulo NO es una segunda implementación del motor difuso.
 *
 * El backend es la única fuente de verdad: el IPA, la interpretación, los grados de
 * pertenencia y las reglas activadas llegan siempre de la API. Aquí únicamente se combinan
 * las curvas de salida de /api/membresias con los grados de activación (alpha) que ya
 * entregó el backend en `reglas_activadas`, para pintar el recorte de cada conjunto y su
 * máximo punto a punto. El centroide que se muestra en pantalla es el `ipa` del backend.
 */

export interface Agregacion {
  universo: number[];
  /** Curvas de salida completas (trazo tenue). */
  curvas: Record<EtiquetaIPA, number[]>;
  /** Alpha máximo por etiqueta de salida entre las reglas activas (0 si ninguna la activa). */
  alphaPorSalida: Record<EtiquetaIPA, number>;
  /** Cada conjunto de salida recortado a su alpha. */
  recortes: Record<EtiquetaIPA, number[]>;
  /** Máximo punto a punto de los recortes: el conjunto agregado. */
  agregado: number[];
}

export function calcularAgregacion(
  ipa: MembresiasResponse['variables']['ipa'],
  reglas: ReglaActivada[],
): Agregacion {
  const alphaPorSalida = Object.fromEntries(ORDEN_IPA.map((k) => [k, 0])) as Record<EtiquetaIPA, number>;
  for (const regla of reglas) {
    const clave = CLAVE_POR_SALIDA[regla.salida];
    if (clave && regla.alpha > alphaPorSalida[clave]) alphaPorSalida[clave] = regla.alpha;
  }

  const universo = ipa.universo;
  const curvas = {} as Record<EtiquetaIPA, number[]>;
  const recortes = {} as Record<EtiquetaIPA, number[]>;
  const agregado = new Array<number>(universo.length).fill(0);

  for (const clave of ORDEN_IPA) {
    const curva = ipa.etiquetas[clave];
    curvas[clave] = curva;
    const alpha = alphaPorSalida[clave];
    const recorte = curva.map((mu) => Math.min(mu, alpha));
    recortes[clave] = recorte;
    for (let i = 0; i < recorte.length; i += 1) {
      if (recorte[i] > agregado[i]) agregado[i] = recorte[i];
    }
  }

  return { universo, curvas, alphaPorSalida, recortes, agregado };
}
