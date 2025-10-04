// Using native Petra wallet API instead of wallet adapter

const MODULE_ADDR = process.env.NEXT_PUBLIC_MODULE_ADDR || process.env.NEXT_PUBLIC_MODULE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string
const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet').toLowerCase()

function getFullnodeUrl() {
  if (NETWORK === 'testnet') return 'https://fullnode.testnet.aptoslabs.com/v1'
  if (NETWORK === 'devnet') return 'https://fullnode.devnet.aptoslabs.com/v1'
  if (NETWORK === 'mainnet') return 'https://fullnode.mainnet.aptoslabs.com/v1'
  return 'https://fullnode.testnet.aptoslabs.com/v1'
}

export function isValidTxHash(hash?: string) {
  return typeof hash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(hash)
}

export async function waitForTransaction(hash: string, opts?: { timeoutMs?: number; intervalMs?: number }) {
  const timeoutMs = opts?.timeoutMs ?? 30000
  const intervalMs = opts?.intervalMs ?? 1000
  const start = Date.now()
  const url = `${getFullnodeUrl()}/transactions/by_hash/${hash}`

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        // If execution_completed or success true, return
        if (data && (data.success === true || data.type === 'user_transaction')) {
          return data
        }
      } else if (res.status === 404) {
        // not found yet, keep polling
      }
    } catch (_) {
      // ignore transient errors and continue polling
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Transaction not found or not confirmed within timeout')
}

declare global {
  interface Window {
    aptos?: any
  }
}

export function useAptosTx() {
  const getAccount = async () => {
    if (!window.aptos) {
      throw new Error('Petra wallet not installed')
    }
    
    const isConnected = await window.aptos.isConnected()
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }
    
    return await window.aptos.account()
  }

  const signAndSubmitTransaction = async (transaction: any) => {
    if (!window.aptos) {
      throw new Error('Petra wallet not installed')
    }
    
    return await window.aptos.signAndSubmitTransaction(transaction)
  }

  if (!MODULE_ADDR) {
    // eslint-disable-next-line no-console
    console.warn('NEXT_PUBLIC_MODULE_ADDR is not set')
  }

  async function callVaultInitialize() {
    const account = await getAccount()
    
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::vault::initialize`,
      type_arguments: [],
      arguments: [],
    })
  }

  async function callTrancheInitialize() {
    const account = await getAccount()
    
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::tranche::initialize`,
      type_arguments: [],
      arguments: [],
    })
  }

  async function callCreateVault(vaultId: number) {
    const account = await getAccount()
    
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::vault::create_vault`,
      type_arguments: [],
      arguments: [vaultId],
    })
  }

  async function callAddRwa(vaultId: number, rwaId: number, value: number, assetType: string, originator: string) {
    const account = await getAccount()
    
    const assetBytes = new TextEncoder().encode(assetType)
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::vault::add_rwa`,
      type_arguments: [],
      arguments: [vaultId, rwaId, value, Array.from(assetBytes), originator],
    })
  }

  async function callAddRwas(
    vaultId: number,
    ids: number[],
    values: number[],
    assetTypes: string[],
    originators: string[],
  ) {
    const account = await getAccount()
    
    const assetBytes = assetTypes.map((s) => Array.from(new TextEncoder().encode(s)))
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::vault::add_rwas`,
      type_arguments: [],
      arguments: [vaultId, ids, values, assetBytes, originators],
    })
  }

  async function callMintTranches(vaultId: number, s: number, m: number, j: number) {
    const account = await getAccount()
    
    return signAndSubmitTransaction({
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::tranche::mint_tranches`,
      type_arguments: [],
      arguments: [vaultId, s, m, j],
    })
  }

  async function callInvest(vaultOwner: string, vaultId: number, tranche: number, amount: number) {
    console.log('callInvest called with:', { vaultOwner, vaultId, tranche, amount })
    
    const account = await getAccount()
    console.log('Account retrieved:', account.address)
    
    const transaction = {
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::tranche::invest`,
      type_arguments: [],
      arguments: [vaultOwner, vaultId, tranche, amount],
    }
    
    console.log('Transaction to submit:', transaction)
    
    try {
      const result = await signAndSubmitTransaction(transaction)
      console.log('Transaction result:', result)
      return result
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }

  return {
    callVaultInitialize,
    callTrancheInitialize,
    callCreateVault,
    callAddRwa,
    callAddRwas,
    callMintTranches,
    callInvest,
  }
}
