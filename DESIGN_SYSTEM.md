# Sistema de Diseño Visual

Este documento define las reglas visuales obligatorias para toda la interfaz de **Billar POS**. El agente debe leerlo antes de crear o modificar cualquier vista o componente en `src/renderer/src/`.

---

## 1. Filosofía Visual

- **Modo Oscuro Nocturno (NO negro puro):** La interfaz usa una escala de azul marino profundo diseñada para operar en ambientes con poca luz sin fatiga visual.
- **Prohibido usar colores oscuros genéricos:** No uses `bg-black`, `bg-zinc-950`, `bg-neutral-900` ni `bg-gray-900`. Usa estrictamente los tokens definidos en `@theme` dentro de `src/renderer/src/assets/main.css`.
- **Alto Contraste:** Todos los textos, etiquetas y valores numéricos deben ser legibles de inmediato sobre fondos oscuros.
- **Stack UI:** Tailwind CSS v4 + `lucide-react` para íconos + `sweetalert2` (a través de `src/renderer/src/utils/alertas.js`).

---

## 2. Tokens de Color (`main.css`)

| Token Tailwind             | Hex       | Uso Principal                                                                                       |
| :------------------------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| `surface` / `surface-dim`  | `#0b1326` | Fondo base de la aplicación (`body` y canvas de páginas).                                           |
| `surface-container-lowest` | `#060e20` | Backdrops de modales (`bg-surface-container-lowest/80`) y sombras profundas.                        |
| `surface-container-low`    | `#131b2e` | Tarjetas principales, KPIs, paneles de mesas y contenedores de tablas.                              |
| `surface-container`        | `#171f33` | Cabeceras de tablas, toolbars, pies de paginación y bloques internos.                               |
| `surface-container-high`   | `#222a3d` | Inputs, selects, botones secundarios, pestañas inactivas y Navbar (`bg-surface-container-high/90`). |
| `surface-bright`           | `#31394d` | Estado `:hover` de botones secundarios e inputs enfocados.                                          |
| `surface-variant`          | `#2d3449` | Bordes estructurales (`border-surface-variant/30` o `/50`) y divisores.                             |
| `on-surface`               | `#dae2fd` | Texto principal, títulos, nombres de productos y montos.                                            |
| `on-surface-variant`       | `#bbcabf` | Subtítulos, etiquetas secundarias, encabezados de columnas y placeholders.                          |
| `primary`                  | `#4edea3` | Acción principal, pestaña activa, mesa ocupada, valores monetarios destacados.                      |
| `on-primary`               | `#003824` | Texto e íconos sobre fondos `bg-primary` (siempre en `font-bold`).                                  |
| `primary-container`        | `#10b981` | Estado `:hover` de botones primarios y acentos de borde activo.                                     |
| `secondary`                | `#68dba9` | Indicadores positivos secundarios y estados confirmados.                                            |
| `tertiary`                 | `#ffb95f` | Alertas moderadas (ej. `Stock Bajo`, avisos operativos).                                            |
| `tertiary-container`       | `#e29100` | Fondos translúcidos de alerta (`bg-tertiary-container/10` o `/30`).                                 |
| `error`                    | `#ffb4ab` | Alertas críticas (`Agotado`, validaciones, acciones de eliminación).                                |
| `error-container`          | `#93000a` | Fondos de error (`bg-error-container/10` en filas agotadas, hover en botón eliminar).               |

---

## 3. Tipografía y Datos Numéricos

- **Fuente base:** `Inter` (configurada en `main.css`).
- **Números Tabulares (Obligatorio):** Aplica siempre la clase `tabular-nums` en cronómetros en vivo (`HH:MM:SS`), relojes, precios en Bolivianos (`Bs.`), cantidades de stock y totales de caja para evitar saltos visuales al actualizarse.
- **Formato de Moneda:** Siempre en Bolivianos con 2 decimales (ej. `25.00 Bs.` o `Bs. 25.00`).
- **Etiquetas de sección / tabla:** `text-xs uppercase tracking-wider font-semibold text-on-surface-variant`.

---

## 4. Formas, Bordes y Elevación

- **Tarjetas y contenedores principales:** `rounded-xl` + `bg-surface-container-low/95` + `border border-surface-variant/30`.
- **Botones, inputs y tabs internos:** `rounded-lg` o `rounded-md`.
- **Pills y badges de estado:** `rounded-full` o `rounded-md` compacto con punto indicador (`w-1.5 h-1.5 rounded-full`).
- **Efecto de Mesa Activa (Glow):** Borde `border-primary` (`1.5px` o `2px`) con resplandor sutil `shadow-[0_0_16px_-2px_rgba(78,222,163,0.3)]`.

---

## 5. Patrones de Componentes

### Botones

- **Primario:** `bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-[0.98]`
- **Secundario:** `bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-variant/40 rounded-lg transition-colors`
- **Peligro / Eliminar:** `bg-surface-container-high hover:bg-error-container text-on-surface-variant hover:text-on-error-container rounded-md transition-colors`

### Inputs y Selects

- Fondo `bg-surface-container-high`, texto `text-on-surface`, placeholder `placeholder:text-on-surface-variant/60`, borde `border border-surface-variant/40`, foco `focus:outline-none focus:border-primary/60 focus:bg-surface-bright`.

### Tablas

- Contenedor: `bg-surface-container-low/95 rounded-xl overflow-hidden border border-surface-variant/30`.
- Toolbar superior: `bg-surface-container/60 p-3`.
- Cabecera: `bg-surface-container text-on-surface-variant text-xs uppercase tracking-wider`.
- Filas: `divide-y divide-surface-variant/20 divide-dashed` con `hover:bg-surface-container/40`.
- Paginación inferior: `bg-surface-container/70` con página activa en `bg-primary text-on-primary font-bold`.

### Badges de Estado

- **Activo / En Stock / Ocupada:** `bg-primary/10 text-primary` con punto `bg-primary`.
- **Alerta / Stock Bajo:** `bg-tertiary-container/30 text-tertiary`.
- **Crítico / Agotado:** `bg-error-container/40 text-error`.
- **Libre / Inactivo:** `bg-surface-container-high text-on-surface-variant`.

### Modales y Alertas

- Usa siempre el componente reutilizable `src/renderer/src/components/Modal.jsx` para formularios y acciones en pantalla.
- Usa exclusivamente `toastSuccess`, `toastError` y `confirmarAccion` desde `src/renderer/src/utils/alertas.js` para cualquier feedback o confirmación.

---

## 6. Reglas de Código Tailwind

- **No modifiques `Navbar.jsx`** al trabajar en módulos individuales, salvo instrucción explícita.
- Usa **clases canónicas de Tailwind** (ej. `min-w-7` en lugar de `min-w-[28px]`, `h-16` en lugar de `h-[64px]`) para mantener el proyecto libre de advertencias de IntelliSense.
