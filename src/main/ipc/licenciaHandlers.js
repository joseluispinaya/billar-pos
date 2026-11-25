import { ipcMain } from 'electron'
import { verificarLicencia, activarLicencia } from '../license/licenseManager'

export function registerLicenciaHandlers() {
  ipcMain.handle('licencia:verificar', async () => {
    try {
      const data = verificarLicencia()
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('licencia:activar', async (_event, clave) => {
    try {
      const data = activarLicencia(clave)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
