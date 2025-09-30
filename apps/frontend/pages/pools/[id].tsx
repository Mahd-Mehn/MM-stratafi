import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, TrendingUp, AlertTriangle, Clock, DollarSign, Users, FileText, BarChart3, Info } from 'lucide-react'
import Link from 'next/link'
import { HealthScoreGauge, WaterfallVisualizer, TrancheSelector } from '../../components/UIComponents'
import { getPoolById, Pool } from '../../lib/poolsData'
import { api } from '../../lib/api'
import { useAptosTx, isValidTxHash, waitForTransaction } from '../../lib/aptosTx'
import { useNotifications } from '../../context/NotificationContext'

export default function PoolDetail() {
  const router = useRouter()
  const { id } = router.query
  const { callInvest } = useAptosTx()
  const [pool, setPool] = useState<Pool | null>(null)
  const [selectedTranche, setSelectedTranche] = useState('Senior')
  const [investAmount, setInvestAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [investing, setInvesting] = useState(false)
  const [aiHealthScore, setAiHealthScore] = useState<number | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<boolean>(false)

  useEffect(() => {
    if (id) {
      fetchPoolData()
      fetchAIHealthScore()
    }
  }, [id])

  const fetchPoolData = async () => {
    setLoading(true)
    // Get pool data
    const poolData = getPoolById(Number(id))
    if (poolData) {
      setPool(poolData)
    }
    setLoading(false)
  }

  const fetchAIHealthScore = async () => {
    // Fetch real-time health score from Helios AI
    const healthData = await api.helios.getHealthScore(Number(id))
    setAiHealthScore(healthData.score)
  }

  const { success, error, loading: notifyLoading, dismiss } = useNotifications()

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      error('Invalid Amount', 'Please enter a valid investment amount')
      return
    }

    setInvesting(true)
    const loadingId = notifyLoading(
      'Processing Investment',
      `Submitting ${investAmount} USDC to ${selectedTranche} tranche...`
    )

    try {
      const vaultOwner = process.env.NEXT_PUBLIC_MODULE_ADDR as string
      if (!vaultOwner) {
        throw new Error('Module address not set (NEXT_PUBLIC_MODULE_ADDR)')
      }
      const vaultId = Number(id)
      const trancheMap: Record<string, number> = { Senior: 0, Mezzanine: 1, Junior: 2 }
      const tranche = trancheMap[selectedTranche] ?? 0
      const amount = Math.floor(parseFloat(investAmount))
      const tx = await callInvest(vaultOwner, vaultId, tranche, amount)
      
      dismiss(loadingId)
      success(
        'Investment Successful!',
        `Successfully invested ${investAmount} in ${selectedTranche} tranche`,
        {
          txHash: isValidTxHash(tx?.hash) ? tx!.hash : undefined,
          duration: 8000,
          action: {
            label: 'View Portfolio',
            onClick: () => router.push('/portfolio')
          }
        }
      )

      // Optional: wait for confirmation
      if (isValidTxHash(tx?.hash)) {
        const confirmId = notifyLoading('Confirming on-chain', 'Waiting for transaction confirmation...')
        try {
          const timeoutMs = parseInt(process.env.NEXT_PUBLIC_TX_CONFIRM_TIMEOUT_MS || '30000', 10)
          const intervalMs = parseInt(process.env.NEXT_PUBLIC_TX_CONFIRM_INTERVAL_MS || '1000', 10)
          await waitForTransaction(tx!.hash, { timeoutMs, intervalMs })
          dismiss(confirmId)
          success('Confirmed', 'Your transaction has been confirmed on-chain', {
            txHash: tx!.hash,
            duration: 6000,
          })
          setConfirmed(true)
        } catch (e) {
          dismiss(confirmId)
          // Silent, keep initial success
        }
      }
      
      if (isValidTxHash(tx?.hash)) {
        setLastTxHash(tx!.hash)
      } else {
        setLastTxHash(null)
      }

      // Persist to backend after confirmation if possible
      if (isValidTxHash(tx?.hash)) {
        try {
          await fetch('/api/transactions/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              poolId: Number(id),
              vaultId,
              tranche,
              amount,
              txHash: tx!.hash,
            }),
          })
        } catch (_) {
          // non-blocking
        }
      }

      setInvestAmount('')
    } catch (err) {
      dismiss(loadingId)
      const message = err instanceof Error ? err.message : 'Could not complete your investment. Please try again.'
      error('Transaction Failed', message, { duration: 6000 })
    } finally {
      setInvesting(false)
    }
  }

  const getTrancheColor = (tranche: string) => {
    switch(tranche) {
      case 'Senior': return 'green'
      case 'Mezzanine': return 'yellow'
      case 'Junior': return 'purple'
      default: return 'gray'
    }
  }

  const getTrancheIcon = (tranche: string) => {
    switch(tranche) {
      case 'Senior': return <Shield className="w-5 h-5" />
      case 'Mezzanine': return <TrendingUp className="w-5 h-5" />
      case 'Junior': return <AlertTriangle className="w-5 h-5" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Pool not found</p>
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
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/pools" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{pool.name}</h1>
            <p className="text-gray-400 mt-1">{pool.assetType} • {pool.maturity} maturity</p>
          </div>
          <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
            {pool.status.toUpperCase()}
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Pool Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Pool Overview</h2>
              <p className="text-gray-300 mb-6">{pool.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Value Locked
                    </span>
                    <span className="text-white font-semibold">
                      ${(pool.totalValue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Available Capital
                    </span>
                    <span className="text-white font-semibold">
                      ${(pool.availableCapital / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Maturity Period
                    </span>
                    <span className="text-white font-semibold">{pool.maturity}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <HealthScoreGauge score={aiHealthScore || pool.healthScore} />
                </div>
              </div>
            </motion.div>

            {/* Asset Composition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Asset Composition
              </h2>
              <div className="space-y-3">
                {pool.assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{asset.type}</p>
                      <p className="text-gray-400 text-sm">${(asset.value / 1000000).toFixed(2)}M</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      asset.rating === 'AAA' || asset.rating === 'AA' ? 'bg-green-500/20 text-green-400' :
                      asset.rating === 'A' || asset.rating === 'BBB' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {asset.rating}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waterfall Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Payment Waterfall
              </h2>
              <WaterfallVisualizer
                seniorPaid={pool.currentAllocations.senior}
                seniorTarget={pool.targetAllocations.senior}
                mezzPaid={pool.currentAllocations.mezzanine}
                mezzTarget={pool.targetAllocations.mezzanine}
                juniorPaid={pool.currentAllocations.junior}
              />
            </motion.div>
          </div>

          {/* Right Column - Investment Panel */}
          <div className="space-y-6">
            {/* APY Display */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Expected Returns</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-green-400">
                      <Shield className="w-4 h-4" />
                      Senior Tranche
                    </span>
                    <span className="text-white font-bold">{pool.apy.senior}% APY</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-yellow-400">
                      <TrendingUp className="w-4 h-4" />
                      Mezzanine
                    </span>
                    <span className="text-white font-bold">{pool.apy.mezzanine}% APY</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-purple-400">
                      <AlertTriangle className="w-4 h-4" />
                      Junior Tranche
                    </span>
                    <span className="text-white font-bold">{pool.apy.junior}% APY</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Investment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
            >
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Select Tranche</label>
                  <TrancheSelector value={selectedTranche} onChange={setSelectedTranche} />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Investment Amount (USDC)</label>
                  <input
                    type="number"
                    placeholder="Enter amount..."
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  />
                </div>

                {investAmount && (
                  <div className="p-3 bg-gray-800/30 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected APY:</span>
                      <span className={`text-${getTrancheColor(selectedTranche)}-400 font-semibold`}>
                        {selectedTranche === 'Senior' ? pool.apy.senior :
                         selectedTranche === 'Mezzanine' ? pool.apy.mezzanine : pool.apy.junior}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Return:</span>
                      <span className="text-white font-semibold">
                        ${(parseFloat(investAmount || '0') * (1 + (selectedTranche === 'Senior' ? pool.apy.senior :
                         selectedTranche === 'Mezzanine' ? pool.apy.mezzanine : pool.apy.junior) / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleInvest}
                  disabled={!investAmount || investing}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    !investAmount || investing
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {investing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Invest Now'
                  )}
                </button>

                {isValidTxHash(lastTxHash || undefined) && (
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${lastTxHash}?network=${(process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet').toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full inline-flex justify-center py-3 rounded-lg font-semibold transition ${confirmed ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                  >
                    {confirmed ? 'View on Explorer (Confirmed)' : 'View on Explorer'}
                  </a>
                )}

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="text-xs text-gray-300">
                    By investing, you agree to lock your funds for the {pool.maturity} maturity period. 
                    Returns are paid according to the waterfall distribution model.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
