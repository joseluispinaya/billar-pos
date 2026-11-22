# Base de Datos Local (SQLite)

Motor: **SQLite** mediante `better-sqlite3`.  
Ubicación del archivo en producción: `path.join(app.getPath('userData'), 'billar.db')`.  
Directivas obligatorias al abrir conexión:
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
```

---

## Tablas del Sistema

### 1. `ajustes`
Almacena la configuración global del local. Solo debe existir un único registro (`id = 1`), creado automáticamente en el seed inicial si no existe.

```sql
CREATE TABLE IF NOT EXISTS ajustes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nombre_local TEXT NOT NULL DEFAULT 'Mi Billar',
    cantidad_mesas INTEGER NOT NULL DEFAULT 8,
    tarifa_hora REAL NOT NULL DEFAULT 25.00,
    cobro_minimo_activo INTEGER NOT NULL DEFAULT 0, -- 0 = Desactivado, 1 = Activado
    minutos_minimos INTEGER NOT NULL DEFAULT 30
);
```

---

### 2. `categorias`
Clasificación de productos para venta en mesas y barra.

```sql
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER NOT NULL DEFAULT 1 -- Borrado lógico (1 = Activo, 0 = Inactivo)
);
```

---

### 3. `productos`
Catálogo de bebidas, snacks y otros artículos con control de inventario.

```sql
CREATE TABLE IF NOT EXISTS productos (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    id_categoria INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta REAL NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1, -- Borrado lógico para proteger historial
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);
```

---

### 4. `mesas`
Mesas físicas del salón. Se sincronizan automáticamente con `ajustes.cantidad_mesas` (activando o desactivando mesas según la configuración, sin desactivar una mesa que esté `OCUPADA`).

```sql
CREATE TABLE IF NOT EXISTS mesas (
    id_mesa INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT NOT NULL, -- Ej: 'Mesa 1', 'Mesa 2'
    estado TEXT NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA')),
    activo INTEGER NOT NULL DEFAULT 1
);
```

---

### 5. `sesiones`
Control de uso de cada mesa y fuente principal para recuperación tras apagones y reportes de caja.

```sql
CREATE TABLE IF NOT EXISTS sesiones (
    id_sesion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mesa INTEGER NOT NULL,
    nota_cliente TEXT, -- Opcional: referencia rápida del grupo/cliente
    fecha_inicio TEXT NOT NULL, -- Timestamp ISO: '2026-11-22T20:15:00.000Z'
    fecha_fin TEXT, -- NULL mientras la sesión esté ACTIVA
    tarifa_hora_aplicada REAL NOT NULL, -- Snapshot de ajustes.tarifa_hora al iniciar
    minutos_jugados INTEGER DEFAULT 0,
    costo_tiempo REAL DEFAULT 0.00,
    costo_consumo REAL DEFAULT 0.00,
    total_pagar REAL DEFAULT 0.00,
    metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'QR') OR metodo_pago IS NULL),
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'FINALIZADA', 'CANCELADA')),
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa)
);
```

---

### 6. `detalle_consumo`
Productos cargados a una mesa durante una sesión activa.

```sql
CREATE TABLE IF NOT EXISTS detalle_consumo (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sesion INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL, -- Snapshot de productos.precio_venta
    subtotal REAL NOT NULL,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (id_sesion) REFERENCES sesiones(id_sesion) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
```

---

### 7. `ventas_directas`
Cabecera de ventas rápidas en barra (clientes que consumen sin ocupar mesa).

```sql
CREATE TABLE IF NOT EXISTS ventas_directas (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    nota TEXT, -- Opcional: ej. 'Cliente barra'
    total REAL NOT NULL DEFAULT 0.00,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'QR'))
);
```

---

### 8. `detalle_venta_directa`
Ítems vendidos en una venta directa de barra.

```sql
CREATE TABLE IF NOT EXISTS detalle_venta_directa (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL, -- Snapshot de productos.precio_venta
    subtotal REAL NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas_directas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
```

---

## Reglas de Negocio y Transacciones

1. **Iniciar Mesa:**
   - Verifica que `mesas.estado = 'LIBRE'`.
   - En transacción: cambia `mesas.estado = 'OCUPADA'` e inserta en `sesiones` copiando `ajustes.tarifa_hora` en `tarifa_hora_aplicada`.
2. **Agregar Consumo a Mesa:**
   - Verifica que `productos.stock_actual >= cantidad`.
   - En transacción: inserta en `detalle_consumo` (o incrementa cantidad/subtotal si ya existe el mismo producto en esa sesión) y resta `cantidad` de `productos.stock_actual`.
3. **Eliminar/Reducir Consumo de Mesa (antes de cobrar):**
   - En transacción: elimina/reduce el registro en `detalle_consumo` y devuelve la `cantidad` a `productos.stock_actual`.
4. **Finalizar y Cobrar Mesa:**
   - Calcula `minutos_jugados` y `costo_tiempo` (respetando `cobro_minimo_activo` y `minutos_minimos` si está activo), suma `costo_consumo` desde `detalle_consumo`, calcula `total_pagar`.
   - En transacción: actualiza `sesiones` (`fecha_fin`, montos, `metodo_pago`, `estado = 'FINALIZADA'`) y libera la mesa (`mesas.estado = 'LIBRE'`).
5. **Registrar Venta Directa (Barra):**
   - Valida stock de todos los ítems del carrito.
   - En transacción: inserta cabecera en `ventas_directas`, inserta ítems en `detalle_venta_directa` y descuenta `stock_actual` de cada producto.