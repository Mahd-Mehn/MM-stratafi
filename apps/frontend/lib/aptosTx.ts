import { useWallet } from '@aptos-labs/wallet-adapter-react'

const MODULE_ADDR = process.env.NEXT_PUBLIC_MODULE_ADDR as string
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

export function useAptosTx() {
  const { signAndSubmitTransaction, account } = useWallet()

  if (!MODULE_ADDR) {
    // eslint-disable-next-line no-console
    console.warn('NEXT_PUBLIC_MODULE_ADDR is not set')
  }

  async function callVaultInitialize() {
    return signAndSubmitTransaction({
      sender: account!.address,
      data: { function: `${MODULE_ADDR}::vault::initialize`, typeArguments: [], functionArguments: [] },
    })
  }

  async function callTrancheInitialize() {
    return signAndSubmitTransaction({
      sender: account!.address,
      data: { function: `${MODULE_ADDR}::tranche::initialize`, typeArguments: [], functionArguments: [] },
    })
  }

  async function callCreateVault(vaultId: number) {
    return signAndSubmitTransaction({
      sender: account!.address,
      data: { function: `${MODULE_ADDR}::vault::create_vault`, typeArguments: [], functionArguments: [vaultId] },
    })
  }

  async function callAddRwa(vaultId: number, rwaId: number, value: number, assetType: string, originator: string) {
    const assetBytes = new TextEncoder().encode(assetType)
    return signAndSubmitTransaction({
      sender: account!.address,
      data: {
        function: `${MODULE_ADDR}::vault::add_rwa`,
        typeArguments: [],
        functionArguments: [vaultId, rwaId, value, Array.from(assetBytes), originator],
      },
    })
  }

  async function callAddRwas(
    vaultId: number,
    ids: number[],
    values: number[],
    assetTypes: string[],
    originators: string[],
  ) {
    const assetBytes = assetTypes.map((s) => Array.from(new TextEncoder().encode(s)))
    return signAndSubmitTransaction({
      sender: account!.address,
      data: {
        function: `${MODULE_ADDR}::vault::add_rwas`,
        typeArguments: [],
        functionArguments: [vaultId, ids, values, assetBytes, originators],
      },
    })
  }

  async function callMintTranches(vaultId: number, s: number, m: number, j: number) {
    return signAndSubmitTransaction({
      sender: account!.address,
      data: {
        function: `${MODULE_ADDR}::tranche::mint_tranches`,
        typeArguments: [],
        functionArguments: [vaultId, s, m, j],
      },
    })
  }

  async function callInvest(vaultOwner: string, vaultId: number, tranche: number, amount: number) {
    return signAndSubmitTransaction({
      sender: account!.address,
      data: {
        function: `${MODULE_ADDR}::tranche::invest`,
        typeArguments: [],
        functionArguments: [vaultOwner, vaultId, tranche, amount],
      },
    })
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
