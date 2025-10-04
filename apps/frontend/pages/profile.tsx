import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Wallet, TrendingUp, Shield, Copy, ExternalLink, Edit3 } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

export default function Profile() {
  const { success, error } = useNotifications()
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [userStats, setUserStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    poolsCreated: 0,
    totalReturns: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      if (window.aptos) {
        const isConnected = await window.aptos.isConnected()
        if (isConnected) {
          const account = await window.aptos.account()
          setWalletConnected(true)
          setWalletAddress(account.address)
          await loadUserStats(account.address)
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async (address: string) => {
    try {
      // Load user's investment stats
      const investmentsResponse = await fetch(`/api/investments/by-investor/${address}`)
      if (investmentsResponse.ok) {
        const investments = await investmentsResponse.json()
        const totalInvested = investments.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0)
        
        setUserStats(prev => ({
          ...prev,
          totalInvested,
          activeInvestments: investments.length
        }))
      }

      // Load user's created pools
      const poolsResponse = await fetch(`/api/pools/by-creator/${address}`)
      if (poolsResponse.ok) {
        const pools = await poolsResponse.json()
        setUserStats(prev => ({
          ...prev,
          poolsCreated: pools.length
        }))
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    success('Address Copied', 'Wallet address copied to clipboard')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!walletConnected) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12"
          >
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to view your profile and investment history.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account and view your investment activity</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Wallet Profile</h2>
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-gray-700 rounded transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-700 rounded transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white font-medium">Aptos Testnet</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white font-medium">Today</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats & Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Total Invested</h3>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">${userStats.totalInvested.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mt-1">Across all pools</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Active Investments</h3>
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">{userStats.activeInvestments}</p>
                <p className="text-gray-400 text-sm mt-1">Current positions</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Pools Created</h3>
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white">{userStats.poolsCreated}</p>
                <p className="text-gray-400 text-sm mt-1">Your own pools</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Total Returns</h3>
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-3xl font-bold text-white">${userStats.totalReturns.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mt-1">Lifetime earnings</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                <button className="text-primary-400 hover:text-primary-300 transition text-sm">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {userStats.activeInvestments > 0 ? (
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Investment Activity</p>
                        <p className="text-gray-400 text-sm">You have {userStats.activeInvestments} active investments</p>
                      </div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                    <p className="text-gray-500 text-sm">Start investing to see your activity here</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
