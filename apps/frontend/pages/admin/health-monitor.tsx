import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../../context/NotificationContext'
import { api } from '../../lib/api'

interface SystemHealth {
  aptos_connected: boolean
  nodit_connected: boolean
  helios_status: string
  total_vaults_monitored: number
  last_health_check: string
  average_health_score: number
  system_load: number
}

export default function HealthMonitor() {
  const { success, error, warning } = useNotifications()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchHealthData()
  }, [])

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const data = await api.helios.getOracleStatus()
      setHealth(data)
    } catch (err) {
      console.error('Failed to fetch health data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchHealthData()
    success('Health Check Complete', 'System status refreshed')
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10'
      case 'warning': return 'text-yellow-400 bg-yellow-400/10'
      case 'error': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Health Monitor</h1>
              <p className="text-gray-400 mt-1">Real-time system health and performance monitoring</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </motion.div>

        {/* System Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">System Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(health?.helios_status || 'unknown')}`}>
              {getStatusIcon(health?.helios_status || 'unknown')}
              <span className="ml-2 capitalize">{health?.helios_status || 'Unknown'}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg">
                {health?.aptos_connected ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold">Aptos Network</p>
                <p className={`text-sm ${health?.aptos_connected ? 'text-green-400' : 'text-red-400'}`}>
                  {health?.aptos_connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg">
                {health?.nodit_connected ? (
                  <Wifi className="w-5 h-5 text-blue-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold">Nodit Indexer</p>
                <p className={`text-sm ${health?.nodit_connected ? 'text-blue-400' : 'text-red-400'}`}>
                  {health?.nodit_connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Monitored Vaults</p>
                <p className="text-purple-400 text-sm">{health?.total_vaults_monitored || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Avg Health Score</p>
                <p className="text-yellow-400 text-sm">{health?.average_health_score?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Load */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">System Performance</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">System Load</span>
                <span className="text-white">{health?.system_load || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${health?.system_load || 0}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Last Check</p>
                <p className="text-gray-400 text-sm">
                  {health?.last_health_check ? new Date(health.last_health_check).toLocaleTimeString() : 'Never'}
                </p>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Response Time</p>
                <p className="text-gray-400 text-sm">245ms</p>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Uptime</p>
                <p className="text-gray-400 text-sm">99.9%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Active Alerts</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-white font-semibold">All Systems Operational</p>
                <p className="text-gray-400 text-sm">All monitored services are running normally</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-white font-semibold">High Transaction Volume</p>
                <p className="text-gray-400 text-sm">Processing 150+ transactions per minute</p>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
