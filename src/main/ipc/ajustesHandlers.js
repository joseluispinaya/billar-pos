import { ipcMain } from 'electron'
import { getAjustes, updateAjustes } from '../db/queries/ajustes'

export function registerAjustesHandlers() {
  ipcMain.handle('ajustes:get', async () => {
    try {
      const data = getAjustes()
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('ajustes:update', async (_event, ajustesData) => {
    try {
      const data = updateAjustes(ajustesData)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
