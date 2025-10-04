import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Shield, AlertTriangle, ArrowRight, Plus, Search, Clock } from 'lucide-react'
import Link from 'next/link'
import { getPoolById, Pool, fetchPoolsFromDB } from '../../lib/poolsData'

export default function Pools() {
  const router = useRouter()
  const [pools, setPools] = useState<Pool[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch pools from shared data
    fetchPools()
  }, [])

  const fetchPools = async () => {
    setLoading(true)
    try {
      // Fetch pools from database
      const dbPools = await fetchPoolsFromDB()
      setPools(dbPools)
    } catch (error) {
      console.error('Error fetching pools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.assetType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || pool.assetType === filterType
    return matchesSearch && matchesFilter
  })

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/10'
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">RWA Pools</h1>
              <p className="text-gray-400">Explore and invest in tokenized real-world asset pools</p>
            </div>
            <Link
              href="/create-pool"
              className="flex items-center gap-2 px-6 py-3 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Pool
            </Link>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">All Asset Types</option>
            <option value="Invoice Financing">Invoice Financing</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Supply Chain">Supply Chain</option>
            <option value="Equipment">Equipment</option>
            <option value="Trade Finance">Trade Finance</option>
          </select>
        </motion.div>

        {/* Pool Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="h-32 bg-gray-700/50 rounded mb-4" />
                <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-700/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map((pool, index) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card hover:scale-105 transition-transform cursor-pointer"
                onClick={() => router.push(`/pools/${pool.id}`)}
              >
                {/* Pool Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pool.name}</h3>
                    <p className="text-sm text-gray-400">{pool.assetType}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getHealthColor(pool.healthScore)}`}>
                    {pool.healthScore}
                  </div>
                </div>

                {/* Pool Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Value
                    </span>
                    <span className="text-white font-semibold">
                      ${(pool.totalValue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Maturity
                    </span>
                    <span className="text-white">{pool.maturity}</span>
                  </div>
                </div>

                {/* APY Display */}
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-xs text-gray-400 mb-2">APY by Tranche</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-green-400 font-semibold">{pool.apy.senior}%</p>
                      <p className="text-xs text-gray-500">Senior</p>
                    </div>
                    <div>
                      <p className="text-yellow-400 font-semibold">{pool.apy.mezzanine}%</p>
                      <p className="text-xs text-gray-500">Mezz</p>
                    </div>
                    <div>
                      <p className="text-purple-400 font-semibold">{pool.apy.junior}%</p>
                      <p className="text-xs text-gray-500">Junior</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    pool.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {pool.status.toUpperCase()}
                  </span>
                  <button className="text-primary-400 text-sm hover:text-primary-300 transition">
                    View Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg mb-4">No pools found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
