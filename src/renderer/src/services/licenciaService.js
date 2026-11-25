export const licenciaService = {
  async verificar() {
    const res = await window.api.licencia.verificar()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al verificar la licencia.')
    }
    return res.data
  },

  async activar(clave) {
    const res = await window.api.licencia.activar(clave)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al activar la licencia.')
    }
    return res.data
  }
}
