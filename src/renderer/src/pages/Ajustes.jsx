import { useState } from 'react'
import {
  Sliders,
  Store,
  Plus,
  Minus,
  Save,
  Clock,
  Timer,
  Hourglass,
  Layers,
  Coins
} from 'lucide-react'
import { useAjustesStore } from '../store/useAjustesStore'
import { toastSuccess, toastError } from '../utils/alertas'

export default function Ajustes() {
  const { ajustes, loading, saveAjustes } = useAjustesStore()

  const [formData, setFormData] = useState({
    nombre_local: ajustes?.nombre_local || 'Mi Billar',
    cantidad_mesas: Number(ajustes?.cantidad_mesas) || 8,
    tarifa_hora: Number(ajustes?.tarifa_hora) || 25.0,
    cobro_minimo_activo: ajustes?.cobro_minimo_activo ? 1 : 0,
    minutos_minimos: Number(ajustes?.minutos_minimos) || 30
  })

  const [guardando, setGuardando] = useState(false)

  // Cálculos en tiempo real para el simulador basados en lo que edita el usuario
  const tarifa = Number(formData.tarifa_hora) || 0
  const tarifaPorMinuto = tarifa / 60
  const cobroMinimoActivo = Boolean(formData.cobro_minimo_activo)
  const minutosMinimos = Number(formData.minutos_minimos) || 30

  // 15 minutos
  const aplicaMinimoEn15 = cobroMinimoActivo && minutosMinimos > 15
  const costo15 = aplicaMinimoEn15 ? minutosMinimos * tarifaPorMinuto : 15 * tarifaPorMinuto

  // 1 hora completa (60 min)
  const aplicaMinimoEn60 = cobroMinimoActivo && minutosMinimos > 60
  const costo60 = aplicaMinimoEn60 ? minutosMinimos * tarifaPorMinuto : 60 * tarifaPorMinuto

  // 2 horas y 30 minutos (150 min)
  const aplicaMinimoEn150 = cobroMinimoActivo && minutosMinimos > 150
  const costo150 = aplicaMinimoEn150 ? minutosMinimos * tarifaPorMinuto : 150 * tarifaPorMinuto

  const handleIncrementMesas = () => {
    setFormData((prev) => ({
      ...prev,
      cantidad_mesas: Number(prev.cantidad_mesas) + 1
    }))
  }

  const handleDecrementMesas = () => {
    setFormData((prev) => ({
      ...prev,
      cantidad_mesas: Math.max(1, Number(prev.cantidad_mesas) - 1)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nombre_local.trim()) {
      toastError('El nombre del local no puede estar vacío.')
      return
    }
    if (Number(formData.cantidad_mesas) < 1) {
      toastError('La cantidad de mesas debe ser al menos 1.')
      return
    }
    if (Number(formData.tarifa_hora) <= 0) {
      toastError('La tarifa por hora debe ser mayor a 0.')
      return
    }
    if (formData.cobro_minimo_activo && Number(formData.minutos_minimos) < 1) {
      toastError('Los minutos mínimos deben ser al menos 1.')
      return
    }

    setGuardando(true)
    try {
      await saveAjustes({
        nombre_local: formData.nombre_local.trim(),
        cantidad_mesas: Number(formData.cantidad_mesas),
        tarifa_hora: Number(formData.tarifa_hora),
        cobro_minimo_activo: formData.cobro_minimo_activo ? 1 : 0,
        minutos_minimos: Number(formData.minutos_minimos)
      })
      toastSuccess('Configuración guardada correctamente')
    } catch (err) {
      toastError(err.message || 'Error al guardar los ajustes')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-on-surface">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Configuración del Sistema
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-primary/15 text-primary border border-primary/30">
              v1.0 ACTIVO
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">
            Parámetros operativos, tarifario en Bolivianos y distribución física de sala
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-surface-container-low border border-surface-variant/30 px-3.5 py-1.5 rounded-xl text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>SINCRONIZACIÓN LOCAL: Activa</span>
        </div>
      </div>

      {/* Contenido en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de Parámetros */}
        <div className="lg:col-span-7 bg-surface-container-low/95 border border-surface-variant/30 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
            <div className="flex items-center gap-2 text-on-surface font-semibold">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="text-lg">Parámetros del Establecimiento</h2>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg border border-surface-variant/30">
              Ajustes Principales
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo 1: Nombre Comercial del Local */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="nombre_local"
                  className="text-sm font-semibold text-on-surface flex items-center gap-1.5"
                >
                  Nombre Comercial del Local
                </label>
              </div>
              <p className="text-xs text-on-surface-variant">
                Encabezado principal para tickets de caja y reportes del sistema.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  id="nombre_local"
                  type="text"
                  value={formData.nombre_local}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre_local: e.target.value }))
                  }
                  placeholder="Ej: Club Billar Bola 8"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-surface-variant/40 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Campo 2: Cantidad de Mesas en Pantalla */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Cantidad de Mesas en Pantalla
              </label>
              <p className="text-xs text-on-surface-variant">
                Mesas activas configuradas en la vista principal y panel de control.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-surface-container-high border border-surface-variant/40 rounded-xl p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={handleDecrementMesas}
                    disabled={Number(formData.cantidad_mesas) <= 1}
                    className="w-9 h-9 rounded-lg bg-surface-container-highest hover:bg-surface-bright disabled:opacity-40 text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-bold text-lg text-primary font-mono tabular-nums">
                    {formData.cantidad_mesas}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementMesas}
                    className="w-9 h-9 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs font-bold text-on-surface-variant tracking-wider">
                  MESAS ACTIVAS
                </span>
              </div>
            </div>

            {/* Campo 3: Tarifa por Hora Estándar */}
            <div className="space-y-2">
              <label htmlFor="tarifa_hora" className="text-sm font-semibold text-on-surface">
                Tarifa por Hora Estándar (Bs.)
              </label>
              <p className="text-xs text-on-surface-variant">
                Tarifa estándar aplicada al cronómetro y cálculo proporcional por minuto.
              </p>
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary font-bold text-sm">
                  Bs.
                </div>
                <input
                  id="tarifa_hora"
                  type="number"
                  step="0.5"
                  min="1"
                  value={formData.tarifa_hora}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tarifa_hora: e.target.value
                    }))
                  }
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container-high border border-surface-variant/40 rounded-xl text-primary font-mono font-bold text-base tabular-nums focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Campo 4: Cobro Mínimo Activo */}
            <div className="space-y-3 bg-surface-container border border-surface-variant/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface">
                      Cobro Mínimo de Tiempo
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formData.cobro_minimo_activo
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {formData.cobro_minimo_activo ? 'ACTIVO' : 'DESACTIVADO'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {formData.cobro_minimo_activo
                      ? `Aplica una tarifa base de Bs. ${(
                          (Number(formData.minutos_minimos) || 30) * tarifaPorMinuto
                        ).toFixed(2)} por los primeros ${
                          formData.minutos_minimos || 30
                        } min, fraccionando posteriormente.`
                      : 'Cobra estrictamente por minuto jugado desde el primer instante.'}
                  </p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cobro_minimo_activo: prev.cobro_minimo_activo ? 0 : 1
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.cobro_minimo_activo ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.cobro_minimo_activo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {Boolean(formData.cobro_minimo_activo) && (
                <div className="pt-3 border-t border-surface-variant/20 flex items-center gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="minutos_minimos"
                      className="text-xs font-semibold text-on-surface"
                    >
                      Minutos Mínimos a Cobrar:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="minutos_minimos"
                        type="number"
                        min="5"
                        step="5"
                        value={formData.minutos_minimos}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minutos_minimos: e.target.value
                          }))
                        }
                        className="w-24 px-3 py-1.5 bg-surface-container-high border border-surface-variant/40 rounded-lg text-primary font-mono font-bold text-sm tabular-nums focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-on-surface-variant font-medium">minutos</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Guardar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={guardando || loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Simulador de Cobro en Vivo */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta Simulador */}
          <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
              <div className="flex items-center gap-2 text-on-surface font-semibold">
                <Coins className="w-5 h-5 text-primary" />
                <h3 className="text-lg">Simulador de Cobro</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                EN VIVO
              </span>
            </div>

            <p className="text-xs text-on-surface-variant">
              Previsualización del costo según la tarifa actual de{' '}
              <span className="text-primary font-bold font-mono tabular-nums">
                {tarifa.toFixed(2)} Bs./h
              </span>
              :
            </p>

            <div className="space-y-3">
              {/* Item 1: 15 minutos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-surface-variant/30">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-on-surface-variant" />
                  <div>
                    <span className="text-sm font-semibold text-on-surface">15 minutos</span>
                    {aplicaMinimoEn15 && (
                      <span className="block text-[11px] text-primary/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-primary tabular-nums">
                  Bs. {costo15.toFixed(2)}
                </span>
              </div>

              {/* Item 2: 1 hora completa */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-surface-variant/30">
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-on-surface-variant" />
                  <div>
                    <span className="text-sm font-semibold text-on-surface">1 hora completa</span>
                    {aplicaMinimoEn60 && (
                      <span className="block text-[11px] text-primary/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-primary tabular-nums">
                  Bs. {costo60.toFixed(2)}
                </span>
              </div>

              {/* Item 3: 2 horas y 30 minutos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-surface-variant/30">
                <div className="flex items-center gap-2.5">
                  <Hourglass className="w-4 h-4 text-on-surface-variant" />
                  <div>
                    <span className="text-sm font-semibold text-on-surface">
                      2 horas y 30 minutos
                    </span>
                    {aplicaMinimoEn150 && (
                      <span className="block text-[11px] text-primary/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-primary tabular-nums">
                  Bs. {costo150.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Fracción por minuto */}
            <div className="pt-3 border-t border-surface-variant/30 flex items-center justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Fracción por minuto:</span>
              <span className="text-primary font-mono font-bold tabular-nums">
                Bs. {tarifaPorMinuto.toFixed(2)} / min
              </span>
            </div>
          </div>

          {/* Tarjeta de Resumen de Sala */}
          <div className="bg-surface-container-low/95 border border-surface-variant/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
              <div className="flex items-center gap-2 text-on-surface font-semibold">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-base">Capacidad de Sala</h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                ACTIVA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high border border-surface-variant/30 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Mesas en Sala
                </span>
                <span className="text-2xl font-bold font-mono text-on-surface mt-1 block tabular-nums">
                  {formData.cantidad_mesas}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                  Mesas configuradas
                </span>
              </div>

              <div className="bg-surface-container-high border border-surface-variant/30 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Ingreso Estimado
                </span>
                <span className="text-2xl font-bold font-mono text-primary mt-1 block tabular-nums">
                  Bs. {(Number(formData.cantidad_mesas) * tarifa).toFixed(2)}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                  Por hora llena ({formData.cantidad_mesas} mesas)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
