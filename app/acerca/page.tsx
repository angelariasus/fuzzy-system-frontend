import type { Metadata } from 'next';
import { UnPanel } from '@/components/layout/Paneles';

export const metadata: Metadata = { title: 'Acerca del método' };

export default function PaginaAcerca() {
  return (
    <UnPanel ancho="max-w-3xl" className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Acerca del método</h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-ink">Qué es el IPA</h2>
        <p className="text-sm text-ink-muted">
          El índice de prioridad de ahorro (IPA) es un valor de 0 a 100 puntos que expresa la urgencia relativa de
          reducir carga en una vivienda. No es un porcentaje ni una cantidad de energía, y tampoco mide riesgo eléctrico:
          un IPA alto significa que conviene revisar el uso de cargas antes que con un IPA bajo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-ink">Cómo razona el sistema</h2>
        <p className="text-sm text-ink-muted">
          Es un sistema de inferencia difusa tipo Mamdani con tres entradas: potencia instantánea, número de ocupantes y
          hora del día. Cada entrada se convierte en grados de pertenencia a varias etiquetas (fuzzificación). Las 36
          reglas combinan esas etiquetas con el operador mínimo, cada regla recorta su conjunto de salida con el mínimo,
          las salidas se agregan con el máximo y el valor final es el centroide del conjunto agregado.
        </p>
        <p className="text-sm text-ink-muted">
          Todo el cálculo ocurre en el backend. Esta interfaz solo muestra lo que el backend devuelve; el único cálculo
          local es el dibujo del conjunto agregado (recortes y máximo) a partir de las curvas y los grados de activación
          que ya entregó el backend.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-ink">Cómo leer las vistas</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>Simulador: mueve una entrada y observa cómo el IPA cambia de forma gradual, sin saltos por umbrales.</li>
          <li>Explorar: barre una variable y mira la curva del IPA sobre las cinco bandas de interpretación.</li>
          <li>Lote: evalúa muchas viviendas desde un CSV y exporta los resultados.</li>
          <li>Reglas: consulta la base de 36 reglas y resalta las que activa una entrada concreta.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-ink">Limitaciones del caso de estudio</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>Potencia entre 0 y 3000 W, para una vivienda de más de 90 a 150 m² sin información específica de cargas.</li>
          <li>Hasta 6 ocupantes; se admiten valores fraccionarios, por ejemplo promedios.</li>
          <li>La hora es circular: 24:00 equivale a 00:00.</li>
          <li>Los valores fuera de estos rangos se rechazan; nunca se recortan en silencio.</li>
        </ul>
      </section>
    </UnPanel>
  );
}
