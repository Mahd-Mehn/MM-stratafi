import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Users, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'
import { poolsData } from '../../lib/poolsData'

interface AnalyticsData {
  totalTVL: number
  totalInvestors: number
  averageAPY: number
  totalTransactions: number
  volume24h: number
  volume7d: number
  newInvestors7d: number
  topPerformingPools: Array<{
    id: number
    name: string
    performance: number
    investors: number
  }>
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const totalTVL = poolsData.reduce((sum, pool) => sum + pool.totalValue, 0)
      const totalInvestors = 1247
      const averageAPY = poolsData.reduce((sum, pool) => sum + (pool.apy.senior + pool.apy.mezzanine + pool.apy.junior) / 3, 0) / poolsData.length

      setAnalytics({
        totalTVL,
        totalInvestors,
        averageAPY,
        totalTransactions: 15420,
        volume24h: 234000,
        volume7d: 1450000,
        newInvestors7d: 89,
        topPerformingPools: [
          { id: 1, name: 'Invoice Financing Pool #1', performance: 12.5, investors: 145 },
          { id: 5, name: 'Trade Finance Facility #2', performance: 11.8, investors: 123 },
          { id: 4, name: 'Equipment Leasing Pool', performance: 9.7, investors: 98 },
        ],
        riskDistribution: {
          low: 45,
          medium: 35,
          high: 20
        }
      })
      setLoading(false)
    }, 1000)
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
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-gray-400 mt-1">Comprehensive protocol performance and user insights</p>
            </div>
          </div>

          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`
                  px-3 py-1 rounded-lg text-sm transition
                  ${selectedPeriod === period
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }
                `}
              >
                {period}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Value Locked</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              ${(analytics?.totalTVL! / 1000000).toFixed(2)}M
            </p>
            <p className="text-sm text-green-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Investors</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{analytics?.totalInvestors.toLocaleString()}</p>
            <p className="text-sm text-blue-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{analytics?.newInvestors7d} this week
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Average APY</span>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{analytics?.averageAPY.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-1">Across all tranches</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">24h Volume</span>
              <Activity className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              ${(analytics?.volume24h! / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-yellow-400 mt-1">7d: ${(analytics?.volume7d! / 1000000).toFixed(1)}M</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              Risk Distribution
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-white">Low Risk (Senior)</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{analytics?.riskDistribution.low}%</p>
                  <p className="text-gray-400 text-sm">45 pools</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-white">Medium Risk (Mezzanine)</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{analytics?.riskDistribution.medium}%</p>
                  <p className="text-gray-400 text-sm">35 pools</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-white">High Risk (Junior)</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{analytics?.riskDistribution.high}%</p>
                  <p className="text-gray-400 text-sm">20 pools</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Performing Pools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Top Performing Pools
            </h2>

            <div className="space-y-3">
              {analytics?.topPerformingPools.map((pool, index) => (
                <div key={pool.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-semibold">{pool.name}</p>
                    <p className="text-gray-400 text-sm">{pool.investors} investors</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">+{pool.performance}%</p>
                    <p className="text-gray-400 text-sm">Performance</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Transaction Volume Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Transaction Volume ({selectedPeriod})
          </h2>

          <div className="h-64 flex items-center justify-center bg-gray-800/30 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Interactive chart would go here</p>
              <p className="text-gray-500 text-sm">Volume: ${(analytics?.volume24h! / 1000).toFixed(0)}K in last 24h</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
