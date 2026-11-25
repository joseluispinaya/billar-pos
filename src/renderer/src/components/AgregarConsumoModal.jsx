import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react'
import Modal from './Modal'
import { useProductosStore } from '../store/useProductosStore'
import { useMesasStore } from '../store/useMesasStore'
import { toastSuccess, toastError } from '../utils/alertas'

function AgregarConsumoContent({ mesa, onClose }) {
  const { productos, categorias, fetchProductos, fetchCategorias } = useProductosStore()
  const { agregarConsumos } = useMesasStore()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')
  const [seleccionados, setSeleccionados] = useState({}) // { [id_producto]: cantidad }
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    fetchProductos?.().catch(() => {})
    fetchCategorias?.().catch(() => {})
  }, [fetchProductos, fetchCategorias])

  // Filtrado de productos disponibles
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

  // Modificar cantidad en borrador
  const handleCambiarCantidad = (idProducto, delta) => {
    const producto = productos.find((p) => p.id_producto === idProducto)
    if (!producto) return

    setSeleccionados((prev) => {
      const actual = prev[idProducto] || 0
      const nueva = actual + delta

      if (nueva <= 0) {
        const copia = { ...prev }
        delete copia[idProducto]
        return copia
      }

      if (nueva > producto.stock_actual) {
        toastError(`Stock máximo disponible: ${producto.stock_actual}`)
        return prev
      }

      return {
        ...prev,
        [idProducto]: nueva
      }
    })
  }

  const handleEliminarItem = (idProducto) => {
    setSeleccionados((prev) => {
      const copia = { ...prev }
      delete copia[idProducto]
      return copia
    })
  }

  // Lista de items en el carrito
  const itemsEnCarrito = useMemo(() => {
    return Object.entries(seleccionados).map(([idProd, cant]) => {
      const prod = productos.find((p) => p.id_producto === Number(idProd))
      const precioUnitario = Number(prod?.precio_venta) || 0
      const subtotal = cant * precioUnitario
      return {
        id_producto: Number(idProd),
        nombre: prod?.nombre || 'Producto',
        cantidad: cant,
        precio_unitario: precioUnitario,
        subtotal
      }
    })
  }, [seleccionados, productos])

  const subtotalACargar = useMemo(() => {
    return itemsEnCarrito.reduce((acc, item) => acc + item.subtotal, 0)
  }, [itemsEnCarrito])

  const costoConsumoActualMesa = Number(mesa?.sesion?.costo_consumo) || 0
  const nuevoTotalEstimado = costoConsumoActualMesa + subtotalACargar

  const handleGuardarConsumos = async () => {
    if (itemsEnCarrito.length === 0) {
      toastError('Debes seleccionar al menos un producto para cargar a la mesa.')
      return
    }

    if (!mesa?.sesion?.id_sesion) {
      toastError('La mesa no tiene una sesión activa válida.')
      return
    }

    setGuardando(true)
    try {
      const payload = itemsEnCarrito.map((i) => ({
        id_producto: i.id_producto,
        cantidad: i.cantidad
      }))

      await agregarConsumos(mesa.sesion.id_sesion, payload)
      toastSuccess(`Consumos cargados correctamente a ${mesa.nombre}`)
      onClose()
    } catch (err) {
      toastError(err.message || 'Error al cargar consumos a la mesa')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Izquierda (65%): Catálogo de productos */}
      <div className="lg:col-span-8 space-y-3">
        {/* Barra de búsqueda y categorías */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto por nombre o descripción..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-surface-container-high border border-surface-variant/40 rounded-lg text-on-surface placeholder-on-surface-variant/50 text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Pestañas de Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
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

        {/* Grilla compacta de productos (3 columnas, p-2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-100 overflow-y-auto pr-1">
          {productosFiltrados.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-8 text-center text-on-surface-variant text-xs">
              <Package className="w-6 h-6 mx-auto mb-1 opacity-60" />
              No se encontraron productos disponibles.
            </div>
          ) : (
            productosFiltrados.map((prod) => {
              const stock = Number(prod.stock_actual) || 0
              const cantEnBorrador = seleccionados[prod.id_producto] || 0
              const estaAgotado = stock === 0
              const precio = Number(prod.precio_venta) || 0

              return (
                <div
                  key={prod.id_producto}
                  className={`p-2 rounded-lg border transition-all flex flex-col justify-between ${
                    cantEnBorrador > 0
                      ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30'
                      : estaAgotado
                        ? 'bg-surface-container-high/40 border-surface-variant/20 opacity-50'
                        : 'bg-surface-container-high border-surface-variant/30 hover:border-surface-variant/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-bold text-on-surface leading-tight truncate"
                        title={prod.nombre}
                      >
                        {prod.nombre}
                      </h4>
                      <span
                        className={`text-[10px] font-medium block mt-0.5 ${
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
                        <span className="text-[10px] font-normal text-on-surface-variant">Bs.</span>
                      </span>
                    </div>
                  </div>

                  {/* Botón o Stepper de selección compacto */}
                  <div className="mt-1.5 flex items-center justify-end">
                    {estaAgotado ? (
                      <span className="text-[9px] text-error font-medium px-1.5 py-0.5 rounded bg-error-container/20 border border-error/30">
                        Sin existencias
                      </span>
                    ) : cantEnBorrador > 0 ? (
                      <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-md border border-primary/30">
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(prod.id_producto, -1)}
                          className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                          title="Disminuir"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs font-mono text-primary tabular-nums">
                          {cantEnBorrador}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(prod.id_producto, 1)}
                          disabled={cantEnBorrador >= stock}
                          className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright disabled:opacity-40 text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                          title="Aumentar"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCambiarCantidad(prod.id_producto, 1)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container hover:bg-primary hover:text-on-primary text-primary border border-primary/30 transition-all cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Derecha (35%): Resumen de Carga */}
      <div className="lg:col-span-4 bg-surface-container border border-surface-variant/30 rounded-xl p-3.5 flex flex-col justify-between h-full min-h-105 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-surface-variant/30 pb-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
              Resumen de Carga
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {itemsEnCarrito.length} {itemsEnCarrito.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          {/* Lista de ítems en borrador */}
          <div className="space-y-2 max-h-55 overflow-y-auto pr-1">
            {itemsEnCarrito.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant text-xs">
                <p>Ningún producto seleccionado aún.</p>
                <p className="text-[11px] opacity-70 mt-1">
                  Usa el botón &quot;+ Agregar&quot; en el catálogo.
                </p>
              </div>
            ) : (
              itemsEnCarrito.map((item) => (
                <div
                  key={item.id_producto}
                  className="p-2 rounded-lg bg-surface-container-high border border-surface-variant/30 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-on-surface block truncate">
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                      {item.cantidad} × {item.precio_unitario.toFixed(2)} Bs.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary tabular-nums text-xs">
                      {item.subtotal.toFixed(2)} Bs.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarItem(item.id_producto)}
                      className="p-1 rounded text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totales y Botones de acción */}
        <div className="pt-3 border-t border-surface-variant/30 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Subtotal a Cargar:</span>
            <span className="font-mono font-bold text-primary text-sm tabular-nums">
              {subtotalACargar.toFixed(2)} Bs.
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-on-surface-variant pt-1 border-t border-surface-variant/20">
            <span>Nuevo Total Consumos Mesa:</span>
            <span className="font-mono font-semibold text-on-surface tabular-nums">
              {nuevoTotalEstimado.toFixed(2)} Bs.
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 py-2 rounded-lg border border-surface-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarConsumos}
              disabled={guardando || itemsEnCarrito.length === 0}
              className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 text-center truncate"
            >
              {guardando
                ? 'Cargando...'
                : `Cargar a ${mesa.nombre} (+${subtotalACargar.toFixed(2)} Bs.)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgregarConsumoModal({ isOpen, onClose, mesa }) {
  if (!mesa) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agregar Consumo — ${mesa.nombre}`}
      subtitle="Selecciona productos del inventario para cargar a la cuenta de la mesa"
      badge="OCUPADA"
      icon={ShoppingCart}
      maxWidth="max-w-5xl"
    >
      <AgregarConsumoContent
        key={mesa.sesion?.id_sesion ? String(mesa.sesion.id_sesion) : String(mesa.id_mesa)}
        mesa={mesa}
        onClose={onClose}
      />
    </Modal>
  )
}
