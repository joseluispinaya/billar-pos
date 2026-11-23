import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  Plus,
  Minus,
  CheckCircle,
  QrCode,
  Banknote,
  UtensilsCrossed,
  Info
} from 'lucide-react'
import { useMesasStore } from '../store/useMesasStore'
import { useAjustesStore } from '../store/useAjustesStore'
import AgregarConsumoModal from '../components/AgregarConsumoModal'
import { formatearCronometro, calcularCostoTiempo } from '../utils/tiempo'
import { toastSuccess, toastError, confirmarAccion } from '../utils/alertas'

export default function ControlMesas() {
  const {
    mesas,
    mesaSeleccionadaId,
    loading,
    fetchMesas,
    seleccionarMesa,
    iniciarMesa,
    actualizarConsumo,
    finalizarMesa
  } = useMesasStore()

  const ajustes = useAjustesStore((state) => state.ajustes)

  const [ahoraMs, setAhoraMs] = useState(() => Date.now())
  const [modalConsumoAbierto, setModalConsumoAbierto] = useState(false)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO') // 'EFECTIVO' | 'QR'
  const [cobrando, setCobrando] = useState(false)

  // Cronómetro reactivo en vivo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setAhoraMs(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Cargar mesas al montar
  useEffect(() => {
    fetchMesas().catch((err) => console.error('Error fetching mesas:', err))
  }, [fetchMesas])

  // Contadores de mesas
  const totalMesas = mesas.length
  const ocupadas = useMemo(() => mesas.filter((m) => m.estado === 'OCUPADA').length, [mesas])
  const libres = totalMesas - ocupadas

  // Mesa seleccionada actual
  const mesaSeleccionada = useMemo(() => {
    return mesas.find((m) => m.id_mesa === mesaSeleccionadaId) || null
  }, [mesas, mesaSeleccionadaId])

  // Cálculo en vivo para la mesa seleccionada
  const calculoMesaSeleccionada = useMemo(() => {
    if (!mesaSeleccionada || mesaSeleccionada.estado !== 'OCUPADA' || !mesaSeleccionada.sesion) {
      return null
    }

    const { sesion } = mesaSeleccionada
    const { costoTiempo, minutos, ms } = calcularCostoTiempo(
      sesion.fecha_inicio,
      sesion.tarifa_hora_aplicada,
      ajustes?.cobro_minimo_activo,
      ajustes?.minutos_minimos,
      ahoraMs
    )

    const costoConsumo = Number(sesion.costo_consumo) || 0
    const totalPagar = Number((costoTiempo + costoConsumo).toFixed(2))

    return {
      ms,
      minutos,
      costoTiempo,
      costoConsumo,
      totalPagar,
      cronometro: formatearCronometro(ms)
    }
  }, [mesaSeleccionada, ajustes, ahoraMs])

  const handleIniciarMesa = async (idMesa, nombreMesa) => {
    try {
      await iniciarMesa(idMesa)
      toastSuccess(`Sesión iniciada en ${nombreMesa}`)
    } catch (err) {
      toastError(err.message || 'Error al iniciar la mesa')
    }
  }

  const handleActualizarCantidadConsumo = async (idDetalle, delta) => {
    try {
      await actualizarConsumo(idDetalle, delta)
    } catch (err) {
      toastError(err.message || 'Error al modificar cantidad de consumo')
    }
  }

  const handleFinalizarCobro = async () => {
    if (!mesaSeleccionada?.sesion?.id_sesion) return

    const total = calculoMesaSeleccionada?.totalPagar || 0
    const confirmado = await confirmarAccion({
      titulo: `¿Finalizar y Cobrar ${mesaSeleccionada.nombre}?`,
      texto: `Monto total a cobrar: Bs. ${total.toFixed(2)} mediante ${metodoPago}. La mesa quedará liberada para nuevos clientes.`,
      confirmText: `Cobrar Bs. ${total.toFixed(2)}`
    })

    if (confirmado) {
      setCobrando(true)
      try {
        await finalizarMesa(mesaSeleccionada.sesion.id_sesion, metodoPago)
        toastSuccess(`Sesión de ${mesaSeleccionada.nombre} cobrada y liberada con éxito`)
      } catch (err) {
        toastError(err.message || 'Error al finalizar la sesión')
      } finally {
        setCobrando(false)
      }
    }
  }

  return (
    <div className="p-4 h-[calc(100vh-4.5rem)] overflow-hidden">
      <div className="grid grid-cols-10 gap-4 h-full">
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA (70% -> col-span-7): Grilla de Mesas         */}
        {/* ============================================================== */}
        <div className="col-span-7 flex flex-col h-full min-h-0 space-y-3">
          {/* Barra superior de control */}
          <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h1 className="text-base font-bold text-on-surface tracking-tight">
                  Mesas de Billar
                </h1>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums">
                  {ocupadas} OCUPADAS
                </span>
                <span className="px-2.5 py-0.5 rounded-md font-semibold bg-surface-container text-on-surface-variant border border-surface-variant/30 tabular-nums">
                  {libres} LIBRES
                </span>
              </div>
            </div>

            <div className="text-xs font-mono font-medium text-on-surface-variant bg-surface-container border border-surface-variant/30 px-3 py-1 rounded-lg tabular-nums">
              Tarifa Base:{' '}
              <strong className="text-primary font-bold">
                {Number(ajustes?.tarifa_hora || 25).toFixed(2)} Bs.
              </strong>{' '}
              / hora
            </div>
          </div>

          {/* Grilla con scroll interno */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {loading && mesas.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Cargando estado de mesas...
              </div>
            ) : mesas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant text-sm">
                <Info className="w-8 h-8 mb-2 opacity-60" />
                No hay mesas activas configuradas. Ve al módulo de Ajustes para configurar la
                capacidad de la sala.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {mesas.map((mesa) => {
                  const estaOcupada = mesa.estado === 'OCUPADA'
                  const esSeleccionada = mesa.id_mesa === mesaSeleccionadaId

                  // Cálculo individual en vivo para la mesa
                  let tiempoMesa = null
                  if (estaOcupada && mesa.sesion) {
                    const calc = calcularCostoTiempo(
                      mesa.sesion.fecha_inicio,
                      mesa.sesion.tarifa_hora_aplicada,
                      ajustes?.cobro_minimo_activo,
                      ajustes?.minutos_minimos,
                      ahoraMs
                    )
                    tiempoMesa = {
                      ...calc,
                      cronometro: formatearCronometro(calc.ms)
                    }
                  }

                  const cantidadConsumos = mesa.sesion?.consumos?.length || 0

                  return (
                    <div
                      key={mesa.id_mesa}
                      onClick={() => {
                        if (estaOcupada) {
                          seleccionarMesa(mesa.id_mesa)
                        }
                      }}
                      className={`relative bg-surface-container-low/95 rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 select-none ${
                        estaOcupada ? 'cursor-pointer' : ''
                      } ${
                        esSeleccionada
                          ? 'border-primary ring-1 ring-primary/60 shadow-[0_0_20px_-3px_rgba(78,222,163,0.35)] bg-surface-container'
                          : estaOcupada
                            ? 'border-surface-variant/40 hover:border-primary/50'
                            : 'border-surface-variant/30 hover:border-surface-variant/50'
                      }`}
                    >
                      {/* Troneras decorativas (6 puntos en el paño) */}
                      <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>
                      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>
                      <span className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>
                      <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-surface-container-highest border border-surface-variant/70 shadow-inner"></span>

                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-on-surface tracking-wider uppercase">
                          {mesa.nombre}
                        </span>

                        <div className="flex items-center gap-1">
                          {esSeleccionada && (
                            <span className="bg-primary text-on-primary text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              ACTUAL
                            </span>
                          )}

                          {estaOcupada ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                              OCUPADA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant border border-surface-variant/30">
                              DISPONIBLE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo central de la mesa */}
                      <div className="my-3 py-2 flex flex-col items-center justify-center text-center">
                        {estaOcupada && tiempoMesa ? (
                          <div className="space-y-1">
                            {/* Cronómetro en vivo */}
                            <div className="flex items-center justify-center gap-1 text-on-surface font-mono font-bold text-xs tabular-nums">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{tiempoMesa.cronometro}</span>
                            </div>

                            {/* Costo en vivo del tiempo */}
                            <div className="text-xl font-bold font-mono text-primary tabular-nums">
                              {tiempoMesa.costoTiempo.toFixed(2)}{' '}
                              <span className="text-xs text-on-surface-variant font-normal">
                                Bs.
                              </span>
                            </div>

                            {/* Consumos cargados */}
                            <div className="text-[11px] text-on-surface-variant flex items-center justify-center gap-1">
                              <UtensilsCrossed className="w-3 h-3 text-on-surface-variant/70" />
                              <span>
                                {cantidadConsumos === 0
                                  ? 'Sin consumos'
                                  : `${cantidadConsumos} ${cantidadConsumos === 1 ? 'consumo' : 'consumos'}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 py-1">
                            <div className="w-7 h-7 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/50">
                              <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-on-surface-variant block">
                              SIN SESIÓN
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botón inferior de acción */}
                      <div className="mt-2 pt-2 border-t border-surface-variant/20">
                        {estaOcupada ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              seleccionarMesa(mesa.id_mesa)
                            }}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              esSeleccionada
                                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-variant/40'
                            }`}
                          >
                            <span>{esSeleccionada ? 'En Panel →' : 'Detalle'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleIniciarMesa(mesa.id_mesa, mesa.nombre)
                            }}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface border border-surface-variant/40 transition-all cursor-pointer text-center"
                          >
                            Iniciar Tiempo
                          </button>
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
        {/* COLUMNA DERECHA (30% -> col-span-3): Panel de Detalle y Cobro  */}
        {/* ============================================================== */}
        <div className="col-span-3 bg-surface-container-low/95 border border-surface-variant/30 rounded-xl p-3.5 flex flex-col justify-between overflow-hidden shadow-xl h-full min-h-0">
          {!mesaSeleccionada ||
          mesaSeleccionada.estado !== 'OCUPADA' ||
          !mesaSeleccionada.sesion ? (
            /* Estado vacío cuando no hay mesa ocupada seleccionada */
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container border border-surface-variant/30 flex items-center justify-center text-on-surface-variant/60 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-on-surface">Sin Mesa Seleccionada</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Haz clic en cualquier{' '}
                <strong className="text-primary font-bold">Mesa Ocupada</strong> o presiona{' '}
                <strong className="text-on-surface">Iniciar Tiempo</strong> en una mesa libre para
                cargar consumos y cobrar.
              </p>
            </div>
          ) : (
            /* Detalle de Mesa Ocupada */
            <div className="flex flex-col h-full justify-between min-h-0 space-y-3">
              {/* Bloque superior con scroll para consumos */}
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* 1. Cabecera de la mesa */}
                <div className="flex items-center justify-between border-b border-surface-variant/30 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-on-surface tracking-tight">
                      {mesaSeleccionada.nombre}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                      OCUPADA
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-on-surface-variant">
                    Tarifa: {Number(mesaSeleccionada.sesion.tarifa_hora_aplicada).toFixed(2)} Bs./h
                  </span>
                </div>

                {/* 2. Tarjeta de Telemetría en vivo */}
                <div className="bg-surface-container border border-surface-variant/30 rounded-xl p-3 space-y-2 shadow-inner shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1.5 font-bold text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      EN VIVO
                    </span>
                    <span>
                      Inicio:{' '}
                      {new Date(mesaSeleccionada.sesion.fecha_inicio).toLocaleTimeString('es-BO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Cronómetro grande */}
                  <div className="text-3xl font-black font-mono text-primary text-center tracking-tight tabular-nums drop-shadow-[0_0_10px_rgba(78,222,163,0.25)]">
                    {calculoMesaSeleccionada?.cronometro || '00:00:00'}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-variant/20">
                    <span className="text-on-surface-variant">Costo Tiempo Jugado:</span>
                    <span className="font-mono font-bold text-on-surface tabular-nums">
                      {calculoMesaSeleccionada?.costoTiempo.toFixed(2)} Bs.
                    </span>
                  </div>
                </div>

                {/* 3. Sección Consumos Bar */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface-container border border-surface-variant/30 rounded-xl p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                      Consumos Bar ({mesaSeleccionada.sesion.consumos?.length || 0})
                    </span>

                    <button
                      type="button"
                      onClick={() => setModalConsumoAbierto(true)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary hover:bg-primary-container text-on-primary transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-primary/20"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* Lista con scroll interno */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-22.5 max-h-40">
                    {!mesaSeleccionada.sesion.consumos ||
                    mesaSeleccionada.sesion.consumos.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center text-on-surface-variant/60 text-xs py-4">
                        Sin consumos cargados todavía.
                      </div>
                    ) : (
                      mesaSeleccionada.sesion.consumos.map((c) => (
                        <div
                          key={c.id_detalle}
                          className="p-1.5 rounded-lg bg-surface-container-high border border-surface-variant/30 flex items-center justify-between gap-1 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-on-surface block truncate text-[11px]">
                              {c.producto_nombre}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                              {Number(c.precio_unitario).toFixed(2)} Bs. c/u
                            </span>
                          </div>

                          {/* Stepper - qty + */}
                          <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded border border-surface-variant/40 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleActualizarCantidadConsumo(c.id_detalle, -1)}
                              className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center cursor-pointer"
                              title="Restar 1"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-on-surface text-[11px] tabular-nums">
                              {c.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleActualizarCantidadConsumo(c.id_detalle, 1)}
                              disabled={c.stock_actual < 1}
                              className="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-bright disabled:opacity-30 text-on-surface flex items-center justify-center cursor-pointer"
                              title="Sumar 1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <div className="text-right font-mono font-bold text-on-surface text-xs tabular-nums min-w-12.5 shrink-0">
                            {Number(c.subtotal).toFixed(2)} Bs.
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 mt-1 border-t border-surface-variant/20 flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Subtotal Consumos:</span>
                    <span className="font-mono font-bold text-on-surface tabular-nums">
                      {Number(mesaSeleccionada.sesion.costo_consumo || 0).toFixed(2)} Bs.
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Bloque inferior de Cobro */}
              <div className="pt-2 border-t border-surface-variant/30 space-y-2 shrink-0">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Alquiler Mesa (Tiempo):</span>
                    <span className="font-mono text-on-surface tabular-nums">
                      {calculoMesaSeleccionada?.costoTiempo.toFixed(2)} Bs.
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Consumo Bar & Snacks:</span>
                    <span className="font-mono text-on-surface tabular-nums">
                      {calculoMesaSeleccionada?.costoConsumo.toFixed(2)} Bs.
                    </span>
                  </div>
                </div>

                {/* Tarjeta destacada de Total */}
                <div className="bg-surface-container border border-surface-variant/40 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                  <span className="text-xs font-black text-on-surface uppercase tracking-wider">
                    TOTAL A COBRAR
                  </span>
                  <div className="text-2xl font-black font-mono text-primary tabular-nums tracking-tight">
                    {calculoMesaSeleccionada?.totalPagar.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
                  </div>
                </div>

                {/* Selector de Método de Pago */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      metodoPago === 'EFECTIVO'
                        ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                        : 'bg-surface-container border border-surface-variant/40 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('QR')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      metodoPago === 'QR'
                        ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                        : 'bg-surface-container border border-surface-variant/40 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Simple</span>
                  </button>
                </div>

                {/* Botón Finalizar y Cobrar */}
                <button
                  type="button"
                  onClick={handleFinalizarCobro}
                  disabled={cobrando}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-black text-sm shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cobrando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Procesando cobro...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Finalizar y Cobrar ({calculoMesaSeleccionada?.totalPagar.toFixed(2)} Bs.)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agregar Consumo */}
      {mesaSeleccionada && (
        <AgregarConsumoModal
          isOpen={modalConsumoAbierto}
          onClose={() => setModalConsumoAbierto(false)}
          mesa={mesaSeleccionada}
        />
      )}
    </div>
  )
}
