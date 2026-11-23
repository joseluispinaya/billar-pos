import { create } from 'zustand'
import { ventasService } from '../services/ventasService'
import { useProductosStore } from './useProductosStore'

export const useVentasStore = create((set, get) => ({
  carrito: [],
  metodoPago: 'EFECTIVO',
  nota: '',
  loading: false,

  setMetodoPago: (metodo) => set({ metodoPago: metodo }),
  setNota: (texto) => set({ nota: texto }),

  limpiarCarrito: () => set({ carrito: [], nota: '', metodoPago: 'EFECTIVO' }),

  agregarAlCarrito: (producto) => {
    const { carrito } = get()
    const existe = carrito.find((i) => i.id_producto === producto.id_producto)
    const stockMaximo = Number(producto.stock_actual) || 0

    if (stockMaximo <= 0) {
      throw new Error(`"${producto.nombre}" no tiene existencias disponibles.`)
    }

    if (existe) {
      if (existe.cantidad >= stockMaximo) {
        throw new Error(`Stock máximo alcanzado para "${producto.nombre}" (${stockMaximo} uds.).`)
      }
      set({
        carrito: carrito.map((i) =>
          i.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      })
    } else {
      set({
        carrito: [
          ...carrito,
          {
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            categoria_nombre: producto.categoria_nombre,
            precio_venta: Number(producto.precio_venta) || 0,
            stock_actual: stockMaximo,
            cantidad: 1
          }
        ]
      })
    }
  },

  actualizarCantidad: (id_producto, delta) => {
    const { carrito } = get()
    const item = carrito.find((i) => i.id_producto === id_producto)
    if (!item) return

    const nueva = item.cantidad + delta
    if (nueva <= 0) {
      set({ carrito: carrito.filter((i) => i.id_producto !== id_producto) })
      return
    }

    if (nueva > item.stock_actual) {
      throw new Error(`Stock máximo alcanzado (${item.stock_actual} uds.).`)
    }

    set({
      carrito: carrito.map((i) => (i.id_producto === id_producto ? { ...i, cantidad: nueva } : i))
    })
  },

  quitarDelCarrito: (id_producto) => {
    const { carrito } = get()
    set({ carrito: carrito.filter((i) => i.id_producto !== id_producto) })
  },

  confirmarVenta: async () => {
    const { carrito, metodoPago, nota } = get()
    if (carrito.length === 0) {
      throw new Error('El carrito de venta está vacío.')
    }

    set({ loading: true })
    try {
      const payload = {
        nota: nota.trim() || null,
        metodo_pago: metodoPago,
        items: carrito.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad
        }))
      }

      const venta = await ventasService.registrar(payload)
      get().limpiarCarrito()

      // Mantener sincronizado el catálogo de productos
      useProductosStore.getState().fetchProductos?.()

      set({ loading: false })
      return venta
    } catch (err) {
      set({ loading: false })
      throw err
    }
  }
}))
