# Sistema de Control y POS para Billar

## 1. Contexto del Proyecto

Aplicación de escritorio **100% offline** para la administración operativa de un salón de billar. Está diseñada para ejecutarse en una sola computadora local (Windows), sin dependencia de internet y **sin sistema de login ni gestión de usuarios** (operada directamente por el dueño).

### Funcionalidades Principales

1. **Control de Mesas:** Iniciar tiempo en mesas libres, visualizar cronómetros en vivo, cargar consumos (bebidas/snacks) a una mesa activa mediante un modal de búsqueda, y finalizar/cobrar mostrando el desglose de tiempo + consumos (Efectivo o QR).
2. **Ventas Directas (Barra):** Pantalla independiente para registrar ventas rápidas de productos a clientes que no ocupan mesa.
3. **Productos y Categorías:** Gestión de catálogo, precios de venta y control de stock en tiempo real (con borrado lógico).
4. **Caja:** Resumen de ingresos del día separando recaudación por **Mesas (tiempo + consumos)** vs. **Ventas en Barra**, y desglose por método de pago (`EFECTIVO` / `QR`).
5. **Ajustes:** Configuración del nombre del local, cantidad de mesas activas, tarifa por hora (en Bolivianos `Bs.`) y regla opcional de cobro mínimo.

### Alcance Excluido (NO implementar)

- No hay inicio de sesión, roles ni tabla de usuarios.
- No hay diferenciación por tipo de mesa/juego (Pool vs. Carambola).
- No hay funcionalidad de pausar o transferir mesas.

---

## 2. Stack Tecnológico

- **Framework Desktop:** Electron (`electron-vite`)
- **Frontend:** React + Vite (**JavaScript puro `.js`/`.jsx`**, NO TypeScript)
- **Base de Datos Local:** SQLite con `better-sqlite3` (archivo `.db` persistido en `app.getPath('userData')`)
- **Estado Global (Renderer):** Zustand (carpeta `store/`)
- **Moneda y Región:** Bolivianos (`Bs.`), idioma español.
- **Estilos:** Tailwind CSS (v4 con `@tailwindcss/vite`)
- **Íconos:** `lucide-react`
- **Alertas y Confirmaciones:** `sweetalert2` (configurado en modo oscuro)

---

## 3. Arquitectura de Carpetas

Respetar estrictamente la separación de procesos de Electron:

```text
billar-pos/
├── AGENTS.md                  # Reglas y contexto del proyecto
├── SCHEMA.md                  # Esquema oficial de la base de datos SQLite
└── src/
    ├── main/                  # Proceso Principal (Node.js + SQLite)
    │   ├── index.js           # Ciclo de vida de Electron y ventana principal
    │   ├── db/
    │   │   ├── database.js    # Conexión SQLite, PRAGMA foreign_keys, creación de tablas y seed inicial
    │   │   └── queries/       # Consultas SQL separadas por módulo (ajustes, mesas, sesiones, productos, ventas, caja)
    │   └── ipc/               # Handlers ipcMain.handle() organizados por módulo
    ├── preload/
    │   └── index.js           # Puente seguro con contextBridge.exposeInMainWorld('api', ...)
    └── renderer/              # Proceso Renderer (Interfaz React)
        ├── index.html
        └── src/
            ├── assets/        # Estilos globales, íconos, imágenes
            ├── components/    # Componentes reutilizables (Modales, tarjetas de mesa, alertas)
            ├── pages/         # Vistas principales (ControlMesas, VentasBarra, Productos, Caja, Ajustes)
            ├── services/      # Wrappers limpios sobre window.api
            ├── store/         # Estados globales (ej. useMesasStore, useAjustesStore)
            ├── utils/         # Formateadores de moneda (Bs.), tiempo (HH:MM:SS) y fechas
            ├── App.jsx
            └── main.jsx
```

---

## 4. Reglas Obligatorias para el Agente

1. **Base de Datos (`SCHEMA.md`):**
   - **Lee siempre `SCHEMA.md`** antes de crear o modificar consultas SQL, repositorios o handlers IPC.
   - Usa exactamente los nombres de tablas y columnas definidos allí (en `snake_case`).
   - Activa siempre `PRAGMA foreign_keys = ON;` y `PRAGMA journal_mode = WAL;` al iniciar la conexión SQLite.
   - Usa **transacciones (`db.transaction(...)`)** en toda operación que afecte múltiples tablas (ej. agregar/quitar consumo y actualizar `stock_actual`, finalizar sesión y liberar mesa, registrar venta directa y descontar stock).

2. **Seguridad y Comunicación IPC:**
   - El código en `src/renderer/` **NUNCA** debe importar `better-sqlite3`, `fs`, `path` ni módulos de Node/Electron directamente.
   - Toda operación con SQLite se expone mediante `ipcMain.handle` en `src/main/ipc/` y se publica en `window.api` desde `src/preload/index.js`.
   - **Formato de retorno estandarizado para todos los canales IPC:**
     - Éxito: `{ statusResponse: true, error: null, data: ... }`
     - Error: `{ statusResponse: false, error: error.message, data: null }`

3. **Resiliencia ante Apagones (Regla Crítica de Cronómetros):**
   - **NUNCA** lleves el conteo del tiempo cobrable únicamente en memoria de React.
   - Al iniciar una mesa, persiste inmediatamente el registro en `sesiones` con `fecha_inicio` (timestamp ISO) y `estado = 'ACTIVA'`.
   - En la UI, el cronómetro y el costo en vivo se calculan en cada segundo a partir de `Hora Actual - fecha_inicio`. Si la PC se apaga o reinicia, al abrir la app se recargan todas las sesiones con `estado = 'ACTIVA'` y el tiempo continúa sin pérdidas.

4. **Integridad Histórica y Borrado Lógico:**
   - Al iniciar una sesión o cargar un producto, guarda el snapshot de precios (`tarifa_hora_aplicada`, `precio_unitario`).
   - Nunca hagas `DELETE` físico de `productos` o `categorias` con historial; actualiza `activo = 0`.

5. **Lineamientos de Interfaz (UI/UX):**
   - Interfaz moderna en **modo oscuro** orientada a pantallas de escritorio (uso ágil con mouse/teclado).
   - Garantiza siempre **alto contraste y legibilidad** en los textos sobre fondos oscuros (evita grises muy tenues que dificulten la lectura).
   - Código modular, limpio y comentado solo donde aporte claridad.
