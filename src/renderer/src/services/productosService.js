export const productosService = {
  async getCategorias() {
    const res = await window.api.productos.getCategorias()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener las categorías')
    }
    return res.data
  },

  async createCategoria(nombre) {
    const res = await window.api.productos.createCategoria(nombre)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al crear la categoría')
    }
    return res.data
  },

  async getAll() {
    const res = await window.api.productos.getAll()
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al obtener los productos')
    }
    return res.data
  },

  async create(data) {
    const res = await window.api.productos.create(data)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al crear el producto')
    }
    return res.data
  },

  async update(id, data) {
    const res = await window.api.productos.update(id, data)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al actualizar el producto')
    }
    return res.data
  },

  async ajustarStock(id, cantidad) {
    const res = await window.api.productos.ajustarStock(id, cantidad)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al ajustar el stock')
    }
    return res.data
  },

  async remove(id) {
    const res = await window.api.productos.remove(id)
    if (!res || !res.statusResponse) {
      throw new Error(res?.error || 'Error al eliminar el producto')
    }
    return res.data
  }
}
