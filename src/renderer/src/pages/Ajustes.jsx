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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Configuración del Sistema
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              v1.0 ACTIVO
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Parámetros operativos, tarifario en Bolivianos y distribución física de sala
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#111c26] border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SINCRONIZACIÓN LOCAL: Activa</span>
        </div>
      </div>

      {/* Contenido en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de Parámetros */}
        <div className="lg:col-span-7 bg-[#111c26] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Store className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg">Parámetros del Establecimiento</h2>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              Ajustes Principales
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo 1: Nombre Comercial del Local */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="nombre_local"
                  className="text-sm font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  Nombre Comercial del Local
                </label>
              </div>
              <p className="text-xs text-slate-400">
                Encabezado principal para tickets de caja y reportes del sistema.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo 2: Cantidad de Mesas en Pantalla */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                Cantidad de Mesas en Pantalla
              </label>
              <p className="text-xs text-slate-400">
                Mesas activas configuradas en la vista principal y panel de control.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#090f14] border border-slate-700/80 rounded-xl p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={handleDecrementMesas}
                    disabled={Number(formData.cantidad_mesas) <= 1}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-bold text-lg text-emerald-400 font-mono">
                    {formData.cantidad_mesas}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementMesas}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-wider">
                  MESAS ACTIVAS
                </span>
              </div>
            </div>

            {/* Campo 3: Tarifa por Hora Estándar */}
            <div className="space-y-2">
              <label htmlFor="tarifa_hora" className="text-sm font-semibold text-slate-200">
                Tarifa por Hora Estándar (Bs.)
              </label>
              <p className="text-xs text-slate-400">
                Tarifa estándar aplicada al cronómetro y cálculo proporcional por minuto.
              </p>
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-sm">
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
                  className="w-full pl-11 pr-4 py-2.5 bg-[#090f14] border border-slate-700/80 rounded-xl text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo 4: Cobro Mínimo Activo */}
            <div className="space-y-3 bg-[#090f14] border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      Cobro Mínimo de Tiempo
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formData.cobro_minimo_activo
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {formData.cobro_minimo_activo ? 'ACTIVO' : 'DESACTIVADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
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
                    formData.cobro_minimo_activo ? 'bg-emerald-500' : 'bg-slate-700'
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
                <div className="pt-3 border-t border-slate-800/60 flex items-center gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="minutos_minimos"
                      className="text-xs font-semibold text-slate-300"
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
                        className="w-24 px-3 py-1.5 bg-[#111c26] border border-slate-700/80 rounded-lg text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">minutos</span>
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
          <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg">Simulador de Cobro</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                EN VIVO
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Previsualización del costo según la tarifa actual de{' '}
              <span className="text-emerald-400 font-bold font-mono">
                {tarifa.toFixed(2)} Bs./h
              </span>
              :
            </p>

            <div className="space-y-3">
              {/* Item 1: 15 minutos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090f14] border border-slate-800/70">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">15 minutos</span>
                    {aplicaMinimoEn15 && (
                      <span className="block text-[11px] text-emerald-400/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-emerald-400">
                  Bs. {costo15.toFixed(2)}
                </span>
              </div>

              {/* Item 2: 1 hora completa */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090f14] border border-slate-800/70">
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">1 hora completa</span>
                    {aplicaMinimoEn60 && (
                      <span className="block text-[11px] text-emerald-400/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-emerald-400">
                  Bs. {costo60.toFixed(2)}
                </span>
              </div>

              {/* Item 3: 2 horas y 30 minutos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090f14] border border-slate-800/70">
                <div className="flex items-center gap-2.5">
                  <Hourglass className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">
                      2 horas y 30 minutos
                    </span>
                    {aplicaMinimoEn150 && (
                      <span className="block text-[11px] text-emerald-400/90 font-medium">
                        (Aplica mínimo {minutosMinimos}m)
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-emerald-400">
                  Bs. {costo150.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Fracción por minuto */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Fracción por minuto:</span>
              <span className="text-emerald-400 font-mono font-bold">
                Bs. {tarifaPorMinuto.toFixed(2)} / min
              </span>
            </div>
          </div>

          {/* Tarjeta de Resumen de Sala */}
          <div className="bg-[#111c26] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base">Capacidad de Sala</h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#090f14] border border-slate-800/70 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mesas en Sala
                </span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {formData.cantidad_mesas}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Mesas configuradas</span>
              </div>

              <div className="bg-[#090f14] border border-slate-800/70 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ingreso Estimado
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  Bs. {(Number(formData.cantidad_mesas) * tarifa).toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
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
