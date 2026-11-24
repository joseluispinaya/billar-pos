import { create } from 'zustand'
import { cajaService } from '../services/cajaService'

const getFechaLocalHoy = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const useCajaStore = create((set, get) => ({
  fechaInicio: getFechaLocalHoy(),
  fechaFin: getFechaLocalHoy(),
  kpis: {
    totalRecaudado: 0,
    totalEfectivo: 0,
    totalQr: 0,
    ingresoTiempo: 0,
    porcentajeTiempo: 0,
    ingresoConsumoMesas: 0,
    cantidadItemsMesas: 0,
    porcentajeConsumoMesas: 0,
    ingresoBarra: 0,
    cantidadVentasBarra: 0,
    cantidadItemsBarra: 0,
    porcentajeBarra: 0
  },
  sesiones: [],
  ventasBarra: [],
  loading: false,

  setFechas: (fechaInicio, fechaFin) => {
    set({ fechaInicio, fechaFin })
  },

  fetchReporte: async (fInicio, fFin) => {
    const state = get()
    const fechaInicio = fInicio || state.fechaInicio || getFechaLocalHoy()
    const fechaFin = fFin || state.fechaFin || getFechaLocalHoy()

    set({ loading: true })
    try {
      const data = await cajaService.getReporte({ fechaInicio, fechaFin })
      set({
        kpis: data.kpis,
        sesiones: data.sesiones || [],
        ventasBarra: data.ventasBarra || [],
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        loading: false
      })
      return data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  getDetalleSesion: async (idSesion) => {
    return await cajaService.getDetalleSesion(idSesion)
  },

  getDetalleVentaBarra: async (idVenta) => {
    return await cajaService.getDetalleVentaBarra(idVenta)
  }
}))
