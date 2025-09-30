import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Shield, AlertTriangle } from 'lucide-react'

interface HealthScoreGaugeProps {
  score: number
}

export function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  const getColor = () => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getStatus = () => {
    if (score >= 80) return 'Healthy'
    if (score >= 60) return 'Moderate'
    return 'At Risk'
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-700"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={552}
            strokeDashoffset={552 - (552 * score) / 100}
            className={getColor()}
            initial={{ strokeDashoffset: 552 }}
            animate={{ strokeDashoffset: 552 - (552 * score) / 100 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${getColor()}`}>{score}</span>
          <span className="text-gray-400 text-sm mt-1">{getStatus()}</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-white font-semibold">Portfolio Health Score</p>
        <p className="text-gray-400 text-xs mt-1">Powered by Helios AI</p>
      </div>
    </div>
  )
}

interface WaterfallVisualizerProps {
  seniorPaid: number
  seniorTarget: number
  mezzPaid: number
  mezzTarget: number
  juniorPaid: number
}

export function WaterfallVisualizer({
  seniorPaid,
  seniorTarget,
  mezzPaid,
  mezzTarget,
  juniorPaid
}: WaterfallVisualizerProps) {
  const formatAmount = (amount: number) => {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  
  const seniorPercent = seniorTarget > 0 ? (seniorPaid / seniorTarget) * 100 : 0
  const mezzPercent = mezzTarget > 0 ? (mezzPaid / mezzTarget) * 100 : 0
  
  return (
    <div className="space-y-4">
      {/* Senior Tranche */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            Senior Tranche
          </span>
          <span className="text-white">{formatAmount(seniorPaid)} / {formatAmount(seniorTarget)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${seniorPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>
      
      {/* Mezzanine Tranche */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            Mezzanine
          </span>
          <span className="text-white">{formatAmount(mezzPaid)} / {formatAmount(mezzTarget)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${mezzPercent}%` }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </div>
      </div>
      
      {/* Junior Tranche */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400" />
            Junior
          </span>
          <span className="text-white">{formatAmount(juniorPaid)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-purple-400 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: juniorPaid > 0 ? '30%' : '0%' }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
        </div>
      </div>
    </div>
  )
}

interface TrancheSelectorProps {
  value?: string
  onChange?: (tranche: string) => void
}

export function TrancheSelector({ value = 'Senior', onChange }: TrancheSelectorProps) {
  const tranches = [
    { name: 'Senior', risk: 'LOW', apy: '6-8%', color: 'green' },
    { name: 'Mezzanine', risk: 'MEDIUM', apy: '10-15%', color: 'yellow' },
    { name: 'Junior', risk: 'HIGH', apy: '20-30%', color: 'purple' }
  ]
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {tranches.map((tranche) => (
        <motion.button
          key={tranche.name}
          onClick={() => onChange?.(tranche.name)}
          className={`p-4 rounded-xl border-2 transition-all ${
            value === tranche.name
              ? `border-${tranche.color}-400 bg-${tranche.color}-500/10`
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-left">
            <p className="font-semibold text-white">{tranche.name}</p>
            <p className={`text-xs text-${tranche.color}-400 mt-1`}>{tranche.risk} RISK</p>
            <p className="text-sm text-gray-400 mt-2">APY: {tranche.apy}</p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
