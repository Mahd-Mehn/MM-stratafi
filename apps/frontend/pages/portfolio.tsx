import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Shield, AlertTriangle, Clock, BarChart3, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { useRouter } from 'next/router'
import { HealthScoreGauge, WaterfallVisualizer } from '../components/UIComponents'
import { poolsData } from '../lib/poolsData'

interface Investment {
  poolId: number
  poolName: string
  tranche: 'Senior' | 'Mezzanine' | 'Junior'
  amount: number
  investedDate: string
  currentValue: number
  unrealizedGain: number
  apy: number
  maturityDate: string
  healthScore: number
}

interface PortfolioStats {
  totalInvested: number
  currentValue: number
  totalReturns: number
  avgAPY: number
  activePositions: number
  riskScore: number
}

export default function Portfolio() {
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    avgAPY: 0,
    activePositions: 0,
    riskScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [aiHealthScore, setAiHealthScore] = useState(0)

  useEffect(() => {
    fetchPortfolioData()
    fetchAIHealthScore()
  }, [])

  const fetchPortfolioData = async () => {
    setLoading(true)
    try {
      // Check if wallet is connected
      if (!window.aptos) {
        setLoading(false)
        return
      }

      const isConnected = await window.aptos.isConnected()
      if (!isConnected) {
        setLoading(false)
        return
      }

      const account = await window.aptos.account()
      
      // Fetch user's actual investments
      const investmentsResponse = await fetch(`/api/investments/by-investor/${account.address}`)
      let userInvestments: Investment[] = []
      
      if (investmentsResponse.ok) {
        const investmentData = await investmentsResponse.json()
        
        // Transform API data to Investment format
        userInvestments = await Promise.all(investmentData.map(async (inv: any) => {
          // Get pool details
          const poolResponse = await fetch(`/api/pools/${inv.poolId}`)
          const poolData = poolResponse.ok ? await poolResponse.json() : null
          
          const trancheNames = ['Senior', 'Mezzanine', 'Junior']
          const trancheName = trancheNames[inv.tranche] || 'Senior'
          
          // Calculate current value (mock appreciation for demo)
          const daysInvested = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          const dailyReturn = poolData ? (poolData[`${trancheName.toLowerCase()}Apy`] / 365 / 100) : 0.0002
          const currentValue = parseFloat(inv.amount) * (1 + dailyReturn * Math.max(1, daysInvested))
          const unrealizedGain = currentValue - parseFloat(inv.amount)
          
          return {
            poolId: inv.poolId,
            poolName: poolData?.name || `Pool #${inv.poolId}`,
            tranche: trancheName as 'Senior' | 'Mezzanine' | 'Junior',
            amount: parseFloat(inv.amount),
            investedDate: inv.createdAt.split('T')[0],
            currentValue: Math.round(currentValue * 100) / 100,
            unrealizedGain: Math.round(unrealizedGain * 100) / 100,
            apy: poolData ? poolData[`${trancheName.toLowerCase()}Apy`] : 8.5,
            maturityDate: poolData?.maturity || '2024-12-31',
            healthScore: Math.floor(Math.random() * 20) + 75 // Mock health score
          }
        }))
      }

      // If no real investments, show mock data for demo
      if (userInvestments.length === 0) {
        userInvestments = [
          {
            poolId: 1,
            poolName: 'Invoice Financing Pool',
            tranche: 'Senior',
            amount: 50000,
            investedDate: '2024-01-15',
            currentValue: 52100,
            unrealizedGain: 2100,
            apy: 7,
            maturityDate: '2024-04-15',
            healthScore: 85
          },
          {
            poolId: 2,
            poolName: 'Real Estate Bridge Loans',
            tranche: 'Mezzanine',
            amount: 30000,
            investedDate: '2024-01-20',
            currentValue: 32400,
            unrealizedGain: 2400,
            apy: 14,
            maturityDate: '2024-07-20',
            healthScore: 72
          }
        ]
      }

      setInvestments(userInvestments)
      
      // Calculate portfolio stats
      const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0)
      const currentValue = userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0)
      const totalReturns = currentValue - totalInvested
      const avgAPY = userInvestments.length > 0 
        ? userInvestments.reduce((sum, inv) => sum + inv.apy, 0) / userInvestments.length 
        : 0
      const avgHealthScore = userInvestments.length > 0
        ? userInvestments.reduce((sum, inv) => sum + inv.healthScore, 0) / userInvestments.length
        : 0

      setStats({
        totalInvested,
        currentValue,
        totalReturns,
        avgAPY,
        activePositions: userInvestments.length,
        riskScore: Math.max(0, 100 - avgHealthScore)
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
      // Fallback to mock data
      const mockInvestments: Investment[] = [
        {
          poolId: 1,
          poolName: 'Invoice Financing Pool',
          tranche: 'Senior',
          amount: 50000,
          investedDate: '2024-01-15',
          currentValue: 52100,
          unrealizedGain: 2100,
          apy: 7,
          maturityDate: '2024-04-15',
          healthScore: 85
        }
      ]
      
      setInvestments(mockInvestments)
      setStats({
        totalInvested: 50000,
        currentValue: 52100,
        totalReturns: 2100,
        avgAPY: 7,
        activePositions: 1,
        riskScore: 15
      })
      setLoading(false)
    }
  }

  const fetchAIHealthScore = async () => {
    try {
      // Call Helios AI agent API
      const response = await fetch('http://localhost:8000/api/v1/vaults/1/health')
      const data = await response.json()
      setAiHealthScore(data.score || 72)
    } catch (error) {
      // Fallback score if API is not available
      setAiHealthScore(72)
    }
  }

  const getTrancheColor = (tranche: string) => {
    switch(tranche) {
      case 'Senior': return 'text-green-400 bg-green-400/10'
      case 'Mezzanine': return 'text-yellow-400 bg-yellow-400/10'
      case 'Junior': return 'text-purple-400 bg-purple-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your portfolio...</p>
            </div>
          </div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Your Portfolio</h1>
          <p className="text-gray-400">Track your investments and monitor performance</p>
        </motion.div>

        {/* Portfolio Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Invested</span>
              <DollarSign className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.activePositions} active positions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Current Value</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.currentValue)}</p>
            <p className="text-sm text-green-400 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {formatPercentage((stats.totalReturns / stats.totalInvested) * 100)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Returns</span>
              <BarChart3 className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalReturns)}</p>
            <p className="text-sm text-gray-500 mt-1">Avg APY: {stats.avgAPY.toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">AI Risk Score</span>
              <Activity className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-2xl font-bold gradient-text">{aiHealthScore}</p>
            <p className="text-sm text-gray-500 mt-1">Powered by Helios AI</p>
          </motion.div>
        </div>

        {/* Risk Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Risk Distribution</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <HealthScoreGauge score={stats.riskScore} />
              <p className="text-sm text-gray-400 mt-2">Portfolio Health</p>
            </div>
            
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Tranche Distribution</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {['Senior', 'Mezzanine', 'Junior'].map(tranche => {
                      const count = investments.filter(inv => inv.tranche === tranche).length
                      const percentage = (count / investments.length) * 100
                      return (
                        <div key={tranche} className="text-center">
                          <div className={`p-3 rounded-lg ${getTrancheColor(tranche)}`}>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs mt-1">{tranche}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">{percentage.toFixed(0)}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Expected Cashflows</p>
                  <WaterfallVisualizer
                    seniorPaid={investments.filter(i => i.tranche === 'Senior').reduce((sum, i) => sum + i.currentValue, 0)}
                    seniorTarget={investments.filter(i => i.tranche === 'Senior').reduce((sum, i) => sum + i.amount, 0) * 1.07}
                    mezzPaid={investments.filter(i => i.tranche === 'Mezzanine').reduce((sum, i) => sum + i.currentValue, 0)}
                    mezzTarget={investments.filter(i => i.tranche === 'Mezzanine').reduce((sum, i) => sum + i.amount, 0) * 1.14}
                    juniorPaid={investments.filter(i => i.tranche === 'Junior').reduce((sum, i) => sum + i.currentValue, 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Active Positions</h2>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">{investments.length} positions</span>
              <button
                onClick={() => router.push('/pools')}
                className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition text-sm"
              >
                + Add Position
              </button>
            </div>
          </div>

          {investments.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Positions</h3>
              <p className="text-gray-400 mb-6">
                Start investing in RWA pools to see your positions here
              </p>
              <button
                onClick={() => router.push('/pools')}
                className="btn-primary"
              >
                Browse Pools
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Pool</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Tranche</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm">Invested</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm">Current Value</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm">Gain/Loss</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm">APY</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm">Maturity</th>
                    <th className="text-center py-3 px-4 text-gray-400 text-sm">Health</th>
                    <th className="text-center py-3 px-4 text-gray-400 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{investment.poolId}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{investment.poolName}</p>
                            <p className="text-gray-500 text-xs">Invested {investment.investedDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTrancheColor(investment.tranche)}`}>
                          {investment.tranche}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {formatCurrency(investment.amount)}
                      </td>
                      <td className="py-4 px-4 text-right text-white font-semibold">
                        {formatCurrency(investment.currentValue)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-right">
                          <span className={`flex items-center justify-end ${investment.unrealizedGain > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {investment.unrealizedGain > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {formatCurrency(Math.abs(investment.unrealizedGain))}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatPercentage((investment.unrealizedGain / investment.amount) * 100)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-white font-semibold">{investment.apy}%</span>
                        <p className="text-gray-500 text-xs">Annual</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-white">{investment.maturityDate}</p>
                        <p className="text-gray-500 text-xs">
                          {Math.max(0, Math.ceil((new Date(investment.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          investment.healthScore >= 80 ? 'text-green-400 bg-green-400/10' :
                          investment.healthScore >= 60 ? 'text-yellow-400 bg-yellow-400/10' :
                          'text-red-400 bg-red-400/10'
                        }`}>
                          {investment.healthScore}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => router.push(`/pools/${investment.poolId}`)}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition text-xs"
                        >
                          View Pool
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
