import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon,
  maxWidth = 'max-w-2xl',
  children
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div
        className={`bg-surface-container-low border border-surface-variant/50 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-surface-variant/30 bg-surface-container/90">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-on-surface tracking-tight">{title}</h3>
                {badge && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary/15 text-primary border border-primary/30">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1 text-on-surface">{children}</div>
      </div>
    </div>
  )
}
