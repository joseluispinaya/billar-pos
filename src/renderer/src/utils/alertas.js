import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const DarkToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0f172a',
  color: '#f8fafc',
  iconColor: '#10b981',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

export function toastSuccess(mensaje) {
  return DarkToast.fire({
    icon: 'success',
    title: mensaje
  })
}

export function toastError(mensaje) {
  return DarkToast.fire({
    icon: 'error',
    iconColor: '#ef4444',
    title: mensaje
  })
}

export async function confirmarAccion({
  titulo = '¿Estás seguro?',
  texto = '',
  confirmText = 'Sí, continuar'
} = {}) {
  const result = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    background: '#0f172a',
    color: '#f8fafc',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#475569',
    reverseButtons: true,
    customClass: {
      popup: 'border border-slate-700/80 rounded-2xl shadow-2xl'
    }
  })

  return result.isConfirmed
}
