import { getDatabase } from '../database'

export function getReporteCaja({ fechaInicio, fechaFin } = {}) {
  const db = getDatabase()

  // Si no se proveen fechas, se asume la fecha local actual de SQLite
  const hoyRow = db.prepare("SELECT date('now', 'localtime') AS hoy").get()
  const hoy = hoyRow ? hoyRow.hoy : new Date().toISOString().slice(0, 10)

  let fInicio = fechaInicio || hoy
  let fFin = fechaFin || hoy

  // Asegurar orden cronológico si vienen invertidas
  if (fInicio > fFin) {
    const temp = fInicio
    fInicio = fFin
    fFin = temp
  }

  // 1. Sesiones finalizadas (Mesas)
  const sesionesStmt = db.prepare(`
    SELECT 
      s.id_sesion,
      s.id_mesa,
      m.nombre AS mesa_nombre,
      s.nota_cliente,
      s.fecha_inicio,
      s.fecha_fin,
      s.tarifa_hora_aplicada,
      s.minutos_jugados,
      s.costo_tiempo,
      s.costo_consumo,
      s.total_pagar,
      s.metodo_pago,
      s.estado,
      COALESCE(SUM(dc.cantidad), 0) AS total_items
    FROM sesiones s
    JOIN mesas m ON s.id_mesa = m.id_mesa
    LEFT JOIN detalle_consumo dc ON s.id_sesion = dc.id_sesion
    WHERE s.estado = 'FINALIZADA'
      AND date(s.fecha_fin, 'localtime') BETWEEN ? AND ?
    GROUP BY s.id_sesion
    ORDER BY s.fecha_fin DESC
  `)
  const sesiones = sesionesStmt.all(fInicio, fFin)

  // 2. Ventas directas (Barra)
  const ventasStmt = db.prepare(`
    SELECT 
      vd.id_venta,
      vd.fecha_hora,
      vd.nota,
      vd.total,
      vd.metodo_pago,
      COALESCE(SUM(dvd.cantidad), 0) AS total_items
    FROM ventas_directas vd
    LEFT JOIN detalle_venta_directa dvd ON vd.id_venta = dvd.id_venta
    WHERE date(vd.fecha_hora, 'localtime') BETWEEN ? AND ?
    GROUP BY vd.id_venta
    ORDER BY vd.fecha_hora DESC
  `)
  const ventasBarra = ventasStmt.all(fInicio, fFin)

  // 3. Cálculo de KPIs
  let totalRecaudado = 0
  let totalEfectivo = 0
  let totalQr = 0

  let ingresoTiempo = 0
  let ingresoConsumoMesas = 0
  let cantidadItemsMesas = 0

  for (const s of sesiones) {
    const tot = Number(s.total_pagar) || 0
    totalRecaudado += tot
    if (s.metodo_pago === 'EFECTIVO') totalEfectivo += tot
    if (s.metodo_pago === 'QR') totalQr += tot

    ingresoTiempo += Number(s.costo_tiempo) || 0
    ingresoConsumoMesas += Number(s.costo_consumo) || 0
    cantidadItemsMesas += Number(s.total_items) || 0
  }

  let ingresoBarra = 0
  const cantidadVentasBarra = ventasBarra.length
  let cantidadItemsBarra = 0

  for (const v of ventasBarra) {
    const tot = Number(v.total) || 0
    totalRecaudado += tot
    if (v.metodo_pago === 'EFECTIVO') totalEfectivo += tot
    if (v.metodo_pago === 'QR') totalQr += tot

    ingresoBarra += tot
    cantidadItemsBarra += Number(v.total_items) || 0
  }

  const porcentajeTiempo =
    totalRecaudado > 0 ? Number(((ingresoTiempo / totalRecaudado) * 100).toFixed(1)) : 0
  const porcentajeConsumoMesas =
    totalRecaudado > 0 ? Number(((ingresoConsumoMesas / totalRecaudado) * 100).toFixed(1)) : 0
  const porcentajeBarra =
    totalRecaudado > 0 ? Number(((ingresoBarra / totalRecaudado) * 100).toFixed(1)) : 0

  const kpis = {
    totalRecaudado: Number(totalRecaudado.toFixed(2)),
    totalEfectivo: Number(totalEfectivo.toFixed(2)),
    totalQr: Number(totalQr.toFixed(2)),
    ingresoTiempo: Number(ingresoTiempo.toFixed(2)),
    porcentajeTiempo,
    ingresoConsumoMesas: Number(ingresoConsumoMesas.toFixed(2)),
    cantidadItemsMesas,
    porcentajeConsumoMesas,
    ingresoBarra: Number(ingresoBarra.toFixed(2)),
    cantidadVentasBarra,
    cantidadItemsBarra,
    porcentajeBarra
  }

  return {
    kpis,
    sesiones,
    ventasBarra,
    fechaInicio: fInicio,
    fechaFin: fFin
  }
}

export function getDetalleSesion(id_sesion) {
  const db = getDatabase()
  const sesion = db
    .prepare(
      `
    SELECT s.*, m.nombre AS mesa_nombre
    FROM sesiones s
    JOIN mesas m ON s.id_mesa = m.id_mesa
    WHERE s.id_sesion = ?
  `
    )
    .get(id_sesion)

  if (!sesion) {
    throw new Error(`No se encontró la sesión con ID ${id_sesion}`)
  }

  const consumos = db
    .prepare(
      `
    SELECT dc.*, p.nombre AS producto_nombre
    FROM detalle_consumo dc
    JOIN productos p ON dc.id_producto = p.id_producto
    WHERE dc.id_sesion = ?
    ORDER BY dc.id_detalle ASC
  `
    )
    .all(id_sesion)

  return {
    ...sesion,
    consumos
  }
}

export function getDetalleVentaBarra(id_venta) {
  const db = getDatabase()
  const venta = db
    .prepare(
      `
    SELECT *
    FROM ventas_directas
    WHERE id_venta = ?
  `
    )
    .get(id_venta)

  if (!venta) {
    throw new Error(`No se encontró la venta con ID ${id_venta}`)
  }

  const items = db
    .prepare(
      `
    SELECT dvd.*, p.nombre AS producto_nombre
    FROM detalle_venta_directa dvd
    JOIN productos p ON dvd.id_producto = p.id_producto
    WHERE dvd.id_venta = ?
    ORDER BY dvd.id_detalle ASC
  `
    )
    .all(id_venta)

  return {
    ...venta,
    items
  }
}
