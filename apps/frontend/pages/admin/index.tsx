import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit3, Trash2, Eye, TrendingUp, Users, DollarSign, Activity, Settings, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { poolsData, fetchPoolsFromDB } from '../../lib/poolsData'
import { useNotifications } from '../../context/NotificationContext'

interface AdminStats {
  totalPools: number
  totalValue: number
  totalInvestors: number
  avgHealthScore: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { success, error, warning } = useNotifications()
  const [pools, setPools] = useState(poolsData)
  const [stats, setStats] = useState<AdminStats>({
    totalPools: 0,
    totalValue: 0,
    totalInvestors: 0,
    avgHealthScore: 0
  })
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check admin authentication (simplified for demo)
    checkAdminAuth()
    loadPools()
  }, [])

  const loadPools = async () => {
    try {
      const dbPools = await fetchPoolsFromDB()
      setPools(dbPools)
      calculateStats(dbPools)
    } catch (error) {
      console.error('Error loading pools:', error)
      // Fallback to static data
      setPools(poolsData)
      calculateStats(poolsData)
    }
  }

  const checkAdminAuth = () => {
    // In production, check wallet address against admin list
    const adminAddresses = [
      '0x1234...admin', // Replace with actual admin addresses
    ]
    
    // For demo, we'll allow access
    setIsAdmin(true)
  }

  const calculateStats = (poolList = pools) => {
    if (poolList.length === 0) return
    
    const totalValue = poolList.reduce((sum, pool) => sum + pool.totalValue, 0)
    const avgHealth = poolList.reduce((sum, pool) => sum + pool.healthScore, 0) / poolList.length
    
    setStats({
      totalPools: poolList.length,
      totalValue,
      totalInvestors: 243, // Mock data
      avgHealthScore: avgHealth
    })
  }

  const handleDeletePool = (poolId: number) => {
    warning('Delete Pool', `Are you sure you want to delete pool #${poolId}?`, {
      action: {
        label: 'Confirm Delete',
        onClick: () => {
          setPools(pools.filter(p => p.id !== poolId))
          success('Pool Deleted', `Pool #${poolId} has been removed`)
        }
      }
    })
  }

  const handlePausePool = (poolId: number) => {
    success('Pool Paused', `Pool #${poolId} has been paused for new investments`)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You need admin privileges to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage pools and monitor protocol health</p>
            </div>
            <Link
              href="/admin/create-pool"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition"
            >
              <Plus className="w-5 h-5" />
              Create Pool
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Pools</span>
              <Activity className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPools}</p>
            <p className="text-sm text-green-400 mt-1">+2 this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Value Locked</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              ${(stats.totalValue / 1000000).toFixed(2)}M
            </p>
            <p className="text-sm text-green-400 mt-1">↑ 12.5%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Investors</span>
              <Users className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalInvestors}</p>
            <p className="text-sm text-green-400 mt-1">+47 new</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Avg Health Score</span>
              <TrendingUp className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold gradient-text">{stats.avgHealthScore.toFixed(0)}</p>
            <p className="text-sm text-gray-400 mt-1">Healthy</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/admin/pools/create"
              className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition text-center"
            >
              <Plus className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Create Pool</p>
            </Link>
            
            <Link
              href="/admin/vault-manager"
              className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition text-center"
            >
              <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Vault Manager</p>
            </Link>
            
            <button
              onClick={() => router.push('/admin/settings')}
              className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition text-center"
            >
              <Settings className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Settings</p>
            </button>
            
            <button
              onClick={() => router.push('/admin/analytics')}
              className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition text-center"
            >
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Analytics</p>
            </button>
          </div>
        </motion.div>

        {/* Pools Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Pool Management</h2>
            <button className="text-sm text-primary-400 hover:text-primary-300">
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 text-sm">Pool Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm">Type</th>
                  <th className="text-right py-3 px-4 text-gray-400 text-sm">Total Value</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Health</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Status</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool, index) => (
                  <motion.tr
                    key={pool.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{pool.name}</p>
                      <p className="text-gray-500 text-xs">ID: {pool.id}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{pool.assetType}</td>
                    <td className="py-4 px-4 text-right text-white">
                      ${(pool.totalValue / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pool.healthScore >= 80 ? 'text-green-400 bg-green-400/10' :
                        pool.healthScore >= 60 ? 'text-yellow-400 bg-yellow-400/10' :
                        'text-red-400 bg-red-400/10'
                      }`}>
                        {pool.healthScore}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        pool.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {pool.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => router.push(`/pools/${pool.id}`)}
                          className="p-1 text-gray-400 hover:text-white transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/edit-pool/${pool.id}`)}
                          className="p-1 text-gray-400 hover:text-primary-400 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePausePool(pool.id)}
                          className="p-1 text-gray-400 hover:text-yellow-400 transition"
                          title="Pause"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePool(pool.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
