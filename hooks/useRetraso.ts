import { useEffect, useState } from 'react';

/**
 * Devuelve true solo si `activo` lleva `ms` milisegundos seguido en true.
 * Se usa para que la barra de carga no parpadee en peticiones rápidas.
 */
export function useRetraso(activo: boolean, ms = 300): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!activo) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), ms);
    return () => clearTimeout(id);
  }, [activo, ms]);

  return visible;
}
