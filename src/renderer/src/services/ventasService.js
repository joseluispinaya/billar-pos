export const ventasService = {
  async registrar(data) {
    const res = await window.api.ventas.registrar(data)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al registrar la venta en barra')
    }
    return res.data
  },

  async getHoy() {
    const res = await window.api.ventas.getHoy()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener las ventas de hoy')
    }
    return res.data
  }
}
