import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  QrCode,
  Banknote,
  CheckCircle,
  FileText
} from 'lucide-react'
import { useProductosStore } from '../store/useProductosStore'
import { useVentasStore } from '../store/useVentasStore'
import { toastSuccess, toastError, confirmarAccion } from '../utils/alertas'

export default function VentasBarra() {
  const { productos, categorias, fetchProductos } = useProductosStore()
  const {
    carrito,
    metodoPago,
    nota,
    loading: guardando,
    setMetodoPago,
    setNota,
    limpiarCarrito,
    agregarAlCarrito,
    actualizarCantidad,
    quitarDelCarrito,
    confirmarVenta
  } = useVentasStore()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  // Cargar productos al montar
  useEffect(() => {
    fetchProductos?.().catch((err) => {
      console.error('Error al cargar productos en VentasBarra:', err)
    })
  }, [fetchProductos])

  // Filtrado reactivo de productos
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const matchQuery =
        !q || p.nombre?.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
      const matchCat =
        categoriaSeleccionada === 'todas' ||
        String(p.id_categoria) === String(categoriaSeleccionada)
      return matchQuery && matchCat
    })
  }, [productos, busqueda, categoriaSeleccionada])

  // Conteo de items en carrito por producto
  const cantidadesPorProducto = useMemo(() => {
    const map = {}
    carrito.forEach((item) => {
      map[item.id_producto] = item.cantidad
    })
    return map
  }, [carrito])

  // Cálculos del carrito
  const totalVenta = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.cantidad * item.precio_venta, 0)
  }, [carrito])

  const totalUnidades = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.cantidad, 0)
  }, [carrito])

  // Manejo de agregar al carrito
  const handleAgregarProducto = (producto) => {
    try {
      agregarAlCarrito(producto)
    } catch (err) {
      toastError(err.message || 'No se pudo agregar el producto')
    }
  }

  // Manejo de actualización de cantidad
  const handleActualizarCantidad = (idProducto, delta) => {
    try {
      actualizarCantidad(idProducto, delta)
    } catch (err) {
      toastError(err.message || 'No se pudo modificar la cantidad')
    }
  }

  // Manejo de vaciar carrito
  const handleVaciarCarrito = async () => {
    if (carrito.length === 0) return
    const confirmado = await confirmarAccion({
      titulo: '¿Vaciar carrito?',
      texto: 'Se eliminarán todos los productos seleccionados para esta venta.',
      botonConfirmar: 'Sí, vaciar'
    })
    if (confirmado) {
      limpiarCarrito()
    }
  }

  // Cobrar venta
  const handleCobrarVenta = async () => {
    if (carrito.length === 0) {
      toastError('El carrito de venta está vacío.')
      return
    }

    const confirmado = await confirmarAccion({
      titulo: '¿Confirmar cobro de venta en barra?',
      texto: `Total a cobrar: ${totalVenta.toFixed(2)} Bs. (${metodoPago === 'EFECTIVO' ? 'Efectivo' : 'QR Simple'})`,
      botonConfirmar: 'Sí, cobrar venta'
    })

    if (!confirmado) return

    try {
      await confirmarVenta()
      toastSuccess('¡Venta en barra registrada exitosamente!')
    } catch (err) {
      toastError(err.message || 'Error al registrar la venta')
    }
  }

  return (
    <div className="p-4 h-[calc(100vh-4.5rem)] overflow-hidden">
      <div className="grid grid-cols-10 gap-4 h-full">
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA (70% -> col-span-7): Catálogo de Productos   */}
        {/* ============================================================== */}
        <div className="col-span-7 flex flex-col h-full min-h-0 space-y-3">
          {/* Barra superior: Buscador y Categorías */}
          <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3 shrink-0 shadow-md space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-surface-container border border-surface-variant/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="text-xs font-mono font-medium text-on-surface-variant bg-surface-container border border-surface-variant/30 px-3 py-1.5 rounded-lg shrink-0 tabular-nums">
                Catálogo:{' '}
                <strong className="text-primary font-bold">
                  {productosFiltrados.length} / {productos.length}
                </strong>{' '}
                productos
              </div>
            </div>

            {/* Pestañas de categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada('todas')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  categoriaSeleccionada === 'todas'
                    ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                }`}
              >
                Todos ({productos.length})
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id_categoria}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(String(cat.id_categoria))}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    String(categoriaSeleccionada) === String(cat.id_categoria)
                      ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla compacta de productos con scroll interno */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant text-xs">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p>No se encontraron productos disponibles con ese criterio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 pb-2">
                {productosFiltrados.map((prod) => {
                  const stock = Number(prod.stock_actual) || 0
                  const cantEnCarrito = cantidadesPorProducto[prod.id_producto] || 0
                  const estaAgotado = stock === 0
                  const precio = Number(prod.precio_venta) || 0

                  return (
                    <div
                      key={prod.id_producto}
                      onClick={() => {
                        if (!estaAgotado) {
                          handleAgregarProducto(prod)
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between select-none ${
                        cantEnCarrito > 0
                          ? 'bg-primary/5 border-primary ring-1 ring-primary/40 shadow-sm shadow-primary/10'
                          : estaAgotado
                            ? 'bg-surface-container-high/40 border-surface-variant/20 opacity-50 cursor-not-allowed'
                            : 'bg-surface-container-low/95 border-surface-variant/30 hover:border-primary/50 hover:bg-surface-container cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block truncate">
                            {prod.categoria_nombre || 'General'}
                          </span>
                          <h4 className="text-xs font-bold text-on-surface leading-tight mt-0.5 line-clamp-2">
                            {prod.nombre}
                          </h4>
                          <span
                            className={`text-[10px] font-medium block mt-1 ${
                              estaAgotado
                                ? 'text-error'
                                : stock <= 5
                                  ? 'text-tertiary'
                                  : 'text-on-surface-variant'
                            }`}
                          >
                            {estaAgotado ? 'Agotado' : `Stock: ${stock} uds.`}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-primary tabular-nums block">
                            {precio.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-on-surface-variant">
                              Bs.
                            </span>
                          </span>
                          {cantEnCarrito > 0 && (
                            <span className="inline-block mt-1 bg-primary text-on-primary text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums shadow-xs">
                              {cantEnCarrito} en venta
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pie de la tarjeta */}
                      <div className="mt-3 pt-2 border-t border-surface-variant/20 flex items-center justify-between">
                        {estaAgotado ? (
                          <span className="text-[10px] text-error font-medium px-2 py-0.5 rounded bg-error-container/20 border border-error/30 w-full text-center">
                            Sin existencias
                          </span>
                        ) : cantEnCarrito > 0 ? (
                          <div
                            className="flex items-center justify-between w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-primary font-bold">
                              Subtotal: {(cantEnCarrito * precio).toFixed(2)} Bs.
                            </span>
                            <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-primary/30">
                              <button
                                type="button"
                                onClick={() => handleActualizarCantidad(prod.id_producto, -1)}
                                className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                                title="Disminuir"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-on-surface tabular-nums">
                                {cantEnCarrito}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAgregarProducto(prod)}
                                disabled={cantEnCarrito >= stock}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                  cantEnCarrito >= stock
                                    ? 'bg-surface-container-high/40 text-on-surface-variant/40 cursor-not-allowed'
                                    : 'bg-primary text-on-primary hover:bg-primary-container'
                                }`}
                                title="Aumentar"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-on-surface-variant/80 flex items-center gap-1 group-hover:text-primary">
                            <Plus className="w-3 h-3" /> Clic para agregar
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA DERECHA (30% -> col-span-3): Ticket / Detalle Venta    */}
        {/* ============================================================== */}
        <div className="col-span-3 bg-surface-container rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-variant/25 min-h-0 shadow-lg">
          {/* Cabecera del Ticket */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant/30 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Venta en Barra
              </h2>
              <span className="text-[11px] text-on-surface-variant font-medium">
                {totalUnidades} {totalUnidades === 1 ? 'producto' : 'productos'} en ticket
              </span>
            </div>

            {carrito.length > 0 && (
              <button
                type="button"
                onClick={handleVaciarCarrito}
                className="text-[11px] text-on-surface-variant hover:text-error flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Vaciar ticket"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            )}
          </div>

          {/* Campo opcional de Nota / Referencia */}
          <div className="shrink-0">
            <label className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> Nota / Referencia (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Cliente de gorra roja / Para llevar"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={150}
              className="w-full bg-surface-container-low border border-surface-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Lista de productos en el ticket con scroll interno */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-container-high/60 flex items-center justify-center mb-2 text-on-surface-variant/60">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-on-surface">Ticket vacío</p>
                <p className="text-[11px] text-on-surface-variant max-w-[200px] mt-1">
                  Haz clic en cualquier producto del catálogo para añadirlo a esta venta.
                </p>
              </div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.id_producto}
                  className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-on-surface truncate leading-tight">
                      {item.nombre}
                    </h5>
                    <span className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                      {item.precio_venta.toFixed(2)} Bs. c/u
                    </span>
                  </div>

                  {/* Stepper y Subtotal */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-surface-variant/30">
                      <button
                        type="button"
                        onClick={() => handleActualizarCantidad(item.id_producto, -1)}
                        className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                        title="Restar"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-on-surface tabular-nums">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleActualizarCantidad(item.id_producto, 1)}
                        disabled={item.cantidad >= item.stock_actual}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                          item.cantidad >= item.stock_actual
                            ? 'bg-surface-container-high/40 text-on-surface-variant/40 cursor-not-allowed'
                            : 'bg-primary text-on-primary hover:bg-primary-container'
                        }`}
                        title="Sumar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono text-on-surface tabular-nums w-16 text-right">
                      {(item.cantidad * item.precio_venta).toFixed(2)} Bs.
                    </span>

                    <button
                      type="button"
                      onClick={() => quitarDelCarrito(item.id_producto)}
                      className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors cursor-pointer"
                      title="Eliminar de ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bloque de Liquidación y Cobro */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl space-y-3 shrink-0 border border-surface-variant/30 shadow-inner">
            {/* Total general */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                TOTAL A COBRAR
              </span>
              <span className="text-2xl font-black font-mono text-primary tabular-nums tracking-tight">
                {totalVenta.toFixed(2)}{' '}
                <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
              </span>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Método de Pago
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-primary text-on-primary shadow-sm shadow-primary/25 border border-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('QR')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    metodoPago === 'QR'
                      ? 'bg-primary text-on-primary shadow-sm shadow-primary/25 border border-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  QR Simple
                </button>
              </div>
            </div>

            {/* Botón Principal de Cobro */}
            <button
              type="button"
              onClick={handleCobrarVenta}
              disabled={carrito.length === 0 || guardando}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                carrito.length === 0 || guardando
                  ? 'bg-surface-container-high/60 text-on-surface-variant/40 border border-surface-variant/20 cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:bg-primary-container shadow-md shadow-primary/20 active:scale-[0.99]'
              }`}
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Procesando venta...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Cobrar Venta ({totalVenta.toFixed(2)} Bs.)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
