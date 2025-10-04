import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { NotificationContainer, Notification } from '../components/Notification'
import { NotificationProvider, useNotifications } from '../context/NotificationContext'

function AppContent({ Component, pageProps }: AppProps) {
  const { notifications } = useNotifications()
  
  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <NotificationContainer>
        {notifications?.map((notification) => (
          <Notification key={notification.id} {...notification} />
        )) || null}
      </NotificationContainer>
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <NotificationProvider>
      <AppContent {...props} />
    </NotificationProvider>
  )
}
