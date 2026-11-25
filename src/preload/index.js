import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ajustes: {
    get: () => ipcRenderer.invoke('ajustes:get'),
    update: (data) => ipcRenderer.invoke('ajustes:update', data)
  },
  productos: {
    getCategorias: () => ipcRenderer.invoke('categorias:get'),
    createCategoria: (nombre) => ipcRenderer.invoke('categorias:create', nombre),
    getAll: () => ipcRenderer.invoke('productos:get'),
    create: (data) => ipcRenderer.invoke('productos:create', data),
    update: (id, data) => ipcRenderer.invoke('productos:update', id, data),
    ajustarStock: (id, cantidad) => ipcRenderer.invoke('productos:ajustarStock', id, cantidad),
    remove: (id) => ipcRenderer.invoke('productos:delete', id)
  },
  mesas: {
    getAll: () => ipcRenderer.invoke('mesas:getAll'),
    iniciar: (idMesa, notaCliente) => ipcRenderer.invoke('mesas:iniciar', idMesa, notaCliente),
    agregarConsumos: (idSesion, items) =>
      ipcRenderer.invoke('mesas:agregarConsumos', idSesion, items),
    actualizarConsumo: (idDetalle, delta) =>
      ipcRenderer.invoke('mesas:actualizarConsumo', idDetalle, delta),
    finalizar: (idSesion, metodoPago) =>
      ipcRenderer.invoke('mesas:finalizar', idSesion, metodoPago),
    cambiarMesa: (idSesion, idMesaDestino) =>
      ipcRenderer.invoke('mesas:cambiarMesa', idSesion, idMesaDestino)
  },
  ventas: {
    registrar: (data) => ipcRenderer.invoke('ventas:registrar', data),
    getHoy: () => ipcRenderer.invoke('ventas:getHoy')
  },
  caja: {
    getReporte: (params) => ipcRenderer.invoke('caja:getReporte', params),
    getDetalleSesion: (idSesion) => ipcRenderer.invoke('caja:getDetalleSesion', idSesion),
    getDetalleVentaBarra: (idVenta) => ipcRenderer.invoke('caja:getDetalleVentaBarra', idVenta)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
