/**
 * Marca gráfica: dos trapecios solapados (funciones de pertenencia). Con el color de acento
 * el segundo lleva el tinte; en monocromo se lee igual porque ambos conservan el contorno.
 */
export function Marca({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M8.5 18l4-8h4l5 8z" fill="rgb(var(--accent-tint))" />
      <path d="M2.5 18l5-11.5h5L15.5 18z" fill="none" />
    </svg>
  );
}
