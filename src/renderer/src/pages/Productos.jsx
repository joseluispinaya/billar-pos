import { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Coins
} from 'lucide-react'
import Swal from 'sweetalert2'
import ProductoModal from '../components/ProductoModal'
import { useProductosStore } from '../store/useProductosStore'
import { toastSuccess, toastError, confirmarAccion } from '../utils/alertas'

const ITEMS_POR_PAGINA = 10

export default function Productos() {
  const {
    productos,
    categorias,
    loading,
    fetchProductos,
    fetchCategorias,
    ajustarStock,
    deleteProducto
  } = useProductosStore()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoAEditar, setProductoAEditar] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)

  useEffect(() => {
    fetchProductos().catch((err) => console.error('Error fetching productos:', err))
    fetchCategorias().catch((err) => console.error('Error fetching categorias:', err))
  }, [fetchProductos, fetchCategorias])

  // Métricas calculadas en vivo sobre todo el catálogo activo
  const metricas = useMemo(() => {
    const total = productos.length
    const valorInventario = productos.reduce(
      (acc, p) => acc + (Number(p.precio_venta) || 0) * (Number(p.stock_actual) || 0),
      0
    )
    const stockCritico = productos.filter((p) => Number(p.stock_actual) <= 5).length
    const agotados = productos.filter((p) => Number(p.stock_actual) === 0).length

    return {
      total,
      valorInventario,
      stockCritico,
      agotados
    }
  }, [productos])

  // Contadores por categoría para los filtros
  const contadoresCategorias = useMemo(() => {
    const counts = {}
    productos.forEach((p) => {
      const catId = String(p.id_categoria)
      counts[catId] = (counts[catId] || 0) + 1
    })
    return counts
  }, [productos])

  // Filtrado reactivo en tiempo real
  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const coincideBusqueda =
        !query ||
        p.nombre?.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query)

      const coincideCategoria =
        categoriaSeleccionada === 'todas' ||
        String(p.id_categoria) === String(categoriaSeleccionada)

      return coincideBusqueda && coincideCategoria
    })
  }, [productos, busqueda, categoriaSeleccionada])

  // Paginación sin cascading renders
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA))
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas)

  const productosPaginados = useMemo(() => {
    const inicio = (paginaValida - 1) * ITEMS_POR_PAGINA
    return productosFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA)
  }, [productosFiltrados, paginaValida])

  const handleAbrirCrear = () => {
    setProductoAEditar(null)
    setModalAbierto(true)
  }

  const handleAbrirEditar = (producto) => {
    setProductoAEditar(producto)
    setModalAbierto(true)
  }

  const handleEliminar = async (producto) => {
    const confirmado = await confirmarAccion({
      titulo: '¿Eliminar producto?',
      texto: `¿Deseas dar de baja "${producto.nombre}"? Esta acción mantendrá el historial de ventas previas.`,
      confirmText: 'Sí, dar de baja'
    })

    if (confirmado) {
      try {
        await deleteProducto(producto.id_producto)
        toastSuccess(`Producto "${producto.nombre}" dado de baja correctamente`)
      } catch (err) {
        toastError(err.message || 'Error al eliminar el producto')
      }
    }
  }

  const handleSumarStock = async (producto) => {
    const { value: cantidad } = await Swal.fire({
      title: `Ingreso de Stock`,
      html: `
        <div style="text-align: left; font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.75rem;">
          Producto: <strong style="color: #f8fafc;">${producto.nombre}</strong><br/>
          Stock actual: <strong style="color: #10b981;">${producto.stock_actual} unidades</strong>
        </div>
      `,
      input: 'number',
      inputLabel: 'Cantidad a sumar al stock:',
      inputPlaceholder: 'Ej: 12, 24...',
      inputAttributes: {
        min: '1',
        step: '1',
        style:
          'background: #090f14; border: 1px solid #334155; color: #10b981; font-family: monospace; font-size: 1.125rem; font-weight: bold; border-radius: 0.75rem; padding: 0.5rem 1rem;'
      },
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: 'Sumar Stock',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#475569',
      reverseButtons: true,
      customClass: {
        popup: 'border border-slate-700/80 rounded-2xl shadow-2xl'
      },
      inputValidator: (val) => {
        const num = parseInt(val, 10)
        if (!val || isNaN(num) || num <= 0) {
          return 'Ingresa una cantidad entera mayor a 0'
        }
      }
    })

    if (cantidad) {
      try {
        const agregadas = parseInt(cantidad, 10)
        await ajustarStock(producto.id_producto, agregadas)
        toastSuccess(`Se sumaron +${agregadas} unidades a "${producto.nombre}"`)
      } catch (err) {
        toastError(err.message || 'Error al ajustar el stock')
      }
    }
  }

  const inicioRango =
    productosFiltrados.length === 0 ? 0 : (paginaValida - 1) * ITEMS_POR_PAGINA + 1
  const finRango = Math.min(paginaValida * ITEMS_POR_PAGINA, productosFiltrados.length)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado + Métricas KPI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Productos</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Catálogo y control de inventario en tiempo real para venta en mesas y barra
          </p>
        </div>
      </div>

      {/* 3 Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Productos */}
        <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Productos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">{metricas.total}</span>
              <span className="text-xs font-medium text-slate-400">ítems</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 font-medium block">
              ✓ Catálogo activo
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Valor del Inventario */}
        <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Valor del Inventario
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {metricas.valorInventario.toLocaleString('es-BO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              <span className="text-xs font-bold text-emerald-400/80">Bs.</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Cálculo a precio de venta</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Stock Crítico */}
        <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Stock Crítico
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono ${
                  metricas.stockCritico > 0 ? 'text-amber-400' : 'text-white'
                }`}
              >
                {metricas.stockCritico}
              </span>
              <span className="text-xs font-medium text-slate-400">por agotar</span>
            </div>
            <span
              className={`text-[11px] font-medium block ${
                metricas.agotados > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              • {metricas.agotados} sin existencias
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              metricas.stockCritico > 0
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Herramientas: Buscador + Filtros + Botón Nuevo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111c26] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        {/* Buscador en tiempo real */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPaginaActual(1)
            }}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2 bg-[#090f14] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Pestañas de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => {
              setCategoriaSeleccionada('todas')
              setPaginaActual(1)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoriaSeleccionada === 'todas'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-[#090f14] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Todos ({productos.length})
          </button>

          {categorias.map((cat) => {
            const count = contadoresCategorias[String(cat.id_categoria)] || 0
            const activa = String(categoriaSeleccionada) === String(cat.id_categoria)
            return (
              <button
                key={cat.id_categoria}
                type="button"
                onClick={() => {
                  setCategoriaSeleccionada(String(cat.id_categoria))
                  setPaginaActual(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activa
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#090f14] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.nombre} ({count})
              </button>
            )
          })}
        </div>

        {/* Botón Nuevo Producto */}
        <div>
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0c141c] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Producto / Descripción</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Precio Unitario</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && productos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm">Cargando inventario...</p>
                  </td>
                </tr>
              ) : productosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-base font-semibold text-slate-300">
                      No se encontraron productos
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {busqueda
                        ? 'Prueba ajustando el término de búsqueda o el filtro.'
                        : 'Comienza agregando tu primer producto con el botón "+ Nuevo Producto".'}
                    </p>
                  </td>
                </tr>
              ) : (
                productosPaginados.map((p) => {
                  const stockNum = Number(p.stock_actual) || 0
                  const isAgotado = stockNum === 0
                  const isBajo = stockNum > 0 && stockNum <= 5

                  let rowBg = 'hover:bg-slate-800/40 transition-colors'
                  if (isAgotado) {
                    rowBg =
                      'bg-rose-950/15 hover:bg-rose-950/25 border-l-2 border-l-rose-500 transition-colors'
                  } else if (isBajo) {
                    rowBg =
                      'bg-amber-950/15 hover:bg-amber-950/25 border-l-2 border-l-amber-500 transition-colors'
                  }

                  return (
                    <tr key={p.id_producto} className={rowBg}>
                      {/* Columna: Nombre y Descripción */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                            <Package className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <span className="font-semibold text-white block text-sm">
                              {p.nombre}
                            </span>
                            {p.descripcion && (
                              <span className="text-xs text-slate-400 block line-clamp-1">
                                {p.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna: Categoría */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#090f14] text-slate-300 border border-slate-800">
                          {p.categoria_nombre || 'Sin categoría'}
                        </span>
                      </td>

                      {/* Columna: Precio Unitario */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-white text-sm">
                        {Number(p.precio_venta).toFixed(2)}{' '}
                        <span className="text-xs text-slate-400 font-normal">Bs.</span>
                      </td>

                      {/* Columna: Stock con Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 font-mono">
                          <span className="font-bold text-sm text-white">{stockNum} uds.</span>
                          {isAgotado ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              • Agotado
                            </span>
                          ) : isBajo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⚠️ Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              • En Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna: Acciones */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Botón rápido + para sumar stock */}
                          <button
                            type="button"
                            onClick={() => handleSumarStock(p)}
                            title="Ingreso rápido de stock"
                            className="p-1.5 rounded-lg bg-[#090f14] hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-lg bg-[#090f14] hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleEliminar(p)}
                            title="Dar de baja producto"
                            className="p-1.5 rounded-lg bg-[#090f14] hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {productosFiltrados.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 bg-[#0c141c] text-xs text-slate-400">
            <div>
              Mostrando <span className="font-bold text-white">{inicioRango}</span> -{' '}
              <span className="font-bold text-white">{finRango}</span> de{' '}
              <span className="font-bold text-white">{productosFiltrados.length}</span> productos
              registrados
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                disabled={paginaValida === 1}
                className="p-1.5 rounded-lg bg-[#090f14] border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-[#090f14] cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-mono">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaActual(num)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paginaValida === num
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-[#090f14] border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaValida === totalPaginas}
                className="p-1.5 rounded-lg bg-[#090f14] border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-[#090f14] cursor-pointer transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <ProductoModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        productoEditar={productoAEditar}
      />
    </div>
  )
}
