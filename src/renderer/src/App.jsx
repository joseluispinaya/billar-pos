import { useState, useEffect } from 'react'
import { LayoutGrid, ShoppingBag, Wallet } from 'lucide-react'
import Navbar from './components/Navbar'
import Ajustes from './pages/Ajustes'
import Productos from './pages/Productos'
import { useAjustesStore } from './store/useAjustesStore'

function PlaceholderView({ title, description, icon: Icon }) {
  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-primary mb-4 shadow-xl">
        <Icon className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-on-surface mb-2">{title}</h2>
      <p className="text-on-surface-variant max-w-md text-sm">{description}</p>
      <div className="mt-6 px-3.5 py-1 rounded-full bg-surface-container-low border border-surface-variant/30 text-xs font-mono text-on-surface-variant">
        Módulo en preparación
      </div>
    </div>
  )
}

export default function App() {
  const [vistaActual, setVistaActual] = useState('ajustes')
  const ajustes = useAjustesStore((state) => state.ajustes)
  const fetchAjustes = useAjustesStore((state) => state.fetchAjustes)

  useEffect(() => {
    fetchAjustes().catch((err) => {
      console.error('Error al inicializar ajustes:', err)
    })
  }, [fetchAjustes])

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <Navbar vistaActual={vistaActual} setVistaActual={setVistaActual} />

      <main className="flex-1 pb-10">
        {vistaActual === 'control' && (
          <PlaceholderView
            title="Control de Mesas"
            description="Supervisión de mesas en vivo, cronómetros de juego y consumos asociados."
            icon={LayoutGrid}
          />
        )}

        {vistaActual === 'barra' && (
          <PlaceholderView
            title="Ventas en Barra"
            description="Registro ágil de pedidos directos y venta de productos sin mesa."
            icon={ShoppingBag}
          />
        )}

        {vistaActual === 'productos' && <Productos />}

        {vistaActual === 'caja' && (
          <PlaceholderView
            title="Caja y Arqueo Diario"
            description="Consolidado de ingresos, desglose por mesas vs. barra y métodos de pago (Efectivo/QR)."
            icon={Wallet}
          />
        )}

        {vistaActual === 'ajustes' && (
          <Ajustes key={ajustes?.id ? `${ajustes.id}-${ajustes.nombre_local}` : 'init'} />
        )}
      </main>
    </div>
  )
}
