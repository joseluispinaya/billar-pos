import { getDatabase } from '../database'

export function getAjustes() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM ajustes WHERE id = 1').get()
}

export function updateAjustes({
  nombre_local,
  cantidad_mesas,
  tarifa_hora,
  cobro_minimo_activo,
  minutos_minimos
}) {
  const db = getDatabase()

  const transaction = db.transaction(() => {
    const currentAjustes = db.prepare('SELECT * FROM ajustes WHERE id = 1').get()
    const currentCantidad = currentAjustes ? currentAjustes.cantidad_mesas : 0
    const targetCantidad = Number(cantidad_mesas)

    if (isNaN(targetCantidad) || targetCantidad < 1) {
      throw new Error('La cantidad de mesas debe ser al menos 1.')
    }

    // Sincronización de mesas según cantidad_mesas:
    if (targetCantidad < currentCantidad) {
      // Si se reduce cantidad_mesas, verificar primero si alguna mesa con numero > cantidad_mesas tiene estado = 'OCUPADA'
      const mesaOcupada = db
        .prepare(
          `
          SELECT numero FROM mesas
          WHERE numero > ? AND estado = 'OCUPADA'
          LIMIT 1
        `
        )
        .get(targetCantidad)

      if (mesaOcupada) {
        throw new Error(
          'No puedes reducir la cantidad de mesas porque hay mesas superiores ocupadas'
        )
      }

      // Si están libres, marca activo = 0 para las mesas con numero > cantidad_mesas
      db.prepare('UPDATE mesas SET activo = 0 WHERE numero > ?').run(targetCantidad)
    } else if (targetCantidad > currentCantidad) {
      // Si se aumenta cantidad_mesas, activa (activo = 1) las mesas existentes hasta cantidad_mesas
      db.prepare('UPDATE mesas SET activo = 1 WHERE numero <= ?').run(targetCantidad)

      // E inserta las nuevas mesas faltantes (numero = i, nombre = 'Mesa ' + i, estado = 'LIBRE', activo = 1)
      const existingMesas = db
        .prepare('SELECT numero FROM mesas')
        .all()
        .map((m) => m.numero)
      const existingSet = new Set(existingMesas)

      const insertMesa = db.prepare(`
        INSERT INTO mesas (numero, nombre, estado, activo)
        VALUES (?, ?, 'LIBRE', 1)
      `)

      for (let i = 1; i <= targetCantidad; i++) {
        if (!existingSet.has(i)) {
          insertMesa.run(i, `Mesa ${i}`)
        }
      }
    }

    // Actualiza el registro id = 1 en ajustes
    db.prepare(
      `
      UPDATE ajustes
      SET nombre_local = ?,
          cantidad_mesas = ?,
          tarifa_hora = ?,
          cobro_minimo_activo = ?,
          minutos_minimos = ?
      WHERE id = 1
    `
    ).run(
      nombre_local ? String(nombre_local).trim() : 'Mi Billar',
      targetCantidad,
      Number(tarifa_hora) || 0,
      cobro_minimo_activo ? 1 : 0,
      Number(minutos_minimos) || 30
    )

    return db.prepare('SELECT * FROM ajustes WHERE id = 1').get()
  })

  return transaction()
}
