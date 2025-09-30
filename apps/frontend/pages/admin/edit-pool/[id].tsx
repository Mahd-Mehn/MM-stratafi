import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, AlertCircle, DollarSign, TrendingUp, Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { getPoolById, Pool } from '../../../lib/poolsData'
import { useNotifications } from '../../../context/NotificationContext'
import { useAptosTx } from '../../../lib/aptosTx'

export default function EditPool() {
  const router = useRouter()
  const { id } = router.query
  const { success, error, loading } = useNotifications()
  const { callCreateVault, callAddRwa, callAddRwas, callMintTranches } = useAptosTx()

  const [pool, setPool] = useState<Pool | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingPool, setLoadingPool] = useState(true)
  const [txBusy, setTxBusy] = useState(false)

  // On-chain action state
  const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0] || '0', 10) : 0
  const [vaultId, setVaultId] = useState<number>(numericId || 0)
  const [seniorSupply, setSeniorSupply] = useState<number>(0)
  const [mezzSupply, setMezzSupply] = useState<number>(0)
  const [juniorSupply, setJuniorSupply] = useState<number>(0)

  const [rwaId, setRwaId] = useState<number>(0)
  const [rwaValue, setRwaValue] = useState<number>(0)
  const [rwaAssetType, setRwaAssetType] = useState<string>('Invoice Financing')
  const [rwaOriginator, setRwaOriginator] = useState<string>('0x')

  const [batchIds, setBatchIds] = useState<string>('')
  const [batchValues, setBatchValues] = useState<string>('')
  const [batchAssetTypes, setBatchAssetTypes] = useState<string>('')
  const [batchOriginators, setBatchOriginators] = useState<string>('')

  useEffect(() => {
    if (id) {
      fetchPoolData()
    }
  }, [id])

  const fetchPoolData = async () => {
    setLoadingPool(true)
    const poolData = getPoolById(Number(id))
    if (poolData) {
      setPool(poolData)
      setFormData({
        name: poolData.name,
        assetType: poolData.assetType,
        description: poolData.description,
        maturity: poolData.maturity.replace(' days', ''),
        seniorAPY: poolData.apy.senior,
        mezzanineAPY: poolData.apy.mezzanine,
        juniorAPY: poolData.apy.junior,
      })
      setVaultId(numericId || 0)
    }
    setLoadingPool(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    const loadingId = loading('Updating Pool', 'Submitting changes to blockchain...')

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      success('Pool Updated', `${formData.name} has been updated successfully`)
      setTimeout(() => router.push('/admin'), 1500)
    } catch (err) {
      error('Update Failed', 'Could not update pool. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  // On-chain handlers
  const onCreateVault = async () => {
    setTxBusy(true)
    try {
      const tx = await callCreateVault(vaultId)
      success('Vault Created', `TX submitted: ${tx.hash ?? ''}`)
    } catch (e: any) {
      error('Create Vault Failed', e?.message ?? 'Unknown error')
    } finally {
      setTxBusy(false)
    }
  }

  const onAddRwa = async () => {
    setTxBusy(true)
    try {
      const tx = await callAddRwa(vaultId, rwaId, rwaValue, rwaAssetType, rwaOriginator)
      success('RWA Added', `TX submitted: ${tx.hash ?? ''}`)
    } catch (e: any) {
      error('Add RWA Failed', e?.message ?? 'Unknown error')
    } finally {
      setTxBusy(false)
    }
  }

  const onAddRwas = async () => {
    setTxBusy(true)
    try {
      const ids = batchIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
      const values = batchValues.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
      const types = batchAssetTypes.split(',').map(s => s.trim()).filter(Boolean)
      const origins = batchOriginators.split(',').map(s => s.trim()).filter(Boolean)
      if (!(ids.length && ids.length === values.length && values.length === types.length && types.length === origins.length)) {
        error('Batch Mismatch', 'All lists must be same length and non-empty')
        setTxBusy(false)
        return
      }
      const tx = await callAddRwas(vaultId, ids, values, types, origins)
      success('Batch Added', `TX submitted: ${tx.hash ?? ''}`)
    } catch (e: any) {
      error('Batch Add Failed', e?.message ?? 'Unknown error')
    } finally {
      setTxBusy(false)
    }
  }

  const onMintTranches = async () => {
    setTxBusy(true)
    try {
      const tx = await callMintTranches(vaultId, seniorSupply, mezzSupply, juniorSupply)
      success('Tranches Minted', `TX submitted: ${tx.hash ?? ''}`)
    } catch (e: any) {
      error('Mint Tranches Failed', e?.message ?? 'Unknown error')
    } finally {
      setTxBusy(false)
    }
  }

  if (loadingPool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Pool Not Found</h2>
          <p className="text-gray-400">The requested pool could not be found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/admin" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Pool</h1>
            <p className="text-gray-400 mt-1">Modify pool configuration and settings</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Pool Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Asset Type *</label>
                <select
                  value={formData.assetType}
                  onChange={(e) => handleInputChange('assetType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-400"
                  required
                >
                  <option value="">Select asset type...</option>
                  <option value="Invoice Financing">Invoice Financing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Trade Finance">Trade Finance</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm mb-2 block">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Maturity (days) *</label>
                <input
                  type="number"
                  value={formData.maturity}
                  onChange={(e) => handleInputChange('maturity', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* APY Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4">APY Configuration</h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Senior APY (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.seniorAPY}
                  onChange={(e) => handleInputChange('seniorAPY', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Mezzanine APY (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.mezzanineAPY}
                  onChange={(e) => handleInputChange('mezzanineAPY', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Junior APY (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.juniorAPY}
                  onChange={(e) => handleInputChange('juniorAPY', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </motion.div>

          {/* Pool Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Current Pool Statistics</h2>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <DollarSign className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">${(pool.totalValue / 1000000).toFixed(2)}M</p>
                <p className="text-sm text-gray-400">Total Value</p>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">243</p>
                <p className="text-sm text-gray-400">Investors</p>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{pool.healthScore}</p>
                <p className="text-sm text-gray-400">Health Score</p>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{pool.status.toUpperCase()}</p>
                <p className="text-sm text-gray-400">Status</p>
              </div>
            </div>
          </motion.div>

          {/* On-chain Actions injected above this block */}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4"
          >
            <Link
              href="/admin"
              className="px-6 py-3 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition
                ${isSubmitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90'
                }
              `}
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Updating Pool...' : 'Update Pool'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
