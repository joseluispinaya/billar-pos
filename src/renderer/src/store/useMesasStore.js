import { create } from 'zustand'
import { mesasService } from '../services/mesasService'
import { useProductosStore } from './useProductosStore'

export const useMesasStore = create((set, get) => ({
  mesas: [],
  mesaSeleccionadaId: null,
  loading: false,
  error: null,

  seleccionarMesa: (id) => {
    set({ mesaSeleccionadaId: id })
  },

  fetchMesas: async () => {
    set({ loading: true, error: null })
    try {
      const data = await mesasService.getAll()
      set({ mesas: data, loading: false })

      // Si la mesa actualmente seleccionada ya no existe o está libre, verificar
      const actualId = get().mesaSeleccionadaId
      if (actualId) {
        const mesa = data.find((m) => m.id_mesa === actualId)
        if (!mesa || mesa.estado !== 'OCUPADA') {
          // Dejar null si ya no está ocupada
          set({ mesaSeleccionadaId: null })
        }
      }

      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  iniciarMesa: async (idMesa, notaCliente = null) => {
    set({ loading: true, error: null })
    try {
      const mesaIniciada = await mesasService.iniciar(idMesa, notaCliente)

      set((state) => ({
        mesas: state.mesas.map((m) => (m.id_mesa === idMesa ? mesaIniciada : m)),
        mesaSeleccionadaId: idMesa,
        loading: false
      }))

      return mesaIniciada
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  agregarConsumos: async (idSesion, items) => {
    const result = await mesasService.agregarConsumos(idSesion, items)

    set((state) => ({
      mesas: state.mesas.map((m) => {
        if (m.sesion && m.sesion.id_sesion === idSesion) {
          return {
            ...m,
            sesion: {
              ...m.sesion,
              costo_consumo: result.costo_consumo,
              consumos: result.consumos
            }
          }
        }
        return m
      })
    }))

    // Refrescar inventario en useProductosStore
    useProductosStore.getState().fetchProductos?.()

    return result
  },

  actualizarConsumo: async (idDetalle, delta) => {
    const result = await mesasService.actualizarConsumo(idDetalle, delta)

    set((state) => ({
      mesas: state.mesas.map((m) => {
        if (m.sesion && m.sesion.id_sesion === result.id_sesion) {
          return {
            ...m,
            sesion: {
              ...m.sesion,
              costo_consumo: result.costo_consumo,
              consumos: result.consumos
            }
          }
        }
        return m
      })
    }))

    // Refrescar inventario en useProductosStore
    useProductosStore.getState().fetchProductos?.()

    return result
  },

  finalizarMesa: async (idSesion, metodoPago) => {
    set({ loading: true, error: null })
    try {
      const result = await mesasService.finalizar(idSesion, metodoPago)

      set((state) => ({
        mesas: state.mesas.map((m) => {
          if (m.id_mesa === result.id_mesa) {
            return {
              ...m,
              estado: 'LIBRE',
              sesion: null
            }
          }
          return m
        }),
        mesaSeleccionadaId:
          state.mesaSeleccionadaId === result.id_mesa ? null : state.mesaSeleccionadaId,
        loading: false
      }))

      // Refrescar inventario en useProductosStore
      useProductosStore.getState().fetchProductos?.()

      return result
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  cambiarMesa: async (idSesion, idMesaDestino) => {
    set({ loading: true, error: null })
    try {
      const result = await mesasService.cambiarMesa(idSesion, idMesaDestino)
      await get().fetchMesas()
      set({ mesaSeleccionadaId: idMesaDestino, loading: false })
      return result
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))
