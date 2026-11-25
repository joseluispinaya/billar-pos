import { useMemo, useState } from 'react'
import { ArrowLeftRight, AlertCircle } from 'lucide-react'
import Modal from './Modal'
import { useMesasStore } from '../store/useMesasStore'
import { toastSuccess, toastError, confirmarAccion } from '../utils/alertas'

export default function CambiarMesaModal({ isOpen, onClose, mesa }) {
  const { mesas, cambiarMesa } = useMesasStore()
  const [procesando, setProcesando] = useState(false)

  // Mesas activas que se encuentren LIBRES y no sean la mesa actual
  const mesasLibres = useMemo(() => {
    if (!mesa) return []
    return mesas.filter((m) => m.activo === 1 && m.estado === 'LIBRE' && m.id_mesa !== mesa.id_mesa)
  }, [mesas, mesa])

  if (!isOpen || !mesa || !mesa.sesion) return null

  const handleSeleccionarMesaDestino = async (mesaDestino) => {
    const confirmado = await confirmarAccion({
      titulo: '¿Cambiar de mesa?',
      texto: `¿Deseas transferir la sesión activa de ${mesa.nombre} a ${mesaDestino.nombre}?`,
      botonConfirmar: 'Sí, cambiar mesa'
    })

    if (!confirmado) return

    setProcesando(true)
    try {
      await cambiarMesa(mesa.sesion.id_sesion, mesaDestino.id_mesa)
      toastSuccess(`Sesión transferida exitosamente a ${mesaDestino.nombre}`)
      onClose()
    } catch (err) {
      toastError(err.message || 'Error al transferir la mesa')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cambiar Mesa — ${mesa.nombre}`}
      subtitle="Se transferirá el tiempo transcurrido y los consumos acumulados a la nueva mesa seleccionada"
      icon={ArrowLeftRight}
      badge="OCUPADA"
      maxWidth="max-w-md"
    >
      <div className="p-4 space-y-4">
        {/* Info resumen de la sesión actual */}
        <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
              Mesa Origen
            </span>
            <span className="font-bold text-on-surface text-sm">{mesa.nombre}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
              Consumos cargados
            </span>
            <span className="font-mono tabular-nums font-bold text-primary">
              {Number(mesa.sesion.costo_consumo || 0).toFixed(2)} Bs. (
              {mesa.sesion.consumos?.length || 0} ítems)
            </span>
          </div>
        </div>

        {/* Sección de selección de mesa destino */}
        <div>
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
            Selecciona la Mesa Destino (Libre)
          </span>

          {mesasLibres.length === 0 ? (
            <div className="py-8 px-4 text-center bg-surface-container/50 border border-surface-variant/20 rounded-xl space-y-2">
              <AlertCircle className="w-8 h-8 text-tertiary mx-auto opacity-70" />
              <p className="text-xs font-semibold text-on-surface">
                No hay mesas libres disponibles
              </p>
              <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                Todas las demás mesas del salón están actualmente ocupadas. Libera o finaliza una
                mesa para poder transferir esta sesión.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {mesasLibres.map((m) => (
                <button
                  key={m.id_mesa}
                  type="button"
                  disabled={procesando}
                  onClick={() => handleSeleccionarMesaDestino(m)}
                  className="p-3 rounded-xl border border-surface-variant/40 bg-surface-container hover:border-primary hover:bg-surface-container-high transition-all text-center cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                    {m.nombre}
                  </span>
                  <span className="text-[10px] text-primary font-medium mt-1 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    LIBRE
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón de cierre */}
        <div className="pt-2 border-t border-surface-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
