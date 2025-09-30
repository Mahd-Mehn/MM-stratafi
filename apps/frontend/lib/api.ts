// API service to connect with Helios AI agent and Aptos blockchain

const HELIOS_API_URL = process.env.NEXT_PUBLIC_HELIOS_URL || 'http://localhost:8000'
const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NODE || 'https://fullnode.testnet.aptoslabs.com/v1'

export interface HealthScoreResponse {
  vault_id: number
  score: number
  risk_factors: {
    asset_diversity: number
    ltv_ratio: number
    originator_reputation: number
    market_conditions: number
  }
  timestamp: string
}

export interface RiskAssessmentRequest {
  vault_id: number
  vault_owner: string
  force_update?: boolean
}

// Helios AI Agent API calls
export const heliosAPI = {
  // Get health score for a vault
  async getHealthScore(vaultId: number): Promise<HealthScoreResponse> {
    try {
      const response = await fetch(`${HELIOS_API_URL}/api/v1/vaults/${vaultId}/health`)
      if (!response.ok) throw new Error('Failed to fetch health score')
      return await response.json()
    } catch (error) {
      console.error('Error fetching health score:', error)
      // Return mock data if API is not available
      return {
        vault_id: vaultId,
        score: 72 + Math.floor(Math.random() * 20),
        risk_factors: {
          asset_diversity: 65 + Math.floor(Math.random() * 20),
          ltv_ratio: 70 + Math.floor(Math.random() * 15),
          originator_reputation: 75 + Math.floor(Math.random() * 15),
          market_conditions: 70 + Math.floor(Math.random() * 20)
        },
        timestamp: new Date().toISOString()
      }
    }
  },

  // Trigger risk assessment for a vault
  async assessVault(request: RiskAssessmentRequest): Promise<HealthScoreResponse> {
    try {
      const response = await fetch(`${HELIOS_API_URL}/api/v1/vaults/${request.vault_id}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      if (!response.ok) throw new Error('Failed to assess vault')
      return await response.json()
    } catch (error) {
      console.error('Error assessing vault:', error)
      // Return mock data if API is not available
      return this.getHealthScore(request.vault_id)
    }
  },

  // Get oracle status
  async getOracleStatus() {
    try {
      const response = await fetch(`${HELIOS_API_URL}/api/v1/status`)
      if (!response.ok) throw new Error('Failed to get oracle status')
      return await response.json()
    } catch (error) {
      console.error('Error fetching oracle status:', error)
      return {
        status: 'offline',
        total_vaults_monitored: 0,
        nodit_connected: false,
        aptos_connected: false
      }
    }
  },

  // List all monitored vaults
  async getMonitoredVaults(): Promise<number[]> {
    try {
      const response = await fetch(`${HELIOS_API_URL}/api/v1/vaults`)
      if (!response.ok) throw new Error('Failed to fetch monitored vaults')
      return await response.json()
    } catch (error) {
      console.error('Error fetching monitored vaults:', error)
      return []
    }
  }
}

// Aptos blockchain interactions
export const aptosAPI = {
  // Get account resources
  async getAccountResources(address: string) {
    try {
      const response = await fetch(`${APTOS_NODE_URL}/accounts/${address}/resources`)
      if (!response.ok) throw new Error('Failed to fetch account resources')
      return await response.json()
    } catch (error) {
      console.error('Error fetching account resources:', error)
      return []
    }
  },

  // Get vault data from blockchain
  async getVaultData(ownerAddress: string) {
    try {
      const resources = await this.getAccountResources(ownerAddress)
      const vaultResource = resources.find((r: any) => r.type.includes('Vault'))
      return vaultResource?.data || null
    } catch (error) {
      console.error('Error fetching vault data:', error)
      return null
    }
  },

  // Get tranche supplies
  async getTrancheSupplies(ownerAddress: string) {
    try {
      const resources = await this.getAccountResources(ownerAddress)
      const trancheResource = resources.find((r: any) => r.type.includes('TrancheVault'))
      return trancheResource?.data || null
    } catch (error) {
      console.error('Error fetching tranche supplies:', error)
      return null
    }
  },

  // Simulate investment transaction
  async simulateInvestment(
    poolId: number,
    tranche: 'Senior' | 'Mezzanine' | 'Junior',
    amount: number,
    userAddress: string
  ) {
    // In production, this would create and submit an actual transaction
    // For now, we simulate the transaction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          message: `Successfully invested ${amount} USDC in ${tranche} tranche of pool ${poolId}`
        })
      }, 2000)
    })
  }
}

// Combined API service
export const api = {
  helios: heliosAPI,
  aptos: aptosAPI,
  
  // Helper function to get comprehensive pool data
  async getPoolData(poolId: number, ownerAddress: string) {
    const [healthScore, vaultData, trancheData] = await Promise.all([
      heliosAPI.getHealthScore(poolId),
      aptosAPI.getVaultData(ownerAddress),
      aptosAPI.getTrancheSupplies(ownerAddress)
    ])
    
    return {
      healthScore,
      vaultData,
      trancheData
    }
  }
}
