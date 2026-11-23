import { useState, useEffect } from 'react'
import { LayoutGrid, ShoppingBag, Package, Wallet, Settings, Clock } from 'lucide-react'
import logoBola from '../assets/logobola.png'
import { useAjustesStore } from '../store/useAjustesStore'

const NAV_ITEMS = [
  { id: 'control', label: 'Control', icon: LayoutGrid },
  { id: 'barra', label: 'Ventas Barra', icon: ShoppingBag },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'caja', label: 'Caja', icon: Wallet },
  { id: 'ajustes', label: 'Ajustes', icon: Settings }
]

function formatClock(date) {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const diaSemana = dias[date.getDay()]
  const dia = date.getDate()
  const mes = meses[date.getMonth()]
  const hora = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const seg = String(date.getSeconds()).padStart(2, '0')

  return `${diaSemana}, ${dia} ${mes} • ${hora}:${min}:${seg}`
}

export default function Navbar({ vistaActual, setVistaActual }) {
  const ajustes = useAjustesStore((state) => state.ajustes)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-surface-container-high/90 backdrop-blur-md border-b border-surface-variant/30 shadow-lg px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Izquierda: Logo + Nombre del Local */}
        <div className="flex items-center gap-3 min-w-55">
          <img
            src={logoBola}
            alt="Logo Bola 8"
            className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(78,222,163,0.3)]"
          />
          <div className="flex flex-col">
            <span className="text-on-surface font-bold text-base tracking-wide leading-tight line-clamp-1">
              {ajustes?.nombre_local || 'Mi Billar'}
            </span>
            <span className="text-xs font-medium text-primary flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Sistema Operativo
            </span>
          </div>
        </div>

        {/* Centro: Botones de Navegación */}
        <nav className="flex items-center bg-surface-container-low/80 p-1 rounded-xl border border-surface-variant/20 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = vistaActual === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVistaActual(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 font-semibold'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Derecha: Reloj Digital en Vivo */}
        <div className="flex items-center justify-end gap-2 text-on-surface text-sm font-medium min-w-55">
          <div className="flex items-center gap-2 bg-surface-container-low border border-surface-variant/20 px-3.5 py-1.5 rounded-xl shadow-inner font-mono text-xs md:text-sm text-on-surface tabular-nums">
            <Clock className="w-4 h-4 text-primary" />
            <span className="tracking-wide">{formatClock(currentDate)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
