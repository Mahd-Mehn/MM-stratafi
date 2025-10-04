import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Info, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../context/NotificationContext'
import { useAptosTx, isValidTxHash, waitForTransaction } from '../lib/aptosTx'

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
  const [hasExistingVault, setHasExistingVault] = useState(false)
  const [checkingVault, setCheckingVault] = useState(true)
  
  const [formData, setFormData] = useState({
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
    setCheckingVault(true)
    try {
      if (window.aptos) {
        const isConnected = await window.aptos.isConnected()
        if (isConnected) {
          const account = await window.aptos.account()
          setWalletConnected(true)
          setWalletAddress(account.address)
          setFormData(prev => ({ ...prev, createdBy: account.address }))
          
          // Check if user already has a vault/pool
          await checkExistingVault(account.address)
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    } finally {
      setCheckingVault(false)
    }
  }

  const checkExistingVault = async (address: string) => {
    try {
      // Check if user already created a pool
      const response = await fetch(`/api/pools/by-creator/${address}`)
      if (response.ok) {
        const pools = await response.json()
        if (pools.length > 0) {
          setHasExistingVault(true)
        }
      }
    } catch (error) {
      console.error('Error checking existing vault:', error)
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
      if (!formData.name || !formData.createdBy) {
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

      // Check if user already has a vault
      if (hasExistingVault) {
        throw new Error('You can only create one vault per wallet address')
      }

      // Generate a unique vault ID based on timestamp and address
      const vaultId = Math.floor(Date.now() / 1000) // Use timestamp as vault ID
      const seniorTarget = parseInt(formData.seniorTarget) || 0
      const mezzanineTarget = parseInt(formData.mezzanineTarget) || 0
      const juniorTarget = parseInt(formData.juniorTarget) || 0

      // Step 1: Create vault on-chain
      loadingId = notifyLoading(
        'Creating Your Vault',
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
          `Minting tranches for your vault...`
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
        'Saving your pool information...'
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
        `Your pool "${createdPool.name}" is now live and ready for investment!`,
        { 
          duration: 8000,
          txHash: vaultTx.hash,
          action: {
            label: 'View Your Pool',
            onClick: () => router.push(`/pools/${vaultId}`)
          }
        }
      )

      router.push(`/pools/${vaultId}`)
    } catch (err: any) {
      if (loadingId) dismiss(loadingId)
      error('Failed to Create Pool', err.message, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  if (checkingVault) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
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
          <Link href="/pools" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Your Investment Pool</h1>
            <p className="text-gray-400 mt-1">Launch your own RWA investment pool with on-chain vault</p>
          </div>
        </motion.div>

        {/* Wallet Status & Limitations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-8"
        >
          {/* Wallet Connection Status */}
          <div className={`p-4 rounded-lg border ${
            walletConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${walletConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <div>
                <p className={`font-medium ${walletConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {walletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
                </p>
                {walletConnected && (
                  <p className="text-gray-400 text-sm">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Existing Vault Warning */}
          {hasExistingVault && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-400 font-medium mb-1">Vault Limit Reached</h3>
                  <p className="text-yellow-300 text-sm">
                    You already have a vault created with this wallet address. 
                    Each wallet can only create one vault due to smart contract limitations.
                  </p>
                  <Link 
                    href="/portfolio" 
                    className="inline-block mt-2 text-yellow-400 hover:text-yellow-300 text-sm underline"
                  >
                    View your existing pool →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Information Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-medium mb-1">Pool Creation</h3>
                <p className="text-blue-300 text-sm">
                  Create your own investment pool with automatic vault deployment on Aptos blockchain. 
                  Each wallet address can create one vault. Your pool will be immediately available for investment.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-6"
        >
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Pool Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Pool Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="My Investment Pool"
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
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="Describe your pool and its underlying assets..."
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Creator Address *
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
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Maturity Period</label>
                <input
                  type="text"
                  name="maturity"
                  value={formData.maturity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                  placeholder="90 days"
                />
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

          {/* Underlying Assets */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Underlying Assets</h2>
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div key={index} className="grid md:grid-cols-4 gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Asset Type</label>
                    <input
                      type="text"
                      value={asset.type}
                      onChange={(e) => handleAssetChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                      placeholder="Tech Invoices"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Value (USDC)</label>
                    <input
                      type="number"
                      value={asset.value}
                      onChange={(e) => handleAssetChange(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
                      placeholder="2000000"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Rating</label>
                    <select
                      value={asset.rating}
                      onChange={(e) => handleAssetChange(index, 'rating', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-400"
                    >
                      <option value="AAA">AAA</option>
                      <option value="AA">AA</option>
                      <option value="A">A</option>
                      <option value="BBB">BBB</option>
                      <option value="BB">BB</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeAsset(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                      disabled={assets.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-2 px-4 py-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || !walletConnected || hasExistingVault}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
                loading || !walletConnected || hasExistingVault
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Creating Pool...
                </span>
              ) : hasExistingVault ? (
                'Vault Already Created'
              ) : !walletConnected ? (
                'Connect Wallet to Continue'
              ) : (
                'Create Pool & Deploy Vault'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
