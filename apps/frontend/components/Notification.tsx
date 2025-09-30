import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X, Loader2, TrendingUp, Wallet } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface NotificationProps {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  txHash?: string
}

export function Notification({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose,
  action,
  txHash 
}: NotificationProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, type])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 border-red-500/20'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'loading':
        return 'bg-blue-500/10 border-blue-500/20'
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`
        relative overflow-hidden
        backdrop-blur-xl ${getBgColor()}
        border rounded-xl p-4 shadow-2xl
        min-w-[350px] max-w-[450px]
        ${isClosing ? 'pointer-events-none' : ''}
      `}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 pointer-events-none" />
      
      {/* Progress bar for auto-close */}
      {duration > 0 && type !== 'loading' && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      <div className="relative flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-1">
          <h3 className="text-white font-semibold">{title}</h3>
          {message && (
            <p className="text-gray-300 text-sm">{message}</p>
          )}
          
          {txHash && (
            <a 
              href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1 mt-2"
            >
              View on Explorer
              <TrendingUp className="w-3 h-3" />
            </a>
          )}
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition"
            >
              {action.label}
            </button>
          )}
        </div>

        {type !== 'loading' && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Notification Container
export function NotificationContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence mode="sync">
        {children}
      </AnimatePresence>
    </div>
  )
}

