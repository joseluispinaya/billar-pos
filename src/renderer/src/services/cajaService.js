export const cajaService = {
  async getReporte(params) {
    const res = await window.api.caja.getReporte(params)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener reporte de caja')
    }
    return res.data
  },

  async getDetalleSesion(idSesion) {
    const res = await window.api.caja.getDetalleSesion(idSesion)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener detalle de sesión')
    }
    return res.data
  },

  async getDetalleVentaBarra(idVenta) {
    const res = await window.api.caja.getDetalleVentaBarra(idVenta)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener detalle de venta en barra')
    }
    return res.data
  }
}
