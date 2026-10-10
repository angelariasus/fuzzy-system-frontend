import { useEffect, useState } from 'react';

/** Devuelve `value` con retraso. Mientras no pase el retraso, mantiene el valor anterior. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
