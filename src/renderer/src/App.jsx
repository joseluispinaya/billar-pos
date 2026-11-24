import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ControlMesas from './pages/ControlMesas'
import VentasBarra from './pages/VentasBarra'
import Productos from './pages/Productos'
import Caja from './pages/Caja'
import Ajustes from './pages/Ajustes'
import { useAjustesStore } from './store/useAjustesStore'

export default function App() {
  const [vistaActual, setVistaActual] = useState('control')
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
        {vistaActual === 'control' && <ControlMesas />}

        {vistaActual === 'barra' && <VentasBarra />}

        {vistaActual === 'productos' && <Productos />}

        {vistaActual === 'caja' && <Caja />}

        {vistaActual === 'ajustes' && (
          <Ajustes key={ajustes?.id ? `${ajustes.id}-${ajustes.nombre_local}` : 'init'} />
        )}
      </main>
    </div>
  )
}
