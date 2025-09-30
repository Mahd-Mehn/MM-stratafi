import React, { createContext, useContext, useState, useCallback } from 'react'
import { NotificationProps } from '../components/Notification'

interface NotificationContextType {
  notifications: NotificationProps[]
  notify: (notification: Omit<NotificationProps, 'id' | 'onClose'>) => string
  success: (title: string, message?: string, options?: Partial<NotificationProps>) => string
  error: (title: string, message?: string, options?: Partial<NotificationProps>) => string
  warning: (title: string, message?: string, options?: Partial<NotificationProps>) => string
  info: (title: string, message?: string, options?: Partial<NotificationProps>) => string
  loading: (title: string, message?: string) => string
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

let notificationId = 0

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = useCallback((notification: Omit<NotificationProps, 'id' | 'onClose'>) => {
    const id = `notification-${++notificationId}`
    const newNotification: NotificationProps = {
      ...notification,
      id,
      onClose: () => dismiss(id)
    }
    setNotifications(prev => [...prev, newNotification])
    return id
  }, [dismiss])

  const success = useCallback((title: string, message?: string, options?: Partial<NotificationProps>) => {
    return notify({ type: 'success', title, message, ...options })
  }, [notify])

  const error = useCallback((title: string, message?: string, options?: Partial<NotificationProps>) => {
    return notify({ type: 'error', title, message, ...options })
  }, [notify])

  const warning = useCallback((title: string, message?: string, options?: Partial<NotificationProps>) => {
    return notify({ type: 'warning', title, message, ...options })
  }, [notify])

  const info = useCallback((title: string, message?: string, options?: Partial<NotificationProps>) => {
    return notify({ type: 'info', title, message, ...options })
  }, [notify])

  const loading = useCallback((title: string, message?: string) => {
    return notify({ type: 'loading', title, message, duration: 0 })
  }, [notify])

  return (
    <NotificationContext.Provider value={{
      notifications,
      notify,
      success,
      error,
      warning,
      info,
      loading,
      dismiss
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
