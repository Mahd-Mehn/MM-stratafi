import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Shield, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useNotifications } from '../../context/NotificationContext'

interface Asset {
  type: string
  value: number
  rating: string
}

interface PoolFormData {
  name: string
  assetType: string
  description: string
  maturity: string
  seniorAPY: number
  mezzanineAPY: number
  juniorAPY: number
  seniorTarget: number
  mezzanineTarget: number
  juniorTarget: number
  assets: Asset[]
}

export default function CreatePool() {
  const router = useRouter()
  const { success, error, loading, dismiss } = useNotifications()
  
  const [formData, setFormData] = useState<PoolFormData>({
    name: '',
    assetType: '',
    description: '',
    maturity: '90',
    seniorAPY: 7,
    mezzanineAPY: 12,
    juniorAPY: 25,
    seniorTarget: 0,
    mezzanineTarget: 0,
    juniorTarget: 0,
    assets: [{ type: '', value: 0, rating: 'A' }]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const assetTypes = [
    'Invoice Financing',
    'Real Estate',
    'Supply Chain',
    'Equipment',
    'Trade Finance'
  ]

  const ratings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B']

  const addAsset = () => {
    setFormData({
      ...formData,
      assets: [...formData.assets, { type: '', value: 0, rating: 'A' }]
    })
  }

  const removeAsset = (index: number) => {
    setFormData({
      ...formData,
      assets: formData.assets.filter((_, i) => i !== index)
    })
  }

  const updateAsset = (index: number, field: keyof Asset, value: any) => {
    const updatedAssets = [...formData.assets]
    updatedAssets[index] = { ...updatedAssets[index], [field]: value }
    setFormData({ ...formData, assets: updatedAssets })
  }

  const calculateTotalValue = () => {
    return formData.assets.reduce((sum, asset) => sum + asset.value, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.assetType) {
      error('Validation Error', 'Please fill in all required fields')
      return
    }

    if (formData.assets.length === 0) {
      error('Validation Error', 'Please add at least one asset')
      return
    }

    const totalValue = calculateTotalValue()
    const totalTarget = formData.seniorTarget + formData.mezzanineTarget + formData.juniorTarget
    
    if (Math.abs(totalValue - totalTarget) > 100) {
      error('Validation Error', 'Total tranche targets should equal total asset value')
      return
    }

    setIsSubmitting(true)
    const loadingId = loading('Creating Pool', 'Submitting to blockchain...')

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      dismiss(loadingId)
      success(
        'Pool Created Successfully!', 
        `${formData.name} has been deployed to the blockchain`,
        {
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          action: {
            label: 'View Pool',
            onClick: () => router.push('/pools/1')
          }
        }
      )
      
      // Reset form or redirect
      setTimeout(() => {
        router.push('/pools')
      }, 2000)
      
    } catch (err) {
      dismiss(loadingId)
      error('Transaction Failed', 'Could not create pool. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold text-white">Create New Pool</h1>
            <p className="text-gray-400 mt-1">Deploy a new RWA investment pool</p>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Invoice Financing Pool #6"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Asset Type *</label>
                <select
                  value={formData.assetType}
                  onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-400"
                  required
                >
                  <option value="">Select asset type...</option>
                  {assetTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm mb-2 block">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the pool's investment strategy and asset composition..."
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
                  onChange={(e) => setFormData({ ...formData, maturity: e.target.value })}
                  placeholder="90"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  required
                />
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Asset Composition</h2>
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition"
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </button>
            </div>

            <div className="space-y-3">
              {formData.assets.map((asset, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-1 block">Asset Type</label>
                    <input
                      type="text"
                      value={asset.type}
                      onChange={(e) => updateAsset(index, 'type', e.target.value)}
                      placeholder="e.g., Tech Invoices"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  
                  <div className="w-32">
                    <label className="text-gray-400 text-xs mb-1 block">Value (USDC)</label>
                    <input
                      type="number"
                      value={asset.value}
                      onChange={(e) => updateAsset(index, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  
                  <div className="w-24">
                    <label className="text-gray-400 text-xs mb-1 block">Rating</label>
                    <select
                      value={asset.rating}
                      onChange={(e) => updateAsset(index, 'rating', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                    >
                      {ratings.map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeAsset(index)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Asset Value:</span>
                <span className="text-2xl font-bold text-white">
                  ${calculateTotalValue().toLocaleString()} USDC
                </span>
              </div>
            </div>
          </motion.div>

          {/* Tranche Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Tranche Configuration</h2>
            
            <div className="space-y-4">
              {/* Senior Tranche */}
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-green-400">Senior Tranche</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">APY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.seniorAPY}
                      onChange={(e) => setFormData({ ...formData, seniorAPY: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Target Amount (USDC)</label>
                    <input
                      type="number"
                      value={formData.seniorTarget}
                      onChange={(e) => setFormData({ ...formData, seniorTarget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>
              </div>

              {/* Mezzanine Tranche */}
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-yellow-400">Mezzanine Tranche</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">APY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.mezzanineAPY}
                      onChange={(e) => setFormData({ ...formData, mezzanineAPY: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Target Amount (USDC)</label>
                    <input
                      type="number"
                      value={formData.mezzanineTarget}
                      onChange={(e) => setFormData({ ...formData, mezzanineTarget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>

              {/* Junior Tranche */}
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-400">Junior Tranche</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">APY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.juniorAPY}
                      onChange={(e) => setFormData({ ...formData, juniorAPY: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Target Amount (USDC)</label>
                    <input
                      type="number"
                      value={formData.juniorTarget}
                      onChange={(e) => setFormData({ ...formData, juniorTarget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation */}
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-semibold">Validation Check</p>
                  <p className="text-gray-400 mt-1">
                    Total Tranches: ${(formData.seniorTarget + formData.mezzanineTarget + formData.juniorTarget).toLocaleString()} USDC
                  </p>
                  <p className="text-gray-400">
                    Total Assets: ${calculateTotalValue().toLocaleString()} USDC
                  </p>
                  {Math.abs(calculateTotalValue() - (formData.seniorTarget + formData.mezzanineTarget + formData.juniorTarget)) > 100 && (
                    <p className="text-yellow-400 mt-1">⚠ Totals should match</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

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
              {isSubmitting ? 'Creating Pool...' : 'Create Pool'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
