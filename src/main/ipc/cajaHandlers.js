import { ipcMain } from 'electron'
import { getReporteCaja, getDetalleSesion, getDetalleVentaBarra } from '../db/queries/caja'

export function registerCajaHandlers() {
  ipcMain.handle('caja:getReporte', async (_event, params) => {
    try {
      const result = getReporteCaja(params || {})
      return { statusResponse: true, error: null, data: result }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('caja:getDetalleSesion', async (_event, idSesion) => {
    try {
      const result = getDetalleSesion(idSesion)
      return { statusResponse: true, error: null, data: result }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('caja:getDetalleVentaBarra', async (_event, idVenta) => {
    try {
      const result = getDetalleVentaBarra(idVenta)
      return { statusResponse: true, error: null, data: result }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
