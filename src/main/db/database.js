import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db = null

function createTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ajustes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nombre_local TEXT NOT NULL DEFAULT 'Mi Billar',
      cantidad_mesas INTEGER NOT NULL DEFAULT 8,
      tarifa_hora REAL NOT NULL DEFAULT 25.00,
      cobro_minimo_activo INTEGER NOT NULL DEFAULT 0,
      minutos_minimos INTEGER NOT NULL DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS productos (
      id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
      id_categoria INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio_venta REAL NOT NULL,
      stock_actual INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    );

    CREATE TABLE IF NOT EXISTS mesas (
      id_mesa INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA')),
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id_sesion INTEGER PRIMARY KEY AUTOINCREMENT,
      id_mesa INTEGER NOT NULL,
      nota_cliente TEXT,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      tarifa_hora_aplicada REAL NOT NULL,
      minutos_jugados INTEGER DEFAULT 0,
      costo_tiempo REAL DEFAULT 0.00,
      costo_consumo REAL DEFAULT 0.00,
      total_pagar REAL DEFAULT 0.00,
      metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'QR') OR metodo_pago IS NULL),
      estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'FINALIZADA', 'CANCELADA')),
      FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa)
    );

    CREATE TABLE IF NOT EXISTS detalle_consumo (
      id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sesion INTEGER NOT NULL,
      id_producto INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      fecha_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (id_sesion) REFERENCES sesiones(id_sesion) ON DELETE CASCADE,
      FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );

    CREATE TABLE IF NOT EXISTS ventas_directas (
      id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      nota TEXT,
      total REAL NOT NULL DEFAULT 0.00,
      metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'QR'))
    );

    CREATE TABLE IF NOT EXISTS detalle_venta_directa (
      id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venta INTEGER NOT NULL,
      id_producto INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (id_venta) REFERENCES ventas_directas(id_venta) ON DELETE CASCADE,
      FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );
  `)
}

function seedInitialData(database) {
  const runSeed = database.transaction(() => {
    // 1. Ajustes base
    database
      .prepare(
        `
        INSERT OR IGNORE INTO ajustes (id, nombre_local, cantidad_mesas, tarifa_hora, cobro_minimo_activo, minutos_minimos)
        VALUES (1, 'Mi Billar', 8, 25.00, 0, 30)
      `
      )
      .run()

    // 2. Mesas 1 a 8 si la tabla está vacía
    const mesasCount = database.prepare('SELECT COUNT(*) as count FROM mesas').get().count
    if (mesasCount === 0) {
      const insertMesa = database.prepare(`
        INSERT INTO mesas (numero, nombre, estado, activo)
        VALUES (?, ?, 'LIBRE', 1)
      `)
      for (let i = 1; i <= 8; i++) {
        insertMesa.run(i, `Mesa ${i}`)
      }
    }

    // 3. Categorías base
    const insertCategoria = database.prepare(`
      INSERT OR IGNORE INTO categorias (nombre, activo)
      VALUES (?, 1)
    `)
    insertCategoria.run('Bebidas')
    insertCategoria.run('Snacks')
    insertCategoria.run('Otros')
  })

  runSeed()
}

export function initDatabase() {
  if (db) {
    return db
  }

  const dbPath = path.join(app.getPath('userData'), 'billar.db')
  db = new Database(dbPath)

  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')

  createTables(db)
  seedInitialData(db)

  return db
}

export function getDatabase() {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada. Llama a initDatabase() primero.')
  }
  return db
}

export function closeDatabase() {
  if (db && db.open) {
    db.close()
    db = null
  }
}
