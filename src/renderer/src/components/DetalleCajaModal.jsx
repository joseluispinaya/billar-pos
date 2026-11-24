import { useState, useEffect } from 'react'
import {
  Clock,
  ShoppingBag,
  Banknote,
  QrCode,
  FileText,
  Calendar,
  Layers,
  UtensilsCrossed
} from 'lucide-react'
import Modal from './Modal'
import { useCajaStore } from '../store/useCajaStore'
import { toastError } from '../utils/alertas'

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

export default function DetalleCajaModal({ isOpen, onClose, tipo, id }) {
  const { getDetalleSesion, getDetalleVentaBarra } = useCajaStore()
  const [detalle, setDetalle] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !id || !tipo) return

    let isMounted = true

    const fetchDetalle = async () => {
      setLoading(true)
      try {
        let res = null
        if (tipo === 'MESA') {
          res = await getDetalleSesion(id)
        } else if (tipo === 'BARRA') {
          res = await getDetalleVentaBarra(id)
        }
        if (isMounted) {
          setDetalle(res)
        }
      } catch (err) {
        if (isMounted) {
          toastError(err.message || 'Error al cargar detalle')
          onClose?.()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDetalle()

    return () => {
      isMounted = false
    }
  }, [isOpen, id, tipo, getDetalleSesion, getDetalleVentaBarra, onClose])

  if (!isOpen) return null

  const esMesa = tipo === 'MESA'
  const tituloModal = esMesa
    ? `Detalle de Sesión - ${detalle?.mesa_nombre || 'Mesa'}`
    : `Detalle de Venta en Barra #${id}`
  const iconoModal = esMesa ? Layers : ShoppingBag

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tituloModal}
      subtitle={
        esMesa
          ? 'Desglose detallado de tiempo transcurrido y productos consumidos.'
          : 'Comprobante de venta directa de barra y productos despachados.'
      }
      icon={iconoModal}
      maxWidth="max-w-xl"
    >
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        {loading || !detalle ? (
          <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant text-xs">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p>Cargando información detallada...</p>
          </div>
        ) : esMesa ? (
          /* ========================================================== */
          /* DETALLE DE SESIÓN DE MESA                                   */
          /* ========================================================== */
          <>
            {/* Tarjeta de Información General */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30 space-y-1.5">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Horario y Duración
                </span>
                <p className="text-xs font-bold text-on-surface font-mono tabular-nums">
                  {formatearHora(detalle.fecha_inicio)} → {formatearHora(detalle.fecha_fin)}
                </p>
                <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Tiempo jugado:</span>
                  <strong className="text-on-surface font-mono font-bold tabular-nums">
                    {formatearDuracion(detalle.minutos_jugados)}
                  </strong>
                </div>
              </div>

              <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30 space-y-1.5">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-primary" />
                  Tarifa y Cobro
                </span>
                <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Tarifa aplicada:</span>
                  <strong className="text-on-surface font-mono tabular-nums">
                    {Number(detalle.tarifa_hora_aplicada || 25).toFixed(2)} Bs./h
                  </strong>
                </div>
                <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Costo tiempo:</span>
                  <strong className="text-primary font-mono font-bold tabular-nums">
                    {Number(detalle.costo_tiempo || 0).toFixed(2)} Bs.
                  </strong>
                </div>
              </div>
            </div>

            {/* Nota de cliente si existe */}
            {detalle.nota_cliente && (
              <div className="bg-surface-container-high/40 p-2.5 rounded-lg border border-surface-variant/30 text-xs text-on-surface-variant flex items-start gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block text-on-surface-variant">
                    Referencia / Nota del cliente:
                  </span>
                  <p className="text-on-surface mt-0.5">{detalle.nota_cliente}</p>
                </div>
              </div>
            )}

            {/* Tabla de Productos Consumidos */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                Consumos en Mesa ({detalle.consumos?.length || 0})
              </span>

              {!detalle.consumos || detalle.consumos.length === 0 ? (
                <div className="bg-surface-container/50 border border-surface-variant/20 rounded-xl p-4 text-center text-xs text-on-surface-variant">
                  No se registraron consumos de productos en esta sesión.
                </div>
              ) : (
                <div className="bg-surface-container/70 border border-surface-variant/30 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-surface-variant/30">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-center">Cant.</th>
                        <th className="py-2 px-3 text-right">P. Unit.</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/20 divide-dashed text-on-surface">
                      {detalle.consumos.map((item) => (
                        <tr key={item.id_detalle} className="hover:bg-surface-container-high/40">
                          <td className="py-2 px-3 font-medium">{item.producto_nombre}</td>
                          <td className="py-2 px-3 text-center tabular-nums font-mono">
                            {item.cantidad}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-on-surface-variant">
                            {Number(item.precio_unitario).toFixed(2)} Bs.
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                            {Number(item.subtotal).toFixed(2)} Bs.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Resumen Totalizador */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Subtotal Tiempo ({formatearDuracion(detalle.minutos_jugados)}):</span>
                <span className="font-mono tabular-nums text-on-surface">
                  {Number(detalle.costo_tiempo || 0).toFixed(2)} Bs.
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Subtotal Consumos ({detalle.consumos?.length || 0} ítems):</span>
                <span className="font-mono tabular-nums text-on-surface">
                  {Number(detalle.costo_consumo || 0).toFixed(2)} Bs.
                </span>
              </div>
              <div className="pt-2 border-t border-surface-variant/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface block">TOTAL PAGADO</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {detalle.metodo_pago === 'QR' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                        <QrCode className="w-3 h-3" /> QR Simple
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                        <Banknote className="w-3 h-3" /> Efectivo
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xl font-black font-mono text-primary tabular-nums">
                  {Number(detalle.total_pagar || 0).toFixed(2)}{' '}
                  <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
                </span>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================== */
          /* DETALLE DE VENTA EN BARRA                                  */
          /* ========================================================== */
          <>
            {/* Información General de la Venta */}
            <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Fecha y Hora:
                </span>
                <span className="text-xs font-mono tabular-nums text-on-surface-variant">
                  {formatearFechaHora(detalle.fecha_hora)}
                </span>
              </div>

              {detalle.nota && (
                <div className="pt-2 border-t border-surface-variant/20 flex items-start gap-1.5 text-xs text-on-surface-variant">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Nota: <strong className="text-on-surface">{detalle.nota}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Tabla de Productos Vendidos */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                Productos Despachados ({detalle.items?.length || 0})
              </span>

              <div className="bg-surface-container/70 border border-surface-variant/30 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-surface-variant/30">
                    <tr>
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">P. Unit.</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/20 divide-dashed text-on-surface">
                    {detalle.items?.map((item) => (
                      <tr key={item.id_detalle} className="hover:bg-surface-container-high/40">
                        <td className="py-2 px-3 font-medium">{item.producto_nombre}</td>
                        <td className="py-2 px-3 text-center tabular-nums font-mono">
                          {item.cantidad}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-on-surface-variant">
                          {Number(item.precio_unitario).toFixed(2)} Bs.
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                          {Number(item.subtotal).toFixed(2)} Bs.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Totalizador */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">TOTAL PAGADO</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {detalle.metodo_pago === 'QR' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                      <QrCode className="w-3 h-3" /> QR Simple
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                      <Banknote className="w-3 h-3" /> Efectivo
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xl font-black font-mono text-primary tabular-nums">
                {Number(detalle.total || 0).toFixed(2)}{' '}
                <span className="text-xs font-normal text-on-surface-variant">Bs.</span>
              </span>
            </div>
          </>
        )}

        {/* Botón único de Cerrar (sin botón de imprimir según restricciones) */}
        <div className="pt-3 border-t border-surface-variant/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
