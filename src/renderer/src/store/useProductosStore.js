import { create } from 'zustand'
import { productosService } from '../services/productosService'

export const useProductosStore = create((set, get) => ({
  productos: [],
  categorias: [],
  loading: false,
  error: null,

  fetchCategorias: async () => {
    try {
      const data = await productosService.getCategorias()
      set({ categorias: data })
      return data
    } catch (err) {
      console.error('Error fetching categorias:', err)
      throw err
    }
  },

  createCategoria: async (nombre) => {
    try {
      const nueva = await productosService.createCategoria(nombre)
      const current = get().categorias
      const exists = current.some((c) => c.id_categoria === nueva.id_categoria)
      if (!exists) {
        set({ categorias: [...current, nueva] })
      }
      return nueva
    } catch (err) {
      console.error('Error creating categoria:', err)
      throw err
    }
  },

  fetchProductos: async () => {
    set({ loading: true, error: null })
    try {
      const data = await productosService.getAll()
      set({ productos: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  createProducto: async (productoData) => {
    set({ loading: true, error: null })
    try {
      const nuevo = await productosService.create(productoData)
      set((state) => ({
        productos: [...state.productos, nuevo],
        loading: false
      }))
      return nuevo
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateProducto: async (id, productoData) => {
    set({ loading: true, error: null })
    try {
      const updated = await productosService.update(id, productoData)
      set((state) => ({
        productos: state.productos.map((p) => (p.id_producto === id ? updated : p)),
        loading: false
      }))
      return updated
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  ajustarStock: async (id, cantidad) => {
    try {
      const updated = await productosService.ajustarStock(id, cantidad)
      set((state) => ({
        productos: state.productos.map((p) => (p.id_producto === id ? updated : p))
      }))
      return updated
    } catch (err) {
      console.error('Error adjusting stock:', err)
      throw err
    }
  },

  deleteProducto: async (id) => {
    set({ loading: true, error: null })
    try {
      await productosService.remove(id)
      set((state) => ({
        productos: state.productos.filter((p) => p.id_producto !== id),
        loading: false
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))
