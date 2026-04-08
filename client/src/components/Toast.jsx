import React, { useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const Toast = () => {
  const { toasts = [], removeToast } = useToast()

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-800 bg-green-950'
      case 'error':
        return 'border-red-800 bg-red-950'
      default:
        return 'border-blue-800 bg-blue-950'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {(toasts || []).map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 rounded-lg border ${getToastStyles(toast.type)} animate-slide-up max-w-md`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm text-foreground">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
