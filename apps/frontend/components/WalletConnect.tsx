import React, { useEffect, useState } from 'react'
import { Wallet, User } from 'lucide-react'

interface WalletState {
  connected: boolean
  address?: string
  connecting: boolean
  error?: string
}

export function WalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false
  })

  useEffect(() => {
    checkWalletConnection()
    
    // Listen for account changes
    if (window.aptos) {
      window.aptos.onAccountChange?.((newAccount: any) => {
        if (newAccount) {
          setWalletState({
            connected: true,
            address: newAccount.address,
            connecting: false
          })
        } else {
          setWalletState({
            connected: false,
            connecting: false
          })
        }
      })
    }
  }, [])

  const checkWalletConnection = async () => {
    try {
      if (!window.aptos) {
        return
      }
      
      // Handle both promise and direct boolean returns
      let isConnected: boolean
      try {
        const result = window.aptos.isConnected()
        isConnected = result instanceof Promise ? await result : result
      } catch {
        isConnected = false
      }
      
      if (isConnected) {
        const account = await window.aptos.account()
        setWalletState({
          connected: true,
          address: account.address,
          connecting: false
        })
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const connectWallet = async () => {
    try {
      // Check if Petra wallet is installed
      if (!window.aptos) {
        window.open('https://petra.app/', '_blank')
        setWalletState(prev => ({
          ...prev,
          error: 'Please install Petra wallet extension'
        }))
        return
      }

      setWalletState(prev => ({ ...prev, connecting: true, error: undefined }))

      // Connect to Petra wallet
      const response = await window.aptos.connect()
      
      if (response) {
        const account = await window.aptos.account()
        setWalletState({
          connected: true,
          address: account.address,
          connecting: false
        })
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      setWalletState({
        connected: false,
        connecting: false,
        error: error.message || 'Failed to connect wallet'
      })
    }
  }

  const disconnectWallet = async () => {
    try {
      if (window.aptos) {
        await window.aptos.disconnect()
      }
      setWalletState({
        connected: false,
        connecting: false
      })
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center relative">
      {walletState.connected ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-lg">
            <User className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-gray-300">
              {formatAddress(walletState.address || '')}
            </span>
          </div>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end">
          <button
            onClick={connectWallet}
            disabled={walletState.connecting}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            <span>
              {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
            </span>
          </button>
          
          {walletState.error && (
            <div className="absolute top-12 right-0 mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg max-w-xs">
              <p className="text-red-400 text-sm">{walletState.error}</p>
              <button 
                onClick={() => setWalletState(prev => ({ ...prev, error: undefined }))}
                className="text-red-300 hover:text-red-200 text-xs mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
