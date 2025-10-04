import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../../context/NotificationContext'
import { useAptosTx } from '../../lib/aptosTx'
import { fetchPoolsFromDB } from '../../lib/poolsData'

interface VaultStatus {
  vaultId: number
  poolName: string
  exists: boolean
  checking: boolean
  creating: boolean
}

export default function VaultManager() {
  const { success, error, loading: notifyLoading, dismiss } = useNotifications()
  const { callCreateVault, callMintTranches } = useAptosTx()
  const [vaults, setVaults] = useState<VaultStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [walletConnected, setWalletConnected] = useState(false)

  useEffect(() => {
    checkWalletConnection()
    loadPools()
  }, [])

  const checkWalletConnection = async () => {
    try {
      if (window.aptos) {
        const isConnected = await window.aptos.isConnected()
        setWalletConnected(isConnected)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const loadPools = async () => {
    setLoading(true)
    try {
      const pools = await fetchPoolsFromDB()
      const vaultStatuses: VaultStatus[] = pools.map(pool => ({
        vaultId: pool.id,
        poolName: pool.name,
        exists: false,
        checking: false,
        creating: false
      }))
      setVaults(vaultStatuses)
    } catch (err) {
      error('Failed to Load Pools', 'Could not fetch pools from database')
    } finally {
      setLoading(false)
    }
  }

  const createVault = async (vaultId: number, poolName: string) => {
    if (!walletConnected) {
      error('Wallet Not Connected', 'Please connect your wallet first')
      return
    }

    // Find the pool data for tranche targets
    const pools = await fetchPoolsFromDB()
    const pool = pools.find(p => p.id === vaultId)
    
    if (!pool) {
      error('Pool Not Found', 'Could not find pool data')
      return
    }

    setVaults(prev => prev.map(v => 
      v.vaultId === vaultId ? { ...v, creating: true } : v
    ))

    let loadingId: string | null = null

    try {
      // Step 1: Create vault
      loadingId = notifyLoading(
        'Creating Vault',
        `Creating vault #${vaultId} on Aptos blockchain...`
      )

      const vaultTx = await callCreateVault(vaultId)
      
      if (!vaultTx?.hash) {
        throw new Error('Failed to create vault on-chain')
      }

      dismiss(loadingId)

      // Step 2: Mint tranches
      loadingId = notifyLoading(
        'Minting Tranches',
        `Minting tranches for vault #${vaultId}...`
      )

      const seniorTarget = pool.targetAllocations.senior
      const mezzanineTarget = pool.targetAllocations.mezzanine
      const juniorTarget = pool.targetAllocations.junior

      const trancheTx = await callMintTranches(vaultId, seniorTarget, mezzanineTarget, juniorTarget)
      
      if (!trancheTx?.hash) {
        throw new Error('Failed to mint tranches')
      }

      dismiss(loadingId)

      success(
        'Vault Created Successfully!',
        `Vault #${vaultId} "${poolName}" is now ready for investment`,
        { 
          duration: 6000,
          txHash: vaultTx.hash
        }
      )

      // Update vault status
      setVaults(prev => prev.map(v => 
        v.vaultId === vaultId ? { ...v, exists: true, creating: false } : v
      ))

    } catch (err: any) {
      if (loadingId) dismiss(loadingId)
      
      let message = err.message || 'Failed to create vault'
      if (message.includes('ALREADY_EXISTS') || message.includes('MoveTo')) {
        message = 'Vault already exists on-chain'
        setVaults(prev => prev.map(v => 
          v.vaultId === vaultId ? { ...v, exists: true, creating: false } : v
        ))
      } else {
        setVaults(prev => prev.map(v => 
          v.vaultId === vaultId ? { ...v, creating: false } : v
        ))
      }
      
      error('Vault Creation Failed', message, { duration: 6000 })
    }
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
            <h1 className="text-3xl font-bold text-white">Vault Manager</h1>
            <p className="text-gray-400 mt-1">Create missing on-chain vaults for database pools</p>
          </div>
        </motion.div>

        {/* Wallet Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Wallet Status</h2>
              <p className="text-gray-400 text-sm">
                {walletConnected ? 'Wallet connected and ready' : 'Please connect your wallet to create vaults'}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              walletConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {walletConnected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {walletConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Vaults List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Pool Vaults</h2>
            <button
              onClick={loadPools}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {vaults.map((vault) => (
              <div
                key={vault.vaultId}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Vault #{vault.vaultId}</h3>
                  <p className="text-gray-400 text-sm">{vault.poolName}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                    vault.exists ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {vault.exists ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {vault.exists ? 'On-Chain' : 'Missing'}
                    </span>
                  </div>

                  {!vault.exists && (
                    <button
                      onClick={() => createVault(vault.vaultId, vault.poolName)}
                      disabled={vault.creating || !walletConnected}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition disabled:opacity-50"
                    >
                      {vault.creating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {vault.creating ? 'Creating...' : 'Create Vault'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {vaults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No pools found in database</p>
              <Link
                href="/admin/pools/create"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition"
              >
                <Plus className="w-4 h-4" />
                Create New Pool
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
