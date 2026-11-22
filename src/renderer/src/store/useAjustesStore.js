import { create } from 'zustand'
import { ajustesService } from '../services/ajustesService'

export const useAjustesStore = create((set) => ({
  ajustes: {
    id: 1,
    nombre_local: 'Mi Billar',
    cantidad_mesas: 8,
    tarifa_hora: 25.0,
    cobro_minimo_activo: 0,
    minutos_minimos: 30
  },
  loading: false,
  error: null,

  fetchAjustes: async () => {
    set({ loading: true, error: null })
    try {
      const data = await ajustesService.get()
      set({ ajustes: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  saveAjustes: async (data) => {
    set({ loading: true, error: null })
    try {
      const updated = await ajustesService.update(data)
      set({ ajustes: updated, loading: false })
      return updated
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))
