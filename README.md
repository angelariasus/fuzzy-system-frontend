# Matiz: frontend del sistema difuso de ahorro eléctrico

Interfaz web (Next.js) para el sistema de inferencia difusa Mamdani que calcula el índice de prioridad de ahorro eléctrico (IPA, 0 a 100 puntos) de una vivienda. Está pensada para estudiantes, docentes, técnicos y residentes. Consume el backend FastAPI existente y muestra el IPA junto con el razonamiento: grados de pertenencia, reglas activadas, conjunto agregado y centroide.

## Estado de esta entrega

Este código se escribió inicialmente en un entorno sin acceso a la red. La instalación y validaciones se hacen con pnpm. Sí se comprobó lo siguiente:

- Sintaxis de los 82 archivos `.ts` y `.tsx` con el compilador de TypeScript (0 errores).
- Un typecheck laxo con las dependencias reemplazadas por stubs: detecta importaciones y tipos propios incorrectos, no tipos de React ni de las librerías. Encontró un error real (`props.index` posiblemente indefinido), ya corregido.
- Lógica pura con `tsx`: formato numérico, hora, estado en la URL, función de easing y el conjunto agregado frente al centroide del backend (34,828 contra 34,83; 54,828 contra 54,83; 10,833 contra 10,83).
- Los fixtures se generaron con una réplica de referencia del motor (no se incluye en el proyecto) que reproduce los cinco casos del informe: 10,83, 34,83, 54,83, 89,17 y 60,00.

Por eso, lo primero al clonar es correr la secuencia de la sección "Puesta en marcha" y corregir lo que falle. Las versiones de `package.json` se escribieron de memoria y no se consultaron con `pnpm view`; ver "Versiones".

## Puesta en marcha

Requisitos: Node 22 o superior y pnpm 11.

```bash
cp .env.local.example .env.local
pnpm install --frozen-lockfile
pnpm run dev
```

La interfaz queda en `http://localhost:3000`. Con el backend local en `http://localhost:8000` no hay que cambiar nada; para apuntar a otro backend, edita `NEXT_PUBLIC_API_URL` en `.env.local` y reinicia `pnpm run dev`.

`pnpm install` usa `pnpm-lock.yaml`. Haz commit de ese archivo: el workflow de CI instala con `--frozen-lockfile` y falla si no está actualizado. `next/font/google` descarga DM Sans durante `next build`, así que el build necesita red.

Antes de dar el trabajo por bueno:

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm run test
pnpm run build
```

## Variables de entorno

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL base del backend, sin barra final. Se lee en el navegador. |
| `E2E_REAL_BACKEND` | sin definir | Con `1`, activa el smoke test de Playwright contra el backend real. |

## Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm run dev` | Servidor de desarrollo. |
| `pnpm run build` | Build de producción. |
| `pnpm run lint` | ESLint (reglas de Next.js, `@typescript-eslint` y `jsx-a11y`), sin advertencias permitidas. |
| `pnpm run test` | Vitest: pruebas unitarias y de componentes. |
| `pnpm run e2e` | Playwright con todos los endpoints mockeados (`e2e/fixtures.ts`). |
| `pnpm run typecheck` | `tsc --noEmit`. |
| `pnpm run format` | Prettier. |

Para el e2e, la primera vez: `pnpm exec playwright install chromium`. El servidor de desarrollo lo levanta Playwright. Smoke test contra el backend real: `E2E_REAL_BACKEND=1 pnpm run e2e` con el backend corriendo.

## Estructura del proyecto

```
app/          rutas (simulador, explorar, lote, reglas, acerca), layout, error y not-found
components/   ui/ (design-system propio), layout/, simulador/, explorar/, lote/, reglas/, icons/
hooks/        React Query (evaluar, membresías, reglas, barrido, lote, salud) y utilidades
lib/          cliente API, esquemas zod, constantes, formato, CSV, URL, agregación, easing
types/        tipos exactos del contrato del backend
public/       casos_informe.csv y plantilla_lote.csv
tests/        Vitest y fixtures de las respuestas del backend
e2e/          Playwright
scripts/      verificar_contraste.py
```

## Cómo está construido

La lógica difusa vive solo en el backend. El frontend nunca recalcula el IPA ni la inferencia: el IPA, la interpretación, la acción sugerida, los grados de pertenencia y las reglas activadas se muestran tal como llegan. La única excepción es visual y está acotada en `lib/agregacion.ts` y `components/simulador/AgregacionChart.tsx`: para dibujar el conjunto agregado se recorta cada curva de salida de `/api/membresias` con el grado de activación que ya trae `reglas_activadas` y se toma el máximo punto a punto. La línea del centroide se rotula con el `ipa` del backend. `tests/agregacion.test.ts` comprueba que ese dibujo es coherente con el centroide oficial (tolerancia de 0,2), de modo que no se convierta en una segunda fuente de verdad.

Los datos de servidor van con React Query y no con estado local. Las curvas de pertenencia y las 36 reglas son estáticas (`staleTime: Infinity`), se precargan al montar el layout y las comparten el simulador y `/reglas`, de modo que abrir la página de reglas no repite la petición. La evaluación también tiene `staleTime: Infinity` porque la función es determinista: volver a una entrada ya vista no consulta al backend. Las peticiones obsoletas se cancelan con la señal de React Query.

El simulador evalúa en vivo, sin botón de enviar. Cada cambio válido espera 250 ms (debounce) antes de pedir el resultado, y `keepPreviousData` mantiene visible el resultado anterior mientras llega el nuevo, de modo que arrastrar un slider no provoca parpadeos de skeleton. La carga se comunica con una barra lineal de 2 px que solo aparece si la petición supera 300 ms. Las entradas inválidas no disparan peticiones. Los skeletons se usan solo en la primera carga.

El estado del simulador va en la URL (`?p=1900&n=3&h=12`) con `router.replace` sin scroll: el enlace se puede compartir y `/reglas` y `/explorar` pueden abrir el simulador con una entrada concreta. Los parámetros inválidos se ignoran y se usan los valores por defecto (1900, 3, 12).

Layout de alto fijo: el `body` no tiene scroll y cada panel desplaza por su cuenta. En móvil hay una barra compacta con el IPA entre `main` y el pie, montada con un portal en el hueco `#barra-inferior` del shell (no es `position: fixed`).

`Colapsable` separa medir de restringir. Mientras los datos cambian no tiene `max-height` ni transición y crece libre; un frame después de que se estabilizan (`requestAnimationFrame`) se mide el contenido y recién entonces se aplica el límite. Así un slider que añade o quita reglas no anima la altura ni mueve el scroll.

## Decisiones de diseño

### Skills

| Skill pedida | Estado en esta sesión |
| --- | --- |
| Emil Kowalski | No disponible. No se aplicó. Para movimiento y pulido se usaron las secciones 11 a 16 del documento de requisitos. |
| Impeccable Design | Disponible solo el `SKILL.md`; faltan sus `reference/*.md` y el script `impeccable context`, por lo que no se ejecutó el flujo de contexto. Reglas aplicadas: "the brief wins" (se respetan paleta, tipografías e iconos pedidos), modo Operate para una herramienta (legibilidad y consistencia por encima de la expresión) y una sola pasada de verificación acotada. |
| Taste (`design-taste-frontend`) | Disponible. Su propio texto indica que está pensada para landing pages y portfolios, no para dashboards, así que se usó de forma parcial. Reglas aplicadas: estados completos (skeleton con la forma final, vacío, error en línea), `prefers-reduced-motion` respetado, animar solo `transform` y `opacity`, diseño pensado para ambos temas desde el inicio, botones de una sola línea y contraste de formularios, y cero guiones largos en el copy. |

Conflictos resueltos por la regla de precedencia (primero el brief de identidad): Taste prohíbe dibujar iconos a mano y recomienda librerías de iconos, Tailwind v4 y el paquete `motion`; el brief exige iconos 100 % propios, `tailwind.config.ts` (Tailwind 3) y `framer-motion`, y eso es lo que se hizo. El resultado no pasó por esas dos skills en esos puntos.

### Tokens por tema y contraste

Los valores salen del brief y se calculan con `python3 scripts/verificar_contraste.py` (fórmula WCAG 2.x). Mínimos sobre `canvas`, `surface` y `surface-sunken`:

| Par | Claro | Oscuro |
| --- | --- | --- |
| `ink` | 13,87 | 14,40 |
| `ink-muted` | 6,35 | 8,63 |
| `ink-faint` | 4,54 | 6,28 |
| `accent` sobre `canvas` | 8,91 | 6,98 |
| `on-accent` sobre `accent` | 9,60 | 6,98 |
| `danger` | 5,61 | 6,91 |
| `warning` | 5,06 | 8,49 |
| `success` | 4,87 | 7,67 |
| `ink` sobre badge de nivel (nivel-N al 20 % sobre `surface`), mínimo de los 5 | 11,11 | 10,30 |
| Paso mínimo entre niveles contiguos | 1,32 | 1,22 |

Cambios y límites respecto del brief:

- `success` en claro pasó de `#1A7F4B` (4,29:1 sobre `surface-sunken`, por debajo de AA) a `#17754A`.
- `curva-1` y `curva-3` en claro dan 3,87 y 3,61 contra las superficies: sirven como trazo (mínimo 3:1 para elementos gráficos) pero no como texto. Por eso los rótulos de las curvas van en `ink-muted` y el color solo se usa en la línea.
- La rampa `nivel-1` a `nivel-5` es monótona en luminancia (decreciente en claro, creciente en oscuro) y el nivel siempre lleva texto además del color.
- El brief indicaba 7,0 para `accent` y `on-accent` en oscuro; el valor calculado es 6,98.

### Tipografías

DM Sans se usa en toda la interfaz, incluidos valores, ejes de gráficos, fórmulas y códigos de regla. No se usa una tipografía monoespaciada ni `tabular-nums`.

### Supuestos (confirmar o reemplazar)

- Nombre "Matiz" y subtítulo "Sistema de inferencia difusa · Grupo 6 · UNMSM". Comprobar que no choque con marcas existentes antes de publicar.
- Marca gráfica: dos trapecios solapados dibujados para este proyecto.
- Tema claro por defecto, con toggle y sin seguir el sistema operativo.
- Los cuatro casos de ejemplo son las corridas 300 W / 4 / 12 h, 1900 W / 3 / 12 h, 1900 W / 3 / 19 h y 2800 W / 1 / 2 h. Los títulos "Caso 1" a "Caso 4" y la etiqueta "Ejemplo del informe" son del equipo de diseño.
- Copy de la interfaz no tomado del informe: etiquetas de los campos, textos de ayuda de ocupantes y hora, mensajes de error, textos de estados vacío, y los párrafos de "Acerca del método".
- Los textos de `accion_sugerida` en `tests/fixtures/` son inventados salvo el de nivel Baja; el frontend siempre muestra el que devuelve el backend.
- Orden de las reglas en los fixtures: R1 a R36 con potencia como eje externo, luego ocupantes y luego bloque (consistente con R20 y R32 del informe). Los fixtures usan la función ordinal descrita en el documento de requisitos.
- Los iconos son pocos a propósito: chevron, check, cerrar, sol, luna, indicador de orden y la marca. No hay glifos para las variables de entrada.

## Alcance y limitaciones

Potencia de 0 a 3000 W, hasta 6 ocupantes (admite fraccionarios), hora circular (24:00 equivale a 00:00), vivienda de más de 90 a 150 m² sin información específica de cargas. Un valor fuera de rango se marca como error y no se recorta. La curva de `/explorar` no se presenta como monótona: el sistema solo asegura monotonía en las etiquetas de las reglas, no en el valor continuo.

## Pruebas

| Nivel | Archivos | Cobertura |
| --- | --- | --- |
| Unitarias (Vitest) | `tests/schemas.test.ts`, `format.test.ts`, `csv.test.ts`, `url-state.test.ts`, `agregacion.test.ts` | Bordes del dominio, coma decimal, `HH:MM`, filas de CSV con número de fila, límite de 1000 filas, exportación, estado en la URL y coherencia del agregado con el centroide. |
| Componentes (React Testing Library) | `tests/EntradasPanel.test.tsx` | Sincronización slider y campo, errores accesibles, entrada inválida sin emisión, casos de ejemplo. |
| E2E (Playwright) | `e2e/simulador.spec.ts`, `lote.spec.ts`, `reglas.spec.ts` | Carga con 34,83 / Baja / R20 / R32, debounce y URL, 422, 500, lote válido y con errores, 36 reglas y resaltado, curva de `/explorar`, `body` sin scroll en las cinco vistas, toggle de tema. |

Los endpoints se mockean con `page.route` en `e2e/fixtures.ts`. El smoke test contra el backend real solo corre con `E2E_REAL_BACKEND=1`. Ninguna de estas pruebas se ha ejecutado todavía (ver "Estado de esta entrega"); `tests/` y `e2e/` se escribieron sin poder correrlas, así que es probable que alguna aserción necesite ajustes.

## Despliegue en Vercel

El despliegue no necesita `vercel.json`. Define `NEXT_PUBLIC_API_URL` con la URL del backend desplegado y agrega el dominio de Vercel (por ejemplo `https://tu-proyecto.vercel.app`) a `cors_allowed_origins` del backend. Sin eso el navegador bloquea las peticiones.

## Correspondencia informe a pantalla

| Elemento del informe | Componente |
| --- | --- |
| Fuzzificación | `FuzzificacionPanel` y `CurvasMembresia` |
| Tabla 8 (reglas activadas) | `ReglasActivadasTable` |
| Figura 4 (agregación y centroide) | `AgregacionChart` |
| Tabla 6 (base de reglas) | `MatrizReglas` |
| Tabla 9 (interpretación y acción) | `MedidorIPA` |

## Comprobaciones manuales pendientes

No se pudo abrir un navegador. Revisar a mano:

- Ambos temas en las cinco vistas.
- Estados vacío, carga y error en simulador, explorar, lote y reglas.
- Que nada salte al arrastrar los sliders (números del IPA, altura de la tabla de reglas, errores de validación).
- Que el `body` no tenga scroll en escritorio ni en móvil.
- Tooltips y desplegables cerca del borde inferior (deben abrirse hacia arriba).
- Rotulado de las curvas de pertenencia: las etiquetas pueden solaparse cuando dos curvas tienen el pico cercano.
- Foco visible en todos los controles, incluido el thumb de los sliders.
- Que `next/font` cargue DM Sans.

## Versiones

Las versiones de `package.json` son exactas y las más recientes estables que se conocían al escribir el proyecto, pero **no se verificaron** con `pnpm view` por falta de red. Después de `pnpm install`, conviene correr `pnpm outdated` y revisar la compatibilidad entre `react`, `recharts`, `framer-motion`, `next-themes` y `@tanstack/react-query`. Si un paquete obliga a bajar de versión, anota aquí cuál y por qué.

## Contexto académico

UNMSM, curso Sistemas Inteligentes, Grupo 6.
