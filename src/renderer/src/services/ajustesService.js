export const ajustesService = {
  async get() {
    const res = await window.api.ajustes.get()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener los ajustes')
    }
    return res.data
  },

  async update(data) {
    const res = await window.api.ajustes.update(data)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al actualizar los ajustes')
    }
    return res.data
  }
}
