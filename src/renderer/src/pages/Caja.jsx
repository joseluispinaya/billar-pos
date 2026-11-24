import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Wallet,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
  FileDown,
  Layers,
  Banknote,
  QrCode,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react'
import { useCajaStore } from '../store/useCajaStore'
import DetalleCajaModal from '../components/DetalleCajaModal'
import { generarReporteCajaPdf } from '../utils/generarReporteCajaPdf'
import { toastSuccess, toastError } from '../utils/alertas'

const ITEMS_POR_PAGINA = 10

const getFechaLocalHoy = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatearHora(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    const horas = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${horas}:${mins}`
  } catch {
    return isoString
  }
}

function formatearFechaHora(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const anio = d.getFullYear()
    const horas = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${anio} ${horas}:${mins}`
  } catch {
    return isoString
  }
}

function formatearDuracion(minutos) {
  const m = Number(minutos) || 0
  const horas = Math.floor(m / 60)
  const mins = m % 60
  return `${String(horas).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
}

export default function Caja() {
  const { kpis, sesiones, ventasBarra, loading, fechaInicio, fechaFin, setFechas, fetchReporte } =
    useCajaStore()

  // Estados locales de la vista
  const [tabActivo, setTabActivo] = useState('mesas') // 'mesas' | 'barra'
  const [filtroPago, setFiltroPago] = useState('TODOS') // 'TODOS' | 'EFECTIVO' | 'QR'
  const [paginaActual, setPaginaActual] = useState(1)

  // Inputs locales de fecha para no disparar fetches en cada tecla
  const [inputFechaInicio, setInputFechaInicio] = useState(fechaInicio)
  const [inputFechaFin, setInputFechaFin] = useState(fechaFin)

  // Estado del modal de detalle
  const [modalDetalle, setModalDetalle] = useState({
    isOpen: false,
    tipo: 'MESA', // 'MESA' | 'BARRA'
    id: null
  })

  // Cargar datos al montar
  useEffect(() => {
    fetchReporte().catch((err) => {
      console.error('Error al inicializar caja:', err)
    })
  }, [fetchReporte])

  const handleCambiarTab = (tab) => {
    setTabActivo(tab)
    setPaginaActual(1)
  }

  const handleCambiarFiltroPago = (filtro) => {
    setFiltroPago(filtro)
    setPaginaActual(1)
  }

  // Manejo de cambio de fechas manual
  const handleFiltrarFechas = useCallback(
    async (fIni, fFin) => {
      try {
        setFechas(fIni, fFin)
        await fetchReporte(fIni, fFin)
        setPaginaActual(1)
      } catch (err) {
        toastError(err.message || 'Error al filtrar reporte')
      }
    },
    [setFechas, fetchReporte]
  )

  // Botón rápido "Hoy"
  const handleHoy = () => {
    const hoy = getFechaLocalHoy()
    setInputFechaInicio(hoy)
    setInputFechaFin(hoy)
    handleFiltrarFechas(hoy, hoy)
  }

  // Generar PDF
  const handleGenerarPdf = () => {
    try {
      generarReporteCajaPdf({
        kpis,
        sesiones,
        ventasBarra,
        fechaInicio: inputFechaInicio,
        fechaFin: inputFechaFin
      })
      toastSuccess('Reporte PDF generado y descargado correctamente.')
    } catch (err) {
      toastError(err.message || 'Error al generar el reporte PDF')
    }
  }

  // Filtrado de lista según el tab y método de pago
  const listaActual = tabActivo === 'mesas' ? sesiones : ventasBarra

  // Contadores para el sub-filtro de pago
  const contadoresPago = useMemo(() => {
    let efvo = 0
    let qr = 0
    listaActual.forEach((item) => {
      if (item.metodo_pago === 'EFECTIVO') efvo++
      if (item.metodo_pago === 'QR') qr++
    })
    return {
      todos: listaActual.length,
      efectivo: efvo,
      qr
    }
  }, [listaActual])

  const listaFiltrada = useMemo(() => {
    if (filtroPago === 'TODOS') return listaActual
    return listaActual.filter((item) => item.metodo_pago === filtroPago)
  }, [listaActual, filtroPago])

  // Paginación de 10 filas
  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITEMS_POR_PAGINA))
  const inicioIndex = (paginaActual - 1) * ITEMS_POR_PAGINA
  const itemsPaginados = listaFiltrada.slice(inicioIndex, inicioIndex + ITEMS_POR_PAGINA)

  // Subtotal de la página visible
  const subtotalPagina = useMemo(() => {
    return itemsPaginados.reduce((acc, item) => {
      const val = tabActivo === 'mesas' ? Number(item.total_pagar) : Number(item.total)
      return acc + (isNaN(val) ? 0 : val)
    }, 0)
  }, [itemsPaginados, tabActivo])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4.5rem)] overflow-hidden p-4">
      {/* ============================================================== */}
      {/* 1. COLUMNA IZQUIERDA (75% -> lg:col-span-9): Control + Tabla    */}
      {/* ============================================================== */}
      <div className="lg:col-span-9 flex flex-col gap-3 min-h-0 overflow-hidden">
        {/* Barra de Control */}
        <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 shadow-md">
          {/* Título y Tabs de Vista */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Reporte de Caja
            </h2>

            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-surface-variant/30">
              <button
                type="button"
                onClick={() => handleCambiarTab('mesas')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabActivo === 'mesas'
                    ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Mesas ({sesiones.length})
              </button>
              <button
                type="button"
                onClick={() => handleCambiarTab('barra')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabActivo === 'barra'
                    ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Barra ({ventasBarra.length})
              </button>
            </div>
          </div>

          {/* Selectores de Fechas y Botón Exportar PDF */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleHoy}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-variant/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Ver movimientos del día actual"
            >
              <RotateCcw className="w-3 h-3 text-primary" />
              Hoy
            </button>

            <div className="flex items-center gap-1.5 bg-surface-container border border-surface-variant/40 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[10px] uppercase font-semibold text-on-surface-variant">
                Desde:
              </span>
              <input
                type="date"
                value={inputFechaInicio}
                onChange={(e) => {
                  setInputFechaInicio(e.target.value)
                  handleFiltrarFechas(e.target.value, inputFechaFin)
                }}
                className="bg-transparent text-on-surface text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container border border-surface-variant/40 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[10px] uppercase font-semibold text-on-surface-variant">
                Hasta:
              </span>
              <input
                type="date"
                value={inputFechaFin}
                onChange={(e) => {
                  setInputFechaFin(e.target.value)
                  handleFiltrarFechas(inputFechaInicio, e.target.value)
                }}
                className="bg-transparent text-on-surface text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerarPdf}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar reporte detallado en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              Generar Reporte PDF
            </button>
          </div>
        </div>

        {/* Contenedor de la Tabla */}
        <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl overflow-hidden shadow-md flex-1 flex flex-col min-h-0">
          {/* Barra superior de la tabla: Subfiltros de Método de Pago */}
          <div className="bg-surface-container/60 p-2.5 px-3 border-b border-surface-variant/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mr-1">
                Método de Pago:
              </span>
              <button
                type="button"
                onClick={() => handleCambiarFiltroPago('TODOS')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filtroPago === 'TODOS'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                }`}
              >
                Todos ({contadoresPago.todos})
              </button>
              <button
                type="button"
                onClick={() => handleCambiarFiltroPago('EFECTIVO')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  filtroPago === 'EFECTIVO'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                Efectivo ({contadoresPago.efectivo})
              </button>
              <button
                type="button"
                onClick={() => handleCambiarFiltroPago('QR')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  filtroPago === 'QR'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-variant/30'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Simple ({contadoresPago.qr})
              </button>
            </div>

            <div className="text-[11px] font-mono text-on-surface-variant tabular-nums">
              Mostrando <strong className="text-on-surface">{listaFiltrada.length}</strong>{' '}
              registros
            </div>
          </div>

          {/* Tabla con scroll interno */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant text-xs">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                Cargando registros de caja...
              </div>
            ) : itemsPaginados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant text-xs">
                <Wallet className="w-8 h-8 opacity-40 mb-1" />
                <p>No se encontraron registros para los filtros seleccionados.</p>
              </div>
            ) : tabActivo === 'mesas' ? (
              /* TABLA DE SESIONES DE MESAS */
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-surface-variant/30">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Mesa / Horario</th>
                    <th className="py-2.5 px-4 font-semibold">Tiempo / Costo</th>
                    <th className="py-2.5 px-4 font-semibold">Consumo</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total / Pago</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20 divide-dashed text-on-surface">
                  {itemsPaginados.map((sesion) => (
                    <tr
                      key={sesion.id_sesion}
                      className="hover:bg-surface-container/40 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-on-surface">{sesion.mesa_nombre}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                          {formatearHora(sesion.fecha_inicio)} → {formatearHora(sesion.fecha_fin)}
                        </div>
                        {sesion.nota_cliente && (
                          <div className="text-[10px] text-primary/80 truncate max-w-[180px]">
                            Ref: {sesion.nota_cliente}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-mono tabular-nums font-semibold text-on-surface">
                          {formatearDuracion(sesion.minutos_jugados)}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                          {Number(sesion.costo_tiempo || 0).toFixed(2)} Bs.
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-mono tabular-nums font-semibold text-on-surface">
                          {Number(sesion.costo_consumo || 0).toFixed(2)} Bs.
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {Number(sesion.total_items) > 0
                            ? `${sesion.total_items} ${sesion.total_items === 1 ? 'ítem' : 'ítems'}`
                            : 'Sin consumos'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="font-bold font-mono text-primary tabular-nums text-sm">
                          {Number(sesion.total_pagar || 0).toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-on-surface-variant">
                            Bs.
                          </span>
                        </div>
                        <div className="mt-0.5 inline-block">
                          {sesion.metodo_pago === 'QR' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                              <QrCode className="w-2.5 h-2.5" /> QR Simple
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary border border-primary/30">
                              <Banknote className="w-2.5 h-2.5" /> Efectivo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setModalDetalle({
                              isOpen: true,
                              tipo: 'MESA',
                              id: sesion.id_sesion
                            })
                          }
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-variant/40 transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* TABLA DE VENTAS EN BARRA */
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-surface-variant/30">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Venta / Fecha y Hora</th>
                    <th className="py-2.5 px-4 font-semibold">Productos</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total / Pago</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20 divide-dashed text-on-surface">
                  {itemsPaginados.map((venta) => (
                    <tr
                      key={venta.id_venta}
                      className="hover:bg-surface-container/40 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-on-surface flex items-center gap-1.5">
                          <span>#{venta.id_venta}</span>
                          {venta.nota && (
                            <span className="text-[11px] font-normal text-on-surface-variant truncate max-w-[200px]">
                              • {venta.nota}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                          {formatearFechaHora(venta.fecha_hora)}
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-mono tabular-nums font-semibold text-on-surface">
                          {venta.total_items} {venta.total_items === 1 ? 'ítem' : 'ítems'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="font-bold font-mono text-primary tabular-nums text-sm">
                          {Number(venta.total || 0).toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-on-surface-variant">
                            Bs.
                          </span>
                        </div>
                        <div className="mt-0.5 inline-block">
                          {venta.metodo_pago === 'QR' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                              <QrCode className="w-2.5 h-2.5" /> QR Simple
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary border border-primary/30">
                              <Banknote className="w-2.5 h-2.5" /> Efectivo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setModalDetalle({
                              isOpen: true,
                              tipo: 'BARRA',
                              id: venta.id_venta
                            })
                          }
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-variant/40 transition-colors cursor-pointer"
                          title="Ver detalle de venta"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pie de Paginación Integrado */}
          <div className="bg-surface-container/70 p-2.5 px-4 flex items-center justify-between border-t border-surface-variant/30 text-xs shrink-0">
            <div className="text-on-surface-variant text-[11px] tabular-nums">
              Mostrando{' '}
              <strong className="text-on-surface">
                {listaFiltrada.length === 0 ? 0 : inicioIndex + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-on-surface">
                {Math.min(listaFiltrada.length, inicioIndex + ITEMS_POR_PAGINA)}
              </strong>{' '}
              de <strong className="text-on-surface">{listaFiltrada.length}</strong> registros
            </div>

            {/* Stepper de páginas */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-primary text-on-primary">
                {paginaActual} / {totalPaginas}
              </span>

              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtotal Página */}
            <div className="text-right text-[11px] font-mono tabular-nums">
              <span className="text-on-surface-variant">Subtotal Página: </span>
              <strong className="text-primary font-bold">{subtotalPagina.toFixed(2)} Bs.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. COLUMNA DERECHA (25% -> lg:col-span-3): Resumen Contable    */}
      {/* ============================================================== */}
      <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
        {/* KPI 1: Tiempo en Mesas */}
        <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Tiempo en Mesas
            </span>
            <div className="p-1.5 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant/40">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-on-surface tabular-nums">
              {Number(kpis?.ingresoTiempo || 0).toFixed(2)}{' '}
              <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, kpis?.porcentajeTiempo || 0))}%` }}
                />
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium block text-right tabular-nums">
                {kpis?.porcentajeTiempo || 0}% del total recaudado
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Consumo en Mesas */}
        <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Consumo en Mesas
            </span>
            <div className="p-1.5 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant/40">
              <UtensilsCrossed className="w-4 h-4 text-tertiary" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-on-surface tabular-nums">
              {Number(kpis?.ingresoConsumoMesas || 0).toFixed(2)}{' '}
              <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, kpis?.porcentajeConsumoMesas || 0))}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium tabular-nums">
                <span>{kpis?.cantidadItemsMesas || 0} ítems despachados</span>
                <span>{kpis?.porcentajeConsumoMesas || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Ventas en Barra */}
        <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Ventas en Barra
            </span>
            <div className="p-1.5 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant/40">
              <ShoppingBag className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-on-surface tabular-nums">
              {Number(kpis?.ingresoBarra || 0).toFixed(2)}{' '}
              <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-on-surface-variant font-medium border-t border-surface-variant/20 pt-1.5 tabular-nums">
              <span>{kpis?.cantidadVentasBarra || 0} ventas</span>
              <span className="text-surface-variant">•</span>
              <span>{kpis?.cantidadItemsBarra || 0} ítems</span>
              <span className="text-surface-variant">•</span>
              <span className="text-secondary font-bold">{kpis?.porcentajeBarra || 0}%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Recaudado (Destacada al final con borde esmeralda) */}
        <div className="bg-surface-container-low/95 border border-primary/40 rounded-xl p-3.5 shadow-md shadow-primary/5 flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Recaudado
            </span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-primary tabular-nums tracking-tight">
              {Number(kpis?.totalRecaudado || 0).toFixed(2)}{' '}
              <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant font-mono tabular-nums border-t border-surface-variant/20 pt-1.5">
              <span>
                Efvo:{' '}
                <strong className="text-on-surface">
                  {Number(kpis?.totalEfectivo || 0).toFixed(2)} Bs.
                </strong>
              </span>
              <span className="text-surface-variant">•</span>
              <span>
                QR:{' '}
                <strong className="text-secondary">
                  {Number(kpis?.totalQr || 0).toFixed(2)} Bs.
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {modalDetalle.isOpen && (
        <DetalleCajaModal
          isOpen={modalDetalle.isOpen}
          tipo={modalDetalle.tipo}
          id={modalDetalle.id}
          onClose={() => setModalDetalle({ isOpen: false, tipo: 'MESA', id: null })}
        />
      )}
    </div>
  )
}
