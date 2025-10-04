import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../../../context/NotificationContext'
import { useAptosTx, isValidTxHash, waitForTransaction } from '../../../lib/aptosTx'

interface Asset {
  type: string
  value: string
  rating: string
}

export default function CreatePool() {
  const router = useRouter()
  const { success, error, loading: notifyLoading, dismiss } = useNotifications()
  const { callCreateVault, callMintTranches } = useAptosTx()
  const [loading, setLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  
  const [formData, setFormData] = useState({
    vaultId: '',
    name: '',
    description: '',
    assetType: '',
    maturity: '',
    totalValue: '',
    availableCapital: '',
    seniorApy: '',
    mezzanineApy: '',
    juniorApy: '',
    seniorTarget: '',
    mezzanineTarget: '',
    juniorTarget: '',
    createdBy: ''
  })

  const [assets, setAssets] = useState<Asset[]>([
    { type: '', value: '', rating: 'A' }
  ])

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      if (window.aptos) {
        const isConnected = await window.aptos.isConnected()
        if (isConnected) {
          const account = await window.aptos.account()
          setWalletConnected(true)
          setWalletAddress(account.address)
          // Auto-fill the createdBy field
          setFormData(prev => ({ ...prev, createdBy: account.address }))
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssetChange = (index: number, field: keyof Asset, value: string) => {
    setAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, [field]: value } : asset
    ))
  }

  const addAsset = () => {
    setAssets(prev => [...prev, { type: '', value: '', rating: 'A' }])
  }

  const removeAsset = (index: number) => {
    setAssets(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let loadingId: string | null = null

    try {
      // Validate required fields
      if (!formData.vaultId || !formData.name || !formData.createdBy) {
        throw new Error('Please fill in all required fields')
      }

      // Check if wallet is connected
      if (!window.aptos) {
        throw new Error('Please install Petra wallet extension')
      }

      const isConnected = await window.aptos.isConnected()
      if (!isConnected) {
        throw new Error('Please connect your wallet first')
      }

      const vaultId = parseInt(formData.vaultId)
      const seniorTarget = parseInt(formData.seniorTarget) || 0
      const mezzanineTarget = parseInt(formData.mezzanineTarget) || 0
      const juniorTarget = parseInt(formData.juniorTarget) || 0

      // Step 1: Create vault on-chain
      loadingId = notifyLoading(
        'Creating Vault On-Chain',
        `Creating vault #${vaultId} on Aptos blockchain...`
      )

      const vaultTx = await callCreateVault(vaultId)
      
      if (!isValidTxHash(vaultTx?.hash)) {
        throw new Error('Failed to create vault on-chain')
      }

      dismiss(loadingId)

      // Step 2: Mint tranches if targets are specified
      if (seniorTarget > 0 || mezzanineTarget > 0 || juniorTarget > 0) {
        loadingId = notifyLoading(
          'Minting Tranches',
          `Minting tranches for vault #${vaultId}...`
        )

        const trancheTx = await callMintTranches(vaultId, seniorTarget, mezzanineTarget, juniorTarget)
        
        if (!isValidTxHash(trancheTx?.hash)) {
          throw new Error('Failed to mint tranches')
        }

        dismiss(loadingId)
      }

      // Step 3: Create pool in database
      loadingId = notifyLoading(
        'Saving Pool Details',
        'Saving pool information to database...'
      )

      const poolData = {
        ...formData,
        vaultId,
        totalValue: formData.totalValue || '0',
        availableCapital: formData.availableCapital || formData.totalValue || '0',
        seniorApy: parseFloat(formData.seniorApy) || 7,
        mezzanineApy: parseFloat(formData.mezzanineApy) || 12,
        juniorApy: parseFloat(formData.juniorApy) || 25,
        seniorTarget: seniorTarget.toString(),
        mezzanineTarget: mezzanineTarget.toString(),
        juniorTarget: juniorTarget.toString(),
        assets: assets.filter(asset => asset.type && asset.value)
      }

      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(poolData),
      })

      if (!response.ok) {
        throw new Error('Failed to save pool to database')
      }

      const createdPool = await response.json()
      
      dismiss(loadingId)
      
      success(
        'Pool Created Successfully!',
        `Pool "${createdPool.name}" has been created on-chain and in database`,
        { 
          duration: 8000,
          txHash: vaultTx.hash,
          action: {
            label: 'View Pool',
            onClick: () => router.push(`/pools/${vaultId}`)
          }
        }
      )

      router.push('/admin')
    } catch (err: any) {
      if (loadingId) dismiss(loadingId)
      error('Failed to Create Pool', err.message, { duration: 6000 })
    } finally {
      setLoading(false)
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
          <Link href="/admin/pools" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Pool</h1>
            <p className="text-gray-400 mt-1">Set up a new investment pool with on-chain vault creation</p>
            <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                ⚡ This will create a vault on Aptos blockchain and mint tranches automatically
              </p>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-6"
        >
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Vault ID *</label>
                <input
                  type="number"
                  name="vaultId"
                  value={formData.vaultId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="Enter vault ID"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Pool Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="e.g., Invoice Financing Pool #1"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Asset Type</label>
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-400"
                >
                  <option value="">Select asset type</option>
                  <option value="Invoice Financing">Invoice Financing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Trade Finance">Trade Finance</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Maturity</label>
                <input
                  type="text"
                  name="maturity"
                  value={formData.maturity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="e.g., 90 days"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="Describe the pool and its underlying assets..."
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Created By (Wallet Address) *
                  {walletConnected && (
                    <span className="ml-2 text-green-400 text-xs">✓ Connected</span>
                  )}
                </label>
                <input
                  type="text"
                  name="createdBy"
                  value={formData.createdBy}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 ${
                    walletConnected ? 'border-green-500/50' : 'border-gray-700'
                  }`}
                  placeholder="0x..."
                  readOnly={walletConnected}
                  required
                />
                {!walletConnected && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Connect your wallet to auto-fill this field
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Financial Details</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Total Value (USDC)</label>
                <input
                  type="number"
                  name="totalValue"
                  value={formData.totalValue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Available Capital (USDC)</label>
                <input
                  type="number"
                  name="availableCapital"
                  value={formData.availableCapital}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="1500000"
                />
              </div>
            </div>
          </div>

          {/* APY Rates */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">APY Rates (%)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Senior APY</label>
                <input
                  type="number"
                  step="0.1"
                  name="seniorApy"
                  value={formData.seniorApy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="7.0"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Mezzanine APY</label>
                <input
                  type="number"
                  step="0.1"
                  name="mezzanineApy"
                  value={formData.mezzanineApy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="12.0"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Junior APY</label>
                <input
                  type="number"
                  step="0.1"
                  name="juniorApy"
                  value={formData.juniorApy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="25.0"
                />
              </div>
            </div>
          </div>

          {/* Target Allocations */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Target Allocations (USDC)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Senior Target</label>
                <input
                  type="number"
                  name="seniorTarget"
                  value={formData.seniorTarget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="3000000"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Mezzanine Target</label>
                <input
                  type="number"
                  name="mezzanineTarget"
                  value={formData.mezzanineTarget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="1500000"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Junior Target</label>
                <input
                  type="number"
                  name="juniorTarget"
                  value={formData.juniorTarget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          {/* Assets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Assets</h2>
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-2 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition"
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </button>
            </div>
            <div className="space-y-3">
              {assets.map((asset, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-1 block">Asset Type</label>
                    <input
                      type="text"
                      value={asset.type}
                      onChange={(e) => handleAssetChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                      placeholder="e.g., Tech Invoices"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-1 block">Value (USDC)</label>
                    <input
                      type="number"
                      value={asset.value}
                      onChange={(e) => handleAssetChange(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                      placeholder="2000000"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-gray-400 text-xs mb-1 block">Rating</label>
                    <select
                      value={asset.rating}
                      onChange={(e) => handleAssetChange(index, 'rating', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                    >
                      <option value="AAA">AAA</option>
                      <option value="AA">AA</option>
                      <option value="A">A</option>
                      <option value="BBB">BBB</option>
                      <option value="BB">BB</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  {assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAsset(index)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Link
              href="/admin/pools"
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating Pool...' : 'Create Pool'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
