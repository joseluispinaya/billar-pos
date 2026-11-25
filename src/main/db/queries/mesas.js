import { getDatabase } from '../database'

export function getMesasConSesiones() {
  const db = getDatabase()

  // 1. Obtener todas las mesas activas ordenadas por numero ASC
  const mesas = db
    .prepare(
      `
      SELECT * FROM mesas
      WHERE activo = 1
      ORDER BY numero ASC
    `
    )
    .all()

  // 2. Para cada mesa ocupada, buscar su sesión activa y sus consumos
  const sesionStmt = db.prepare(`
    SELECT * FROM sesiones
    WHERE id_mesa = ? AND estado = 'ACTIVA'
    ORDER BY id_sesion DESC
    LIMIT 1
  `)

  const consumosStmt = db.prepare(`
    SELECT 
      dc.id_detalle,
      dc.id_sesion,
      dc.id_producto,
      dc.cantidad,
      dc.precio_unitario,
      dc.subtotal,
      dc.fecha_hora,
      p.nombre AS producto_nombre,
      p.stock_actual
    FROM detalle_consumo dc
    INNER JOIN productos p ON dc.id_producto = p.id_producto
    WHERE dc.id_sesion = ?
    ORDER BY dc.id_detalle ASC
  `)

  return mesas.map((mesa) => {
    if (mesa.estado === 'OCUPADA') {
      const sesion = sesionStmt.get(mesa.id_mesa)
      if (sesion) {
        const consumos = consumosStmt.all(sesion.id_sesion)
        return {
          ...mesa,
          sesion: {
            ...sesion,
            consumos
          }
        }
      }
    }
    return {
      ...mesa,
      sesion: null
    }
  })
}

export function iniciarSesion(id_mesa, nota_cliente = null) {
  const db = getDatabase()
  const idMesa = Number(id_mesa)

  const transaction = db.transaction(() => {
    // 1. Verificar que la mesa esté LIBRE y activa
    const mesa = db.prepare('SELECT * FROM mesas WHERE id_mesa = ? AND activo = 1').get(idMesa)
    if (!mesa) {
      throw new Error('La mesa no existe o está inactiva.')
    }
    if (mesa.estado !== 'LIBRE') {
      throw new Error(`La ${mesa.nombre} ya se encuentra ocupada.`)
    }

    // 2. Leer tarifa por hora actual desde ajustes
    const ajustes = db.prepare('SELECT tarifa_hora FROM ajustes WHERE id = 1').get()
    const tarifaAplicada = ajustes ? Number(ajustes.tarifa_hora) : 25.0

    // 3. Marcar mesa como OCUPADA
    db.prepare("UPDATE mesas SET estado = 'OCUPADA' WHERE id_mesa = ?").run(idMesa)

    // 4. Insertar sesión ACTIVA
    const fechaInicio = new Date().toISOString()
    const nota = nota_cliente ? String(nota_cliente).trim() : null

    const sesionInsert = db
      .prepare(
        `
        INSERT INTO sesiones (
          id_mesa,
          nota_cliente,
          fecha_inicio,
          tarifa_hora_aplicada,
          costo_tiempo,
          costo_consumo,
          total_pagar,
          estado
        ) VALUES (?, ?, ?, ?, 0.00, 0.00, 0.00, 'ACTIVA')
      `
      )
      .run(idMesa, nota, fechaInicio, tarifaAplicada)

    const nuevaSesion = db
      .prepare('SELECT * FROM sesiones WHERE id_sesion = ?')
      .get(sesionInsert.lastInsertRowid)

    return {
      ...mesa,
      estado: 'OCUPADA',
      sesion: {
        ...nuevaSesion,
        consumos: []
      }
    }
  })

  return transaction()
}

export function agregarConsumos(id_sesion, items) {
  const db = getDatabase()
  const idSesion = Number(id_sesion)

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Debes seleccionar al menos un producto para agregar.')
  }

  const transaction = db.transaction(() => {
    // 1. Verificar sesión ACTIVA
    const sesion = db
      .prepare("SELECT * FROM sesiones WHERE id_sesion = ? AND estado = 'ACTIVA'")
      .get(idSesion)
    if (!sesion) {
      throw new Error('La sesión no existe o no se encuentra activa.')
    }

    const prodStmt = db.prepare('SELECT * FROM productos WHERE id_producto = ? AND activo = 1')
    const findItemStmt = db.prepare(
      'SELECT * FROM detalle_consumo WHERE id_sesion = ? AND id_producto = ?'
    )
    const updateItemStmt = db.prepare(`
      UPDATE detalle_consumo
      SET cantidad = ?,
          subtotal = ?
      WHERE id_detalle = ?
    `)
    const insertItemStmt = db.prepare(`
      INSERT INTO detalle_consumo (
        id_sesion,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal
      ) VALUES (?, ?, ?, ?, ?)
    `)
    const descontarStockStmt = db.prepare(`
      UPDATE productos
      SET stock_actual = stock_actual - ?
      WHERE id_producto = ?
    `)

    for (const item of items) {
      const idProd = Number(item.id_producto)
      const cant = parseInt(item.cantidad, 10)

      if (isNaN(cant) || cant <= 0) continue

      const producto = prodStmt.get(idProd)
      if (!producto) {
        throw new Error(`El producto con ID ${idProd} no existe o está inactivo.`)
      }

      if (producto.stock_actual < cant) {
        throw new Error(
          `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock_actual}, solicitado: ${cant}.`
        )
      }

      const itemExistente = findItemStmt.get(idSesion, idProd)
      const precioUnitario = Number(producto.precio_venta)

      if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cant
        const nuevoSubtotal = Number((nuevaCantidad * precioUnitario).toFixed(2))
        updateItemStmt.run(nuevaCantidad, nuevoSubtotal, itemExistente.id_detalle)
      } else {
        const subtotal = Number((cant * precioUnitario).toFixed(2))
        insertItemStmt.run(idSesion, idProd, cant, precioUnitario, subtotal)
      }

      // Descontar del stock actual
      descontarStockStmt.run(cant, idProd)
    }

    // 2. Recalcular costo_consumo de la sesión
    const totalConsumoRow = db
      .prepare(
        `
        SELECT COALESCE(SUM(subtotal), 0) AS total_consumo
        FROM detalle_consumo
        WHERE id_sesion = ?
      `
      )
      .get(idSesion)

    const nuevoCostoConsumo = Number(totalConsumoRow.total_consumo.toFixed(2))
    db.prepare('UPDATE sesiones SET costo_consumo = ? WHERE id_sesion = ?').run(
      nuevoCostoConsumo,
      idSesion
    )

    // Devolver consumos actualizados
    const consumosActualizados = db
      .prepare(
        `
        SELECT 
          dc.id_detalle,
          dc.id_sesion,
          dc.id_producto,
          dc.cantidad,
          dc.precio_unitario,
          dc.subtotal,
          dc.fecha_hora,
          p.nombre AS producto_nombre,
          p.stock_actual
        FROM detalle_consumo dc
        INNER JOIN productos p ON dc.id_producto = p.id_producto
        WHERE dc.id_sesion = ?
        ORDER BY dc.id_detalle ASC
      `
      )
      .all(idSesion)

    return {
      id_sesion: idSesion,
      costo_consumo: nuevoCostoConsumo,
      consumos: consumosActualizados
    }
  })

  return transaction()
}

export function actualizarCantidadConsumo(id_detalle, delta) {
  const db = getDatabase()
  const idDetalle = Number(id_detalle)
  const d = parseInt(delta, 10)

  if (d !== 1 && d !== -1) {
    throw new Error('El delta de consumo debe ser +1 o -1.')
  }

  const transaction = db.transaction(() => {
    // 1. Obtener registro de detalle_consumo
    const detalle = db.prepare('SELECT * FROM detalle_consumo WHERE id_detalle = ?').get(idDetalle)
    if (!detalle) {
      throw new Error('El consumo seleccionado no existe.')
    }

    // 2. Verificar que la sesión siga activa
    const sesion = db
      .prepare("SELECT * FROM sesiones WHERE id_sesion = ? AND estado = 'ACTIVA'")
      .get(detalle.id_sesion)
    if (!sesion) {
      throw new Error('La sesión ya no está activa.')
    }

    const producto = db
      .prepare('SELECT * FROM productos WHERE id_producto = ?')
      .get(detalle.id_producto)
    if (!producto) {
      throw new Error('El producto asociado no existe.')
    }

    if (d > 0) {
      // Sumar 1: validar stock
      if (producto.stock_actual < 1) {
        throw new Error(`No hay stock suficiente de "${producto.nombre}".`)
      }
      const nuevaCantidad = detalle.cantidad + 1
      const nuevoSubtotal = Number((nuevaCantidad * detalle.precio_unitario).toFixed(2))

      db.prepare('UPDATE detalle_consumo SET cantidad = ?, subtotal = ? WHERE id_detalle = ?').run(
        nuevaCantidad,
        nuevoSubtotal,
        idDetalle
      )
      db.prepare('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?').run(
        detalle.id_producto
      )
    } else {
      // Restar 1: si llega a 0, eliminar fila
      const nuevaCantidad = detalle.cantidad - 1
      if (nuevaCantidad <= 0) {
        db.prepare('DELETE FROM detalle_consumo WHERE id_detalle = ?').run(idDetalle)
      } else {
        const nuevoSubtotal = Number((nuevaCantidad * detalle.precio_unitario).toFixed(2))
        db.prepare(
          'UPDATE detalle_consumo SET cantidad = ?, subtotal = ? WHERE id_detalle = ?'
        ).run(nuevaCantidad, nuevoSubtotal, idDetalle)
      }
      // Devolver 1 al stock
      db.prepare('UPDATE productos SET stock_actual = stock_actual + 1 WHERE id_producto = ?').run(
        detalle.id_producto
      )
    }

    // 3. Recalcular costo_consumo de la sesión
    const totalConsumoRow = db
      .prepare(
        `
        SELECT COALESCE(SUM(subtotal), 0) AS total_consumo
        FROM detalle_consumo
        WHERE id_sesion = ?
      `
      )
      .get(detalle.id_sesion)

    const nuevoCostoConsumo = Number(totalConsumoRow.total_consumo.toFixed(2))
    db.prepare('UPDATE sesiones SET costo_consumo = ? WHERE id_sesion = ?').run(
      nuevoCostoConsumo,
      detalle.id_sesion
    )

    // Devolver consumos actualizados
    const consumosActualizados = db
      .prepare(
        `
        SELECT 
          dc.id_detalle,
          dc.id_sesion,
          dc.id_producto,
          dc.cantidad,
          dc.precio_unitario,
          dc.subtotal,
          dc.fecha_hora,
          p.nombre AS producto_nombre,
          p.stock_actual
        FROM detalle_consumo dc
        INNER JOIN productos p ON dc.id_producto = p.id_producto
        WHERE dc.id_sesion = ?
        ORDER BY dc.id_detalle ASC
      `
      )
      .all(detalle.id_sesion)

    return {
      id_sesion: detalle.id_sesion,
      costo_consumo: nuevoCostoConsumo,
      consumos: consumosActualizados
    }
  })

  return transaction()
}

export function finalizarSesion(id_sesion, metodo_pago) {
  const db = getDatabase()
  const idSesion = Number(id_sesion)
  const metodo = String(metodo_pago).trim().toUpperCase()

  if (metodo !== 'EFECTIVO' && metodo !== 'QR') {
    throw new Error('El método de pago debe ser "EFECTIVO" o "QR".')
  }

  const transaction = db.transaction(() => {
    // 1. Obtener la sesión ACTIVA
    const sesion = db
      .prepare("SELECT * FROM sesiones WHERE id_sesion = ? AND estado = 'ACTIVA'")
      .get(idSesion)
    if (!sesion) {
      throw new Error('La sesión no existe o ya ha sido finalizada.')
    }

    // 2. Leer ajustes para regla de cobro mínimo
    const ajustes = db.prepare('SELECT * FROM ajustes WHERE id = 1').get()
    const cobroMinimoActivo = ajustes ? Boolean(ajustes.cobro_minimo_activo) : false
    const minutosMinimos = ajustes ? Number(ajustes.minutos_minimos) || 30 : 30

    // 3. Calcular tiempo y costo de tiempo
    const ahora = new Date()
    const inicio = new Date(sesion.fecha_inicio)
    const msJugados = Math.max(0, ahora.getTime() - inicio.getTime())
    const minutosJugados = Math.max(1, Math.ceil(msJugados / 60000))

    let minutosCobrables = minutosJugados
    if (cobroMinimoActivo && minutosJugados < minutosMinimos) {
      minutosCobrables = minutosMinimos
    }

    const tarifaHora = Number(sesion.tarifa_hora_aplicada) || 25.0
    const tarifaMinuto = tarifaHora / 60
    const costoBruto = minutosCobrables * tarifaMinuto
    const costoTiempo = Number((Math.ceil(costoBruto * 2) / 2).toFixed(2))

    // 4. Calcular costo de consumo real
    const totalConsumoRow = db
      .prepare(
        `
        SELECT COALESCE(SUM(subtotal), 0) AS total_consumo
        FROM detalle_consumo
        WHERE id_sesion = ?
      `
      )
      .get(idSesion)
    const costoConsumo = Number(totalConsumoRow.total_consumo.toFixed(2))

    // 5. Total a pagar
    const totalPagar = Number((costoTiempo + costoConsumo).toFixed(2))
    const fechaFin = ahora.toISOString()

    // 6. Actualizar sesión a FINALIZADA
    db.prepare(
      `
      UPDATE sesiones
      SET fecha_fin = ?,
          minutos_jugados = ?,
          costo_tiempo = ?,
          costo_consumo = ?,
          total_pagar = ?,
          metodo_pago = ?,
          estado = 'FINALIZADA'
      WHERE id_sesion = ?
    `
    ).run(fechaFin, minutosJugados, costoTiempo, costoConsumo, totalPagar, metodo, idSesion)

    // 7. Liberar mesa
    db.prepare("UPDATE mesas SET estado = 'LIBRE' WHERE id_mesa = ?").run(sesion.id_mesa)

    return {
      id_sesion: idSesion,
      id_mesa: sesion.id_mesa,
      minutos_jugados: minutosJugados,
      costo_tiempo: costoTiempo,
      costo_consumo: costoConsumo,
      total_pagar: totalPagar,
      metodo_pago: metodo,
      fecha_fin: fechaFin,
      estado: 'FINALIZADA'
    }
  })

  return transaction()
}

export function cambiarMesa(id_sesion, id_mesa_destino) {
  const db = getDatabase()
  const idSesion = Number(id_sesion)
  const idMesaDestino = Number(id_mesa_destino)

  const transaction = db.transaction(() => {
    // 1. Validar que la sesión exista y esté ACTIVA
    const sesion = db
      .prepare("SELECT * FROM sesiones WHERE id_sesion = ? AND estado = 'ACTIVA'")
      .get(idSesion)
    if (!sesion) {
      throw new Error('La sesión no existe o no se encuentra activa.')
    }

    // 2. Validar que la mesa destino exista, esté activa y LIBRE
    const mesaDestino = db
      .prepare('SELECT * FROM mesas WHERE id_mesa = ? AND activo = 1')
      .get(idMesaDestino)
    if (!mesaDestino) {
      throw new Error('La mesa destino no existe o está desactivada.')
    }
    if (mesaDestino.estado !== 'LIBRE') {
      throw new Error(`La ${mesaDestino.nombre} ya se encuentra ocupada.`)
    }

    const idMesaOrigen = sesion.id_mesa

    // 3. Actualizar id_mesa en la sesión
    db.prepare('UPDATE sesiones SET id_mesa = ? WHERE id_sesion = ?').run(idMesaDestino, idSesion)

    // 4. Liberar mesa origen y ocupar mesa destino
    db.prepare("UPDATE mesas SET estado = 'LIBRE' WHERE id_mesa = ?").run(idMesaOrigen)
    db.prepare("UPDATE mesas SET estado = 'OCUPADA' WHERE id_mesa = ?").run(idMesaDestino)

    return {
      id_sesion: idSesion,
      id_mesa_origen: idMesaOrigen,
      id_mesa_destino: idMesaDestino,
      mesa_destino_nombre: mesaDestino.nombre
    }
  })

  return transaction()
}
