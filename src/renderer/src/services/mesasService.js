export const mesasService = {
  async getAll() {
    const res = await window.api.mesas.getAll()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener las mesas')
    }
    return res.data
  },

  async iniciar(idMesa, notaCliente = null) {
    const res = await window.api.mesas.iniciar(idMesa, notaCliente)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al iniciar la sesión de la mesa')
    }
    return res.data
  },

  async agregarConsumos(idSesion, items) {
    const res = await window.api.mesas.agregarConsumos(idSesion, items)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al agregar consumos a la mesa')
    }
    return res.data
  },

  async actualizarConsumo(idDetalle, delta) {
    const res = await window.api.mesas.actualizarConsumo(idDetalle, delta)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al actualizar el consumo')
    }
    return res.data
  },

  async finalizar(idSesion, metodoPago) {
    const res = await window.api.mesas.finalizar(idSesion, metodoPago)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al finalizar y cobrar la sesión')
    }
    return res.data
  },

  async cambiarMesa(idSesion, idMesaDestino) {
    const res = await window.api.mesas.cambiarMesa(idSesion, idMesaDestino)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al cambiar de mesa')
    }
    return res.data
  }
}
