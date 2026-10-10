import { Icon, type IconProps } from './Icon';

/* Solo los glifos que cumplen una función: desplegar, confirmar, cerrar, tema y orden. */

/** Flecha hacia abajo; se rota por CSS para abrir/cerrar. */
export function Chevron(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 12.5l4.5 4.5 8.5-9.5" />
    </Icon>
  );
}

export function Cerrar(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  );
}

/** Sol: círculo central y ocho marcas cortas. */
export function Sol(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18" />
    </Icon>
  );
}

/** Luna creciente. */
export function Luna(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7z" />
    </Icon>
  );
}

/** Indicador de orden en cabeceras de tabla. `direccion` null muestra ambas puntas atenuadas. */
export function Orden({ direccion, ...props }: IconProps & { direccion: 'asc' | 'desc' | null }) {
  return (
    <Icon {...props}>
      <path d="M8 10l4-4 4 4" opacity={direccion === 'desc' ? 0.3 : 1} />
      <path d="M8 14l4 4 4-4" opacity={direccion === 'asc' ? 0.3 : 1} />
    </Icon>
  );
}
