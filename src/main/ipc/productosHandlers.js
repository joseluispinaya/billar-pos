import { ipcMain } from 'electron'
import {
  getCategorias,
  createCategoria,
  getProductos,
  createProducto,
  updateProducto,
  ajustarStock,
  deleteProducto
} from '../db/queries/productos'

export function registerProductosHandlers() {
  ipcMain.handle('categorias:get', async () => {
    try {
      const data = getCategorias()
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('categorias:create', async (_event, nombre) => {
    try {
      const data = createCategoria(nombre)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('productos:get', async () => {
    try {
      const data = getProductos()
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('productos:create', async (_event, productoData) => {
    try {
      const data = createProducto(productoData)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('productos:update', async (_event, id, productoData) => {
    try {
      const data = updateProducto(id, productoData)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('productos:ajustarStock', async (_event, id, cantidad) => {
    try {
      const data = ajustarStock(id, cantidad)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })

  ipcMain.handle('productos:delete', async (_event, id) => {
    try {
      const data = deleteProducto(id)
      return { statusResponse: true, error: null, data }
    } catch (error) {
      return { statusResponse: false, error: error.message, data: null }
    }
  })
}
