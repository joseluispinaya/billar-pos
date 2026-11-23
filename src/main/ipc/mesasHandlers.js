import { ipcMain } from 'electron'
import {
  getMesasConSesiones,
  iniciarSesion,
  agregarConsumos,
  actualizarCantidadConsumo,
  finalizarSesion
} from '../db/queries/mesas'

export function registerMesasHandlers() {
  ipcMain.handle('mesas:getAll', async () => {
    try {
      const data = getMesasConSesiones()
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('mesas:iniciar', async (_event, idMesa, notaCliente) => {
    try {
      const data = iniciarSesion(idMesa, notaCliente)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('mesas:agregarConsumos', async (_event, idSesion, items) => {
    try {
      const data = agregarConsumos(idSesion, items)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('mesas:actualizarConsumo', async (_event, idDetalle, delta) => {
    try {
      const data = actualizarCantidadConsumo(idDetalle, delta)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('mesas:finalizar', async (_event, idSesion, metodoPago) => {
    try {
      const data = finalizarSesion(idSesion, metodoPago)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
