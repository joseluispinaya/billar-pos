# 🎱 Billar POS — Sistema de Gestión y Punto de Venta

Aplicación de escritorio **offline** para Windows orientada a la administración integral de salas de billar. Permite controlar mesas con cronómetro en tiempo real, gestionar consumos de bar e inventario, realizar ventas directas, generar reportes de caja en PDF y proteger la distribución mediante licenciamiento local vinculado al hardware.

---

## ✨ Características Principales

- **Control de Mesas en Tiempo Real:**
  - Grilla visual interactiva con diferenciación clara de estados (`DISPONIBLE`, `OCUPADA` y `ACTUAL`).
  - Cronómetro reactivo en vivo por mesa con cálculo automático según la tarifa por hora y regla opcional de cobro mínimo.
  - Redondeo automático del costo de tiempo a cortes de **0.50 Bs.** hacia arriba (`Math.ceil(costo * 2) / 2`) para facilitar el manejo de efectivo.
  - **Cambio de Mesa:** Transferencia atómica de una sesión activa (tiempo transcurrido y consumos cargados) hacia cualquier mesa libre.
- **Consumos en Mesa y Ventas Directas en Barra:**
  - Modal compacto de carga de productos con búsqueda instantánea y filtros por categoría.
  - Descuento y reposición automática de stock en tiempo real mediante transacciones SQLite.
  - Módulo independiente para ventas rápidas en barra sin necesidad de abrir mesa.
- **Gestión de Inventario:**
  - CRUD completo de productos y categorías con alertas visuales de stock bajo o agotado.
- **Reporte de Caja y Exportación PDF:**
  - Resumen financiero por rango de fechas, origen (Mesas / Barra) y método de pago (`Efectivo` / `QR Simple`).
  - Generación automática de reportes detallados en PDF listos para imprimir o archivar.
- **Configuración del Local:**
  - Personalización del nombre del negocio, cantidad de mesas activas, tarifa base por hora y parámetros de cobro mínimo.
- **Protección Offline por Hardware:**
  - Sistema de activación local basado en la huella del equipo (`MachineGuid` de Windows) y validación criptográfica `HMAC-SHA256`, sin requerir conexión a internet.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Core & Empaquetado** | Electron 44, Electron-Vite 6, Electron Builder (NSIS x64) |
| **Frontend** | React 19 (JavaScript), Tailwind CSS v4, Lucide React, SweetAlert2 |
| **Estado Global** | Zustand |
| **Base de Datos** | SQLite local mediante `better-sqlite3` (modo WAL y transacciones) |
| **Reportes** | `jsPDF` + `jspdf-autotable` |

---

## 📁 Estructura del Proyecto

```text
billar-pos/
├── build/                    # Recursos del instalador Windows (icon.ico)
├── resources/                # Íconos de ventana y barra de tareas (icon.png)
├── scripts/                  # Utilidades internas de desarrollo y licenciamiento
├── src/
│   ├── main/                 # Proceso principal de Electron
│   │   ├── db/               # Conexión SQLite, esquema y consultas transaccionales
│   │   ├── ipc/              # Handlers IPC (mesas, ventas, productos, caja, ajustes, licencia)
│   │   ├── license/          # Validación de licencia offline por hardware
│   │   └── index.js          # Punto de entrada y configuración de BrowserWindow
│   ├── preload/              # Puente seguro contextBridge (window.api)
│   └── renderer/             # Interfaz React + Tailwind CSS v4
│       └── src/
│           ├── assets/       # Logos e imágenes locales
│           ├── components/   # Navbar, Modales (AgregarConsumo, CambiarMesa, etc.)
│           ├── pages/        # ControlMesas, VentasBarra, Productos, Caja, Ajustes, ActivacionLicencia
│           ├── services/     # Capa de comunicación con window.api
│           ├── store/        # Stores de Zustand
│           └── utils/        # Cálculo de tiempo/redondeo, alertas y generador PDF
├── AGENTS.md                 # Reglas de arquitectura y convenciones del proyecto
├── DESIGN_SYSTEM.md          # Tokens visuales, paleta oscura y guías UI
├── SCHEMA.md                 # Documentación del esquema de base de datos SQLite
├── electron-builder.yml      # Configuración del instalador NSIS y asarUnpack
└── package.json              # Dependencias y scripts de compilación
```

---

## 🚀 Instalación y Desarrollo

### Requisitos previos
- **Node.js** v20+ (recomendado v22 LTS)
- **Windows 10 / 11 (x64)**

### Comandos principales

```powershell
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo (HMR)
npm run dev

# 3. Compilar y probar versión empaquetada sin instalador (dist/win-unpacked/)
npm run build:unpack

# 4. Generar instalador final para Windows (dist/billar-pos-1.0.0-setup.exe)
npm run build:win
```

> **Nota sobre la base de datos y licencia:** En ejecución, la aplicación almacena automáticamente `billar.db` y `license.key` dentro del directorio de datos del usuario de Windows (`%APPDATA%\Billar POS\`).

---

## 🔐 Activación de Licencia

Al ejecutarse por primera vez en un equipo nuevo, el sistema genera un **Código de Equipo** único (`BP-XXXX-XXXX-XXXX`) y bloquea el acceso a los módulos hasta ingresar la clave correspondiente. El script de generación de claves se excluye automáticamente del instalador de producción mediante `electron-builder.yml`.

---

## 👨‍💻 Autor y Soporte

Desarrollado por **El_Zero_Byte — Desarrollo de Software**  
**Ing. José Luis Pinaya Balderrama**  
📍 Riberalta - Beni - Bolivia  
📞 Contacto: 73999726 - 75103050

---

## 📄 Licencia

Software de uso propietario. Prohibida su redistribución, copia o reventa sin autorización expresa del autor.
