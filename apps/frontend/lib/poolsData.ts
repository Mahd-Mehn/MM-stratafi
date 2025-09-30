export interface Pool {
  id: number
  name: string
  totalValue: number
  availableCapital: number
  apy: { senior: number; mezzanine: number; junior: number }
  healthScore: number
  assetType: string
  maturity: string
  status: 'active' | 'closed' | 'pending'
  description: string
  assets: Array<{ 
    type: string
    value: number
    rating: string 
  }>
  currentAllocations: { 
    senior: number
    mezzanine: number
    junior: number 
  }
  targetAllocations: { 
    senior: number
    mezzanine: number
    junior: number 
  }
}

// Shared pool data that can be accessed across the app
export const poolsData: Pool[] = [
  {
    id: 1,
    name: 'Invoice Financing Pool #1',
    totalValue: 5000000,
    availableCapital: 1500000,
    apy: { senior: 7, mezzanine: 12, junior: 25 },
    healthScore: 85,
    assetType: 'Invoice Financing',
    maturity: '90 days',
    status: 'active',
    description: 'This pool consists of high-quality invoice financing assets from Fortune 500 suppliers. The underlying assets have an average payment term of 60 days with strong credit ratings from established technology and healthcare companies.',
    assets: [
      { type: 'Tech Invoices', value: 2000000, rating: 'A' },
      { type: 'Healthcare Invoices', value: 1800000, rating: 'AA' },
      { type: 'Manufacturing', value: 1200000, rating: 'BBB' }
    ],
    currentAllocations: { senior: 3000000, mezzanine: 1200000, junior: 300000 },
    targetAllocations: { senior: 3000000, mezzanine: 1500000, junior: 500000 }
  },
  {
    id: 2,
    name: 'Real Estate Bridge Loans #3',
    totalValue: 8500000,
    availableCapital: 2300000,
    apy: { senior: 8, mezzanine: 14, junior: 28 },
    healthScore: 72,
    assetType: 'Real Estate',
    maturity: '180 days',
    status: 'active',
    description: 'Premium real estate bridge financing for commercial properties in tier-1 cities. All properties are professionally appraised with conservative loan-to-value ratios ensuring strong collateral coverage.',
    assets: [
      { type: 'Commercial Office', value: 3500000, rating: 'A' },
      { type: 'Retail Properties', value: 2800000, rating: 'BBB' },
      { type: 'Mixed-Use Development', value: 2200000, rating: 'BB' }
    ],
    currentAllocations: { senior: 5100000, mezzanine: 2550000, junior: 850000 },
    targetAllocations: { senior: 5100000, mezzanine: 2550000, junior: 850000 }
  },
  {
    id: 3,
    name: 'Supply Chain Finance Pool',
    totalValue: 3200000,
    availableCapital: 800000,
    apy: { senior: 6, mezzanine: 11, junior: 22 },
    healthScore: 78,
    assetType: 'Supply Chain',
    maturity: '60 days',
    status: 'active',
    description: 'Financing for global supply chain operations focusing on inventory and purchase order financing. Partners include established logistics companies with strong operational track records.',
    assets: [
      { type: 'Inventory Financing', value: 1500000, rating: 'A' },
      { type: 'Purchase Orders', value: 1000000, rating: 'AA' },
      { type: 'Trade Credit', value: 700000, rating: 'A' }
    ],
    currentAllocations: { senior: 1920000, mezzanine: 960000, junior: 320000 },
    targetAllocations: { senior: 1920000, mezzanine: 960000, junior: 320000 }
  },
  {
    id: 4,
    name: 'Equipment Leasing Pool',
    totalValue: 4750000,
    availableCapital: 1200000,
    apy: { senior: 7.5, mezzanine: 13, junior: 26 },
    healthScore: 81,
    assetType: 'Equipment',
    maturity: '365 days',
    status: 'active',
    description: 'Equipment financing for industrial machinery, medical devices, and technology infrastructure. All equipment is insured and maintained under strict service agreements with guaranteed buyback options.',
    assets: [
      { type: 'Industrial Machinery', value: 2000000, rating: 'BBB' },
      { type: 'Medical Equipment', value: 1750000, rating: 'A' },
      { type: 'IT Infrastructure', value: 1000000, rating: 'AA' }
    ],
    currentAllocations: { senior: 2850000, mezzanine: 1425000, junior: 475000 },
    targetAllocations: { senior: 2850000, mezzanine: 1425000, junior: 475000 }
  },
  {
    id: 5,
    name: 'Trade Finance Facility #2',
    totalValue: 6300000,
    availableCapital: 1800000,
    apy: { senior: 6.5, mezzanine: 11.5, junior: 24 },
    healthScore: 88,
    assetType: 'Trade Finance',
    maturity: '45 days',
    status: 'active',
    description: 'Short-term trade finance facility supporting international commerce with focus on Asia-Pacific trade corridors. All transactions are backed by letters of credit from top-tier banks.',
    assets: [
      { type: 'Letters of Credit', value: 2800000, rating: 'AAA' },
      { type: 'Export Finance', value: 2000000, rating: 'AA' },
      { type: 'Import Finance', value: 1500000, rating: 'A' }
    ],
    currentAllocations: { senior: 3780000, mezzanine: 1890000, junior: 630000 },
    targetAllocations: { senior: 3780000, mezzanine: 1890000, junior: 630000 }
  }
]

export function getPoolById(id: number): Pool | undefined {
  return poolsData.find(pool => pool.id === id)
}
