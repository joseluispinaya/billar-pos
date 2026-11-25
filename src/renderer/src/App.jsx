import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ControlMesas from './pages/ControlMesas'
import VentasBarra from './pages/VentasBarra'
import Productos from './pages/Productos'
import Caja from './pages/Caja'
import Ajustes from './pages/Ajustes'
import ActivacionLicencia from './pages/ActivacionLicencia'
import { useAjustesStore } from './store/useAjustesStore'
import { licenciaService } from './services/licenciaService'

export default function App() {
  const [vistaActual, setVistaActual] = useState('control')
  const [estadoLicencia, setEstadoLicencia] = useState({
    verificando: true,
    activa: false,
    machineCode: ''
  })

  const ajustes = useAjustesStore((state) => state.ajustes)
  const fetchAjustes = useAjustesStore((state) => state.fetchAjustes)

  // Verificación de Licencia al iniciar la app
  useEffect(() => {
    licenciaService
      .verificar()
      .then((data) => {
        setEstadoLicencia({
          verificando: false,
          activa: Boolean(data?.activa),
          machineCode: data?.machineCode || ''
        })
      })
      .catch((err) => {
        console.error('Error al verificar licencia:', err)
        setEstadoLicencia({
          verificando: false,
          activa: false,
          machineCode: ''
        })
      })
  }, [])

  // Inicializar ajustes solo cuando la licencia esté activa
  useEffect(() => {
    if (estadoLicencia.activa) {
      fetchAjustes().catch((err) => {
        console.error('Error al inicializar ajustes:', err)
      })
    }
  }, [estadoLicencia.activa, fetchAjustes])

  // 1. Pantalla de carga mínima mientras se verifica la licencia
  if (estadoLicencia.verificando) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface-variant text-xs select-none">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-medium tracking-wide">Iniciando sistema...</span>
      </div>
    )
  }

  // 2. Pantalla de Bloqueo y Activación si no tiene licencia válida
  if (!estadoLicencia.activa) {
    return (
      <ActivacionLicencia
        machineCode={estadoLicencia.machineCode}
        onActivada={() =>
          setEstadoLicencia((prev) => ({
            ...prev,
            activa: true
          }))
        }
      />
    )
  }

  // 3. Aplicación principal (con licencia activa)
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
