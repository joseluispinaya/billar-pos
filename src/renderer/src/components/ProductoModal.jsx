import { useState } from 'react'
import { Package, Plus, Save, Layers } from 'lucide-react'
import Modal from './Modal'
import { useProductosStore } from '../store/useProductosStore'
import { toastSuccess, toastError } from '../utils/alertas'

function ProductoForm({ productoEditar, onClose }) {
  const { categorias, createProducto, updateProducto, createCategoria } = useProductosStore()

  const isEditing = Boolean(productoEditar)

  const [formData, setFormData] = useState(() => ({
    nombre: productoEditar?.nombre || '',
    id_categoria: productoEditar?.id_categoria
      ? String(productoEditar.id_categoria)
      : categorias.length > 0
        ? String(categorias[0].id_categoria)
        : '',
    descripcion: productoEditar?.descripcion || '',
    precio_venta:
      productoEditar?.precio_venta !== undefined ? String(productoEditar.precio_venta) : '',
    stock_actual:
      productoEditar?.stock_actual !== undefined ? String(productoEditar.stock_actual) : '0'
  }))

  const [guardando, setGuardando] = useState(false)
  const [mostrandoNuevaCat, setMostrandoNuevaCat] = useState(false)
  const [nuevaCatNombre, setNuevaCatNombre] = useState('')

  const handleCrearCategoria = async (e) => {
    e.preventDefault()
    if (!nuevaCatNombre.trim()) {
      toastError('El nombre de la categoría no puede estar vacío.')
      return
    }

    try {
      const catCreada = await createCategoria(nuevaCatNombre.trim())
      setFormData((prev) => ({
        ...prev,
        id_categoria: String(catCreada.id_categoria)
      }))
      setNuevaCatNombre('')
      setMostrandoNuevaCat(false)
      toastSuccess(`Categoría "${catCreada.nombre}" agregada`)
    } catch (err) {
      toastError(err.message || 'Error al crear la categoría')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedNombre = formData.nombre.trim()
    if (!trimmedNombre) {
      toastError('El nombre del producto es obligatorio.')
      return
    }

    const idCat = Number(formData.id_categoria)
    if (!idCat || isNaN(idCat)) {
      toastError('Debes seleccionar una categoría válida.')
      return
    }

    const precio = Number(formData.precio_venta)
    if (isNaN(precio) || precio < 0 || formData.precio_venta === '') {
      toastError('Ingresa un precio de venta válido (mayor o igual a 0).')
      return
    }

    const stock = parseInt(formData.stock_actual, 10)
    if (isNaN(stock) || stock < 0 || formData.stock_actual === '') {
      toastError('Ingresa un stock inicial válido (entero mayor o igual a 0).')
      return
    }

    setGuardando(true)
    try {
      if (isEditing) {
        await updateProducto(productoEditar.id_producto, {
          nombre: trimmedNombre,
          id_categoria: idCat,
          descripcion: formData.descripcion.trim(),
          precio_venta: precio,
          stock_actual: stock
        })
        toastSuccess('Producto actualizado correctamente')
      } else {
        await createProducto({
          nombre: trimmedNombre,
          id_categoria: idCat,
          descripcion: formData.descripcion.trim(),
          precio_venta: precio,
          stock_actual: stock
        })
        toastSuccess('Producto registrado correctamente')
      }
      onClose()
    } catch (err) {
      toastError(err.message || 'Error al guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sección A: Información Básica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>A. Información Básica del Artículo</span>
        </div>

        {/* Nombre */}
        <div className="space-y-1.5">
          <label
            htmlFor="nombre"
            className="text-xs font-semibold text-slate-200 flex items-center justify-between"
          >
            <span>Nombre Comercial del Producto *</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Visible en comandas y ventas
            </span>
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Ej: Cerveza Huari 620ml, Papas Lays..."
            className="w-full px-3.5 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Categoría */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="id_categoria" className="text-xs font-semibold text-slate-200">
              Categoría *
            </label>
            <button
              type="button"
              onClick={() => setMostrandoNuevaCat(!mostrandoNuevaCat)}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{mostrandoNuevaCat ? 'Cancelar' : 'Nueva categoría'}</span>
            </button>
          </div>

          {mostrandoNuevaCat ? (
            <div className="p-3 bg-[#111c26] border border-slate-700/80 rounded-xl flex items-center gap-2">
              <input
                type="text"
                value={nuevaCatNombre}
                onChange={(e) => setNuevaCatNombre(e.target.value)}
                placeholder="Nombre de la nueva categoría..."
                className="flex-1 px-3 py-1.5 bg-[#090f14] border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCrearCategoria}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                id="id_categoria"
                required
                value={formData.id_categoria}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    id_categoria: e.target.value
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
              >
                <option value="" disabled>
                  -- Seleccionar Categoría --
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label htmlFor="descripcion" className="text-xs font-semibold text-slate-200">
            Descripción / Presentación (Opcional)
          </label>
          <input
            id="descripcion"
            type="text"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                descripcion: e.target.value
              }))
            }
            placeholder="Ej: Botella de vidrio retornable, Paquete 120g..."
            className="w-full px-3.5 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Sección B: Finanzas y Stock */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>B. Precio de Venta y Control de Stock</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Precio de Venta */}
          <div className="space-y-1.5">
            <label htmlFor="precio_venta" className="text-xs font-semibold text-slate-200">
              Precio de Venta (Bs.) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-xs">
                Bs.
              </div>
              <input
                id="precio_venta"
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.precio_venta}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    precio_venta: e.target.value
                  }))
                }
                placeholder="0.00"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Stock Actual */}
          <div className="space-y-1.5">
            <label htmlFor="stock_actual" className="text-xs font-semibold text-slate-200">
              {isEditing ? 'Stock Actual (Unidades) *' : 'Stock Inicial (Unidades) *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Layers className="w-4 h-4" />
              </div>
              <input
                id="stock_actual"
                type="number"
                step="1"
                min="0"
                required
                value={formData.stock_actual}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stock_actual: e.target.value
                  }))
                }
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={guardando}
          className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 text-sm"
        >
          {guardando ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Guardar Producto'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function ProductoModal({ isOpen, onClose, productoEditar = null }) {
  const isEditing = Boolean(productoEditar)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto'}
      subtitle={
        isEditing
          ? 'Actualiza los datos del producto en el catálogo e inventario.'
          : 'Completa los datos para dar de alta el artículo en el inventario.'
      }
      badge="INVENTARIO POS"
      icon={Package}
      maxWidth="max-w-xl"
    >
      <ProductoForm
        key={productoEditar ? String(productoEditar.id_producto) : 'nuevo'}
        productoEditar={productoEditar}
        onClose={onClose}
      />
    </Modal>
  )
}
