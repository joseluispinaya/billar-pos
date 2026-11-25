import { useState } from 'react'
import { ShieldCheck, Copy, Check, KeyRound, Phone, MapPin } from 'lucide-react'
import { licenciaService } from '../services/licenciaService'
import { toastSuccess, toastError } from '../utils/alertas'

export default function ActivacionLicencia({ machineCode, onActivada }) {
  const [clave, setClave] = useState('')
  const [activando, setActivando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const handleCopiarCodigo = async () => {
    if (!machineCode) return
    try {
      await navigator.clipboard.writeText(machineCode)
      setCopiado(true)
      toastSuccess('Código copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      toastError('No se pudo copiar automáticamente. Cópialo manualmente.')
    }
  }

  const handleActivar = async (e) => {
    e?.preventDefault()
    const claveLimpia = clave.trim().toUpperCase()

    if (!claveLimpia) {
      toastError('Por favor ingresa la clave de activación.')
      return
    }

    setActivando(true)
    try {
      await licenciaService.activar(claveLimpia)
      toastSuccess('Licencia activada correctamente')
      onActivada?.()
    } catch (err) {
      toastError(err.message || 'Error al activar la licencia.')
    } finally {
      setActivando(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-surface-container-low border border-surface-variant/30 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Ícono y Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">
            Activación de Licencia
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
            El sistema requiere una clave de activación válida y exclusiva para operar en este
            equipo.
          </p>
        </div>

        {/* Bloque: Código de Equipo */}
        <div className="bg-surface-container rounded-xl p-3 border border-surface-variant/40 space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block">
            Código de Identificación del Equipo
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-primary font-bold tracking-wider text-sm tabular-nums">
              {machineCode || 'GENERANDO...'}
            </span>
            <button
              type="button"
              onClick={handleCopiarCodigo}
              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-variant/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar código al portapapeles"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary text-[11px]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="text-[11px]">Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formulario de Activación */}
        <form onSubmit={handleActivar} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-1">
              Clave de Activación
            </label>
            <input
              type="text"
              value={clave}
              onChange={(e) => setClave(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={25}
              autoFocus
              className="w-full bg-surface-container-high border border-surface-variant/40 rounded-xl px-3.5 py-2.5 text-center font-mono font-bold tracking-widest text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={activando || !clave.trim()}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {activando ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                <span>Verificando Clave...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Activar Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Pie de Contacto y Soporte */}
        <div className="border-t border-surface-variant/30 pt-4 mt-5 space-y-2 text-center">
          <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
            ¿Necesitas una clave de activación o deseas adquirir el sistema? Comunícate con:
          </p>

          <div className="pt-0.5">
            <span className="text-primary font-bold text-xs tracking-wide block">
              El_Zero_Byte — Desarrollo de Software
            </span>
            <span className="text-on-surface font-semibold text-xs block mt-0.5">
              Ing. José Luis Pinaya Balderrama
            </span>
            <span className="text-[10px] text-on-surface-variant/70 block">CEO & Fundador</span>
          </div>

          <div className="pt-1 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1.5 text-xs text-on-surface font-mono tabular-nums">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>73999726 - 75103050</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <MapPin className="w-3 h-3 text-on-surface-variant/70 shrink-0" />
              <span>Riberalta - Beni - Bolivia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
