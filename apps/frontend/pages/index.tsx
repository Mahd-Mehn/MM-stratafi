import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, Globe, TrendingUp, BarChart3, Layers, Brain } from 'lucide-react'
import { HealthScoreGauge, WaterfallVisualizer, TrancheSelector } from '../components/UIComponents'

export default function Home() {
  const [tvl, setTvl] = useState(0)
  const [activeVaults, setActiveVaults] = useState(0)

  useEffect(() => {
    // Animate TVL counter
    const tvlTarget = 5234567
    const interval = setInterval(() => {
      setTvl((prev) => {
        const increment = Math.ceil((tvlTarget - prev) / 10)
        return prev + increment >= tvlTarget ? tvlTarget : prev + increment
      })
    }, 50)
    
    // Animate vault counter
    setTimeout(() => setActiveVaults(7), 500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Institutional-Grade
                <span className="gradient-text"> Structured Credit</span> on{' '}
                <span className="text-primary-400">Aptos</span>
              </h1>
              <p className="text-xl text-gray-300">
                Tokenize real-world assets, tranche risk, and stream yields atomically—powered by Move & Helios AI.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/pools" className="btn-primary flex items-center space-x-2">
                  <span>Explore Pools</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/stratafi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View Docs
                </a>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="stat-card">
                  <p className="text-3xl font-bold gradient-text">
                    ${(tvl / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-gray-400 text-sm">TVL (Testnet)</p>
                </div>
                <div className="stat-card">
                  <p className="text-3xl font-bold text-white">{activeVaults}</p>
                  <p className="text-gray-400 text-sm">Active Vaults</p>
                </div>
                <div className="stat-card">
                  <p className="text-3xl font-bold text-white">3</p>
                  <p className="text-gray-400 text-sm">Risk Tranches</p>
                </div>
              </div>
            </motion.div>

            {/* Visual Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-8 space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Live Risk Assessment</h3>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Helios AI Active
                </span>
              </div>
              <HealthScoreGauge score={72} />
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Payment Waterfall Distribution</p>
                <WaterfallVisualizer 
                  seniorPaid={3000000} 
                  seniorTarget={3000000} 
                  mezzPaid={1200000} 
                  mezzTarget={1500000} 
                  juniorPaid={300000} 
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Why StrataFi Wins</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built specifically for Aptos to leverage Move's safety and parallel execution capabilities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="tranche-card group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Atomic Waterfall</h3>
              <p className="text-gray-400">
                All tranche distributions settle in a single Move transaction—eliminating leg risk common on EVM chains.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="tranche-card group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Risk Oracle</h3>
              <p className="text-gray-400">
                Helios continuously models vault health using both on-chain signals via Nodit and off-chain credit data.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="tranche-card group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Composability First</h3>
              <p className="text-gray-400">
                Tranche tokens designed for DEX liquidity on Hyperion & Tapp.Exchange with instant secondary markets.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tranche Preview */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Risk Profile</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Invest in different tranches based on your risk appetite and yield requirements
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Senior Tranche</h3>
              <p className="text-gray-400 mb-4">Low risk, stable yields</p>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-white font-semibold">6-8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className="text-green-400 font-semibold">LOW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <span className="text-white font-semibold">First</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card text-center border-2 border-primary-500/30"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Mezzanine</h3>
              <p className="text-gray-400 mb-4">Balanced risk-reward</p>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-white font-semibold">10-15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className="text-yellow-400 font-semibold">MEDIUM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <span className="text-white font-semibold">Second</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Junior Tranche</h3>
              <p className="text-gray-400 mb-4">High risk, high yield</p>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-white font-semibold">20-30%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className="text-purple-400 font-semibold">HIGH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <span className="text-white font-semibold">Last</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-12 bg-gradient-to-r from-primary-500/10 to-secondary-500/10"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet and explore structured credit opportunities on Aptos
            </p>
            <Link href="/pools" className="btn-primary text-lg px-8 py-4">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
