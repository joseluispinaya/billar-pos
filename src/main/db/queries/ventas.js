import { getDatabase } from '../database'

export function registrarVentaDirecta({ nota = null, metodo_pago, items }) {
  const db = getDatabase()

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El carrito de venta no puede estar vacío.')
  }

  const metodo = String(metodo_pago).trim().toUpperCase()
  if (metodo !== 'EFECTIVO' && metodo !== 'QR') {
    throw new Error('El método de pago debe ser "EFECTIVO" o "QR".')
  }

  const transaction = db.transaction(() => {
    const prodStmt = db.prepare('SELECT * FROM productos WHERE id_producto = ? AND activo = 1')
    const descontarStockStmt = db.prepare(
      'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?'
    )

    let totalCalculado = 0
    const itemsValidados = []

    for (const item of items) {
      const idProd = Number(item.id_producto)
      const cant = parseInt(item.cantidad, 10)

      if (isNaN(cant) || cant <= 0) {
        throw new Error('La cantidad de cada producto debe ser un entero mayor a 0.')
      }

      const producto = prodStmt.get(idProd)
      if (!producto) {
        throw new Error(`El producto con ID ${idProd} no existe o está inactivo.`)
      }

      if (producto.stock_actual < cant) {
        throw new Error(
          `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock_actual}, solicitado: ${cant}.`
        )
      }

      const precioUnitario = Number(producto.precio_venta)
      const subtotal = Number((cant * precioUnitario).toFixed(2))
      totalCalculado += subtotal

      itemsValidados.push({
        id_producto: idProd,
        cantidad: cant,
        precio_unitario: precioUnitario,
        subtotal
      })
    }

    totalCalculado = Number(totalCalculado.toFixed(2))
    const notaLimpiada = nota ? String(nota).trim() : null

    // 1. Insertar cabecera de ventas_directas
    const insertVentaStmt = db.prepare(`
      INSERT INTO ventas_directas (nota, total, metodo_pago)
      VALUES (?, ?, ?)
    `)
    const ventaResult = insertVentaStmt.run(notaLimpiada, totalCalculado, metodo)
    const idVenta = ventaResult.lastInsertRowid

    // 2. Insertar cada ítem en detalle_venta_directa y descontar stock
    const insertDetalleStmt = db.prepare(`
      INSERT INTO detalle_venta_directa (id_venta, id_producto, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const item of itemsValidados) {
      insertDetalleStmt.run(
        idVenta,
        item.id_producto,
        item.cantidad,
        item.precio_unitario,
        item.subtotal
      )
      descontarStockStmt.run(item.cantidad, item.id_producto)
    }

    return db.prepare('SELECT * FROM ventas_directas WHERE id_venta = ?').get(idVenta)
  })

  return transaction()
}

export function getVentasHoy() {
  const db = getDatabase()
  return db
    .prepare(
      `
      SELECT * FROM ventas_directas
      WHERE date(fecha_hora) = date('now', 'localtime')
      ORDER BY id_venta DESC
    `
    )
    .all()
}
