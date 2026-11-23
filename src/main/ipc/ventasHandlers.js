import { ipcMain } from 'electron'
import { registrarVentaDirecta, getVentasHoy } from '../db/queries/ventas'

export function registerVentasHandlers() {
  ipcMain.handle('ventas:registrar', async (_event, data) => {
    try {
      const result = registrarVentaDirecta(data)
      return { statusResponse: true, error: null, data: result }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('ventas:getHoy', async () => {
    try {
      const result = getVentasHoy()
      return { statusResponse: true, error: null, data: result }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
