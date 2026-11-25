/**
 * Formatea milisegundos a formato HH:MM:SS
 * @param {number} ms - Milisegundos transcurridos
 * @returns {string} HH:MM:SS
 */
export function formatearCronometro(ms) {
  if (!ms || ms < 0 || isNaN(ms)) return '00:00:00'

  const totalSegundos = Math.floor(ms / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60

  const hh = String(horas).padStart(2, '0')
  const mm = String(minutos).padStart(2, '0')
  const ss = String(segundos).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
}

/**
 * Calcula el tiempo jugado y el costo del tiempo en base a la fecha de inicio ISO
 * y las reglas de tarifa / cobro mínimo. La fórmula es idéntica a la del backend
 * para garantizar consistencia absoluta entre la UI en vivo y el cobro final.
 *
 * @param {string} fechaInicioIso - Timestamp ISO de inicio de la sesión
 * @param {number} tarifaHora - Tarifa por hora en Bs.
 * @param {boolean|number} cobroMinimoActivo - Si está activo el cobro mínimo (1 o true)
 * @param {number} minutosMinimos - Minutos mínimos a cobrar si aplica cobro mínimo
 * @param {number} [ahoraMs] - Milisegundos de la hora actual (opcional, defaults to Date.now())
 * @returns {{ ms: number, segundos: number, minutos: number, costoTiempo: number }}
 */
export function calcularCostoTiempo(
  fechaInicioIso,
  tarifaHora,
  cobroMinimoActivo,
  minutosMinimos,
  ahoraMs = Date.now()
) {
  if (!fechaInicioIso) {
    return { ms: 0, segundos: 0, minutos: 0, costoTiempo: 0.0 }
  }

  const inicioMs = new Date(fechaInicioIso).getTime()
  const ms = Math.max(0, ahoraMs - inicioMs)
  const segundos = Math.floor(ms / 1000)
  const minutos = Math.max(1, Math.ceil(ms / 60000))

  let minutosCobrables = minutos
  if (Boolean(cobroMinimoActivo) && minutos < (Number(minutosMinimos) || 30)) {
    minutosCobrables = Number(minutosMinimos) || 30
  }

  const tarifaPorMinuto = (Number(tarifaHora) || 25.0) / 60
  const costoBruto = minutosCobrables * tarifaPorMinuto
  const costoTiempo = Number((Math.ceil(costoBruto * 2) / 2).toFixed(2))

  return {
    ms,
    segundos,
    minutos,
    costoTiempo
  }
}
