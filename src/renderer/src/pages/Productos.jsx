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
  Coins,
  PlusCircle
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

  // Paginación
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
        <div style="text-align: left; font-size: 0.875rem; color: #bbcabf; margin-bottom: 0.75rem;">
          Producto: <strong style="color: #dae2fd;">${producto.nombre}</strong><br/>
          Stock actual: <strong style="color: #4edea3;">${producto.stock_actual} unidades</strong>
        </div>
      `,
      input: 'number',
      inputLabel: 'Cantidad a sumar al stock:',
      inputPlaceholder: 'Ej: 12, 24...',
      inputAttributes: {
        min: '1',
        step: '1',
        style:
          'background: #171f33; border: 1px solid #2d3449; color: #4edea3; font-family: monospace; font-size: 1.125rem; font-weight: bold; border-radius: 0.75rem; padding: 0.5rem 1rem;'
      },
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: 'Sumar Stock',
      cancelButtonText: 'Cancelar',
      background: '#131b2e',
      color: '#dae2fd',
      confirmButtonColor: '#4edea3',
      cancelButtonColor: '#2d3449',
      reverseButtons: true,
      customClass: {
        popup: 'border border-surface-variant/50 rounded-2xl shadow-2xl'
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Fila superior unificada: grid grid-cols-12 gap-3 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* col-span-5: Tarjeta Título */}
        <div className="col-span-12 md:col-span-5 bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface tracking-tight leading-tight">
              Gestión de Productos
            </h1>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Catálogo y control de inventario en tiempo real para venta en mesas y barra
            </p>
          </div>
        </div>

        {/* col-span-2: KPI Total Productos */}
        <div className="col-span-12 sm:col-span-4 md:col-span-2 bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Total Productos
            </span>
            <Boxes className="w-4 h-4 text-primary/70" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-on-surface tabular-nums">
              {metricas.total}
            </span>
            <span className="text-xs text-on-surface-variant ml-1.5 font-medium">ítems</span>
          </div>
          <span className="text-[11px] text-primary font-medium block">✓ 100% catalogados</span>
        </div>

        {/* col-span-3: KPI Valor del Inventario */}
        <div className="col-span-12 sm:col-span-4 md:col-span-3 bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Valor del Inventario
            </span>
            <Coins className="w-4 h-4 text-primary/70" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-primary tabular-nums">
              {metricas.valorInventario.toLocaleString('es-BO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-xs font-bold text-primary/80 ml-1.5">Bs.</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block">
            Cálculo a precio de venta
          </span>
        </div>

        {/* col-span-2: KPI Stock Crítico */}
        <div className="col-span-12 sm:col-span-4 md:col-span-2 bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Stock Crítico
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${metricas.stockCritico > 0 ? 'text-tertiary' : 'text-on-surface-variant'}`}
            />
          </div>
          <div className="my-1">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${metricas.stockCritico > 0 ? 'text-tertiary' : 'text-on-surface'
                }`}
            >
              {metricas.stockCritico}
            </span>
            <span className="text-xs text-on-surface-variant ml-1.5 font-medium">por agotar</span>
          </div>
          <span
            className={`text-[11px] font-medium block ${metricas.agotados > 0 ? 'text-error' : 'text-on-surface-variant'
              }`}
          >
            • {metricas.agotados} sin existencias
          </span>
        </div>
      </div>

      {/* Contenedor principal de tabla */}
      <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl overflow-hidden shadow-xl">
        {/* Toolbar en bg-surface-container/60 */}
        <div className="bg-surface-container/60 border-b border-surface-variant/20 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              placeholder="Buscar por nombre, código o detalle..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-surface-container-high border border-surface-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Pestañas de Categoría */}
          <div className="flex items-center gap-1 overflow-x-auto bg-surface-container-high p-1 rounded-lg border border-surface-variant/20">
            <button
              type="button"
              onClick={() => {
                setCategoriaSeleccionada('todas')
                setPaginaActual(1)
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${categoriaSeleccionada === 'todas'
                  ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
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
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activa
                      ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface'
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-primary/20 transition-all cursor-pointer text-xs whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant uppercase text-[11px] font-bold tracking-wider border-b border-surface-variant/30">
                <th className="py-3 px-4">Producto / Detalle</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Precio Unitario</th>
                <th className="py-3 px-3 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20 divide-dashed">
              {loading && productos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-on-surface-variant">
                    <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando inventario...</p>
                  </td>
                </tr>
              ) : productosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-on-surface-variant">
                    <Package className="w-8 h-8 mx-auto text-surface-variant mb-2" />
                    <p className="text-sm font-semibold text-on-surface">
                      No se encontraron productos
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {busqueda
                        ? 'Prueba ajustando el término de búsqueda o el filtro.'
                        : 'Comienza agregando tu primer producto con el botón "Nuevo Producto".'}
                    </p>
                  </td>
                </tr>
              ) : (
                productosPaginados.map((p) => {
                  const stockNum = Number(p.stock_actual) || 0
                  const isAgotado = stockNum === 0
                  const isBajo = stockNum > 0 && stockNum <= 5

                  let rowBg = 'hover:bg-surface-container/40 transition-colors'
                  if (isAgotado) {
                    rowBg =
                      'bg-error-container/10 hover:bg-error-container/20 border-l-2 border-l-error transition-colors'
                  } else if (isBajo) {
                    rowBg =
                      'bg-tertiary-container/10 hover:bg-tertiary-container/20 border-l-2 border-l-tertiary transition-colors'
                  }

                  return (
                    <tr key={p.id_producto} className={rowBg}>
                      {/* Columna: Nombre y Descripción */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-surface-container border border-surface-variant/30 text-primary">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-on-surface block text-xs">
                              {p.nombre}
                            </span>
                            {p.descripcion && (
                              <span className="text-[11px] text-on-surface-variant block line-clamp-1">
                                {p.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna: Categoría */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container text-on-surface-variant border border-surface-variant/30">
                          {p.categoria_nombre || 'Sin categoría'}
                        </span>
                      </td>

                      {/* Columna: Precio Unitario */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-on-surface tabular-nums text-xs">
                        {Number(p.precio_venta).toFixed(2)}{' '}
                        <span className="text-[10px] text-on-surface-variant font-normal">Bs.</span>
                      </td>

                      {/* Columna: Stock con Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-xs text-on-surface tabular-nums">
                            {stockNum} uds.
                          </span>
                          {isAgotado ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container/30 text-error border border-error/40 tabular-nums">
                              • Agotado
                            </span>
                          ) : isBajo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/30 text-tertiary border border-tertiary/40 tabular-nums">
                              ⚠️ Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/20 text-primary border border-primary/30 tabular-nums">
                              • En Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna: Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Botón rápido + para sumar stock */}
                          <button
                            type="button"
                            onClick={() => handleSumarStock(p)}
                            title="Ingreso rápido de stock"
                            className="p-1.5 rounded-md bg-surface-container hover:bg-primary hover:text-on-primary text-primary border border-primary/30 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-md bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-surface-variant/30 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleEliminar(p)}
                            title="Dar de baja producto"
                            className="p-1.5 rounded-md bg-surface-container hover:bg-error-container hover:text-on-error-container text-error border border-error/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-container/70 border-t border-surface-variant/20 text-xs text-on-surface-variant">
            <div>
              Mostrando{' '}
              <span className="font-bold text-on-surface tabular-nums">{inicioRango}</span> -{' '}
              <span className="font-bold text-on-surface tabular-nums">{finRango}</span> de{' '}
              <span className="font-bold text-on-surface tabular-nums">
                {productosFiltrados.length}
              </span>{' '}
              productos registrados
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                disabled={paginaValida === 1}
                className="p-1 rounded-md bg-surface-container border border-surface-variant/30 hover:bg-surface-container-high text-on-surface disabled:opacity-30 cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 font-mono">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaActual(num)}
                    className={`min-w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer tabular-nums ${paginaValida === num
                        ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                        : 'bg-surface-container border border-surface-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
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
                className="p-1 rounded-md bg-surface-container border border-surface-variant/30 hover:bg-surface-container-high text-on-surface disabled:opacity-30 cursor-pointer transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
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
