import { getDatabase } from '../database'

export function getCategorias() {
  const db = getDatabase()
  return db
    .prepare(
      `
      SELECT * FROM categorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `
    )
    .all()
}

export function createCategoria(nombre) {
  const db = getDatabase()
  const trimmed = (nombre || '').trim()
  if (!trimmed) {
    throw new Error('El nombre de la categoría no puede estar vacío.')
  }

  const existing = db
    .prepare('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER(?)')
    .get(trimmed)

  if (existing) {
    if (existing.activo === 0) {
      db.prepare('UPDATE categorias SET activo = 1 WHERE id_categoria = ?').run(
        existing.id_categoria
      )
      return db
        .prepare('SELECT * FROM categorias WHERE id_categoria = ?')
        .get(existing.id_categoria)
    }
    return existing
  }

  const info = db.prepare('INSERT INTO categorias (nombre, activo) VALUES (?, 1)').run(trimmed)
  return db.prepare('SELECT * FROM categorias WHERE id_categoria = ?').get(info.lastInsertRowid)
}

export function getProductos() {
  const db = getDatabase()
  return db
    .prepare(
      `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.activo = 1
      ORDER BY p.nombre ASC
    `
    )
    .all()
}

export function createProducto({ id_categoria, nombre, descripcion, precio_venta, stock_actual }) {
  const db = getDatabase()
  const trimmedNombre = (nombre || '').trim()
  if (!trimmedNombre) {
    throw new Error('El nombre del producto es obligatorio.')
  }
  const idCat = Number(id_categoria)
  if (!idCat || isNaN(idCat)) {
    throw new Error('La categoría seleccionada no es válida.')
  }
  const precio = Number(precio_venta)
  if (isNaN(precio) || precio < 0) {
    throw new Error('El precio de venta debe ser un número mayor o igual a 0.')
  }
  const stock = parseInt(stock_actual, 10)
  if (isNaN(stock) || stock < 0) {
    throw new Error('El stock actual debe ser un número entero mayor o igual a 0.')
  }

  const info = db
    .prepare(
      `
      INSERT INTO productos (id_categoria, nombre, descripcion, precio_venta, stock_actual, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `
    )
    .run(idCat, trimmedNombre, descripcion ? String(descripcion).trim() : null, precio, stock)

  return db
    .prepare(
      `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = ?
    `
    )
    .get(info.lastInsertRowid)
}

export function updateProducto(
  id_producto,
  { id_categoria, nombre, descripcion, precio_venta, stock_actual }
) {
  const db = getDatabase()
  const idProd = Number(id_producto)
  if (!idProd || isNaN(idProd)) {
    throw new Error('ID de producto no válido.')
  }
  const trimmedNombre = (nombre || '').trim()
  if (!trimmedNombre) {
    throw new Error('El nombre del producto es obligatorio.')
  }
  const idCat = Number(id_categoria)
  if (!idCat || isNaN(idCat)) {
    throw new Error('La categoría seleccionada no es válida.')
  }
  const precio = Number(precio_venta)
  if (isNaN(precio) || precio < 0) {
    throw new Error('El precio de venta debe ser un número mayor o igual a 0.')
  }
  const stock = parseInt(stock_actual, 10)
  if (isNaN(stock) || stock < 0) {
    throw new Error('El stock actual debe ser un número entero mayor o igual a 0.')
  }

  db.prepare(
    `
    UPDATE productos
    SET id_categoria = ?,
        nombre = ?,
        descripcion = ?,
        precio_venta = ?,
        stock_actual = ?
    WHERE id_producto = ?
  `
  ).run(
    idCat,
    trimmedNombre,
    descripcion ? String(descripcion).trim() : null,
    precio,
    stock,
    idProd
  )

  return db
    .prepare(
      `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = ?
    `
    )
    .get(idProd)
}

export function ajustarStock(id_producto, cantidadSumar) {
  const db = getDatabase()
  const idProd = Number(id_producto)
  if (!idProd || isNaN(idProd)) {
    throw new Error('ID de producto no válido.')
  }
  const cantidad = parseInt(cantidadSumar, 10)
  if (isNaN(cantidad) || cantidad === 0) {
    throw new Error('La cantidad a ajustar debe ser un número entero diferente de 0.')
  }

  const transaction = db.transaction(() => {
    const prod = db.prepare('SELECT stock_actual FROM productos WHERE id_producto = ?').get(idProd)
    if (!prod) {
      throw new Error('Producto no encontrado.')
    }
    const nuevoStock = prod.stock_actual + cantidad
    if (nuevoStock < 0) {
      throw new Error(
        `Stock insuficiente. El stock actual es ${prod.stock_actual} y no puede quedar negativo.`
      )
    }

    db.prepare('UPDATE productos SET stock_actual = ? WHERE id_producto = ?').run(
      nuevoStock,
      idProd
    )

    return db
      .prepare(
        `
        SELECT p.*, c.nombre AS categoria_nombre
        FROM productos p
        INNER JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?
      `
      )
      .get(idProd)
  })

  return transaction()
}

export function deleteProducto(id_producto) {
  const db = getDatabase()
  const idProd = Number(id_producto)
  if (!idProd || isNaN(idProd)) {
    throw new Error('ID de producto no válido.')
  }

  db.prepare('UPDATE productos SET activo = 0 WHERE id_producto = ?').run(idProd)
  return { id_producto: idProd, success: true }
}
