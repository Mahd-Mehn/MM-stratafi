// Script to seed the database with multiple pools
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Wallet addresses for pool creators
const walletAddresses = [
  '0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53',
  '0x22852031ad71d5d056bf2f345a6241629c9870055bb5363d4d831473b16eafbe'
]

const poolsData = [
  {
    vaultId: 1,
    name: 'Invoice Financing Pool #1',
    description: 'This pool consists of high-quality invoice financing assets from Fortune 500 suppliers. The underlying assets have an average payment term of 60 days with strong credit ratings from established technology and healthcare companies.',
    assetType: 'Invoice Financing',
    maturity: '90 days',
    status: 'active',
    totalValue: BigInt(5000000),
    availableCapital: BigInt(1500000),
    healthScore: 85,
    seniorApy: 7.0,
    mezzanineApy: 12.0,
    juniorApy: 25.0,
    seniorTarget: BigInt(3000000),
    mezzanineTarget: BigInt(1500000),
    juniorTarget: BigInt(500000),
    createdBy: walletAddresses[0],
    assets: [
      { type: 'Tech Invoices', value: BigInt(2000000), rating: 'A' },
      { type: 'Healthcare Invoices', value: BigInt(1800000), rating: 'AA' },
      { type: 'Manufacturing', value: BigInt(1200000), rating: 'BBB' }
    ]
  },
  {
    vaultId: 2,
    name: 'Real Estate Bridge Loans #3',
    description: 'Premium real estate bridge financing for commercial properties in tier-1 cities. All properties are professionally appraised with conservative loan-to-value ratios ensuring strong collateral coverage.',
    assetType: 'Real Estate',
    maturity: '180 days',
    status: 'active',
    totalValue: BigInt(8500000),
    availableCapital: BigInt(2300000),
    healthScore: 72,
    seniorApy: 8.0,
    mezzanineApy: 14.0,
    juniorApy: 28.0,
    seniorTarget: BigInt(5100000),
    mezzanineTarget: BigInt(2550000),
    juniorTarget: BigInt(850000),
    createdBy: walletAddresses[1],
    assets: [
      { type: 'Commercial Office', value: BigInt(3500000), rating: 'A' },
      { type: 'Retail Properties', value: BigInt(2800000), rating: 'BBB' },
      { type: 'Mixed-Use Development', value: BigInt(2200000), rating: 'BB' }
    ]
  },
  {
    vaultId: 3,
    name: 'Supply Chain Finance Pool',
    description: 'Financing for global supply chain operations focusing on inventory and purchase order financing. Partners include established logistics companies with strong operational track records.',
    assetType: 'Supply Chain',
    maturity: '60 days',
    status: 'active',
    totalValue: BigInt(3200000),
    availableCapital: BigInt(800000),
    healthScore: 78,
    seniorApy: 6.0,
    mezzanineApy: 11.0,
    juniorApy: 22.0,
    seniorTarget: BigInt(1920000),
    mezzanineTarget: BigInt(960000),
    juniorTarget: BigInt(320000),
    createdBy: walletAddresses[0],
    assets: [
      { type: 'Inventory Financing', value: BigInt(1500000), rating: 'A' },
      { type: 'Purchase Orders', value: BigInt(1000000), rating: 'AA' },
      { type: 'Trade Credit', value: BigInt(700000), rating: 'A' }
    ]
  },
  {
    vaultId: 4,
    name: 'Equipment Leasing Pool',
    description: 'Equipment financing for industrial machinery, medical devices, and technology infrastructure. All equipment is insured and maintained under strict service agreements with guaranteed buyback options.',
    assetType: 'Equipment',
    maturity: '365 days',
    status: 'active',
    totalValue: BigInt(4750000),
    availableCapital: BigInt(1200000),
    healthScore: 81,
    seniorApy: 7.5,
    mezzanineApy: 13.0,
    juniorApy: 26.0,
    seniorTarget: BigInt(2850000),
    mezzanineTarget: BigInt(1425000),
    juniorTarget: BigInt(475000),
    createdBy: walletAddresses[1],
    assets: [
      { type: 'Industrial Machinery', value: BigInt(2000000), rating: 'BBB' },
      { type: 'Medical Equipment', value: BigInt(1750000), rating: 'A' },
      { type: 'IT Infrastructure', value: BigInt(1000000), rating: 'AA' }
    ]
  },
  {
    vaultId: 5,
    name: 'Trade Finance Facility #2',
    description: 'Short-term trade finance facility supporting international commerce with focus on Asia-Pacific trade corridors. All transactions are backed by letters of credit from top-tier banks.',
    assetType: 'Trade Finance',
    maturity: '45 days',
    status: 'active',
    totalValue: BigInt(6300000),
    availableCapital: BigInt(1800000),
    healthScore: 88,
    seniorApy: 6.5,
    mezzanineApy: 11.5,
    juniorApy: 24.0,
    seniorTarget: BigInt(3780000),
    mezzanineTarget: BigInt(1890000),
    juniorTarget: BigInt(630000),
    createdBy: walletAddresses[0],
    assets: [
      { type: 'Letters of Credit', value: BigInt(2800000), rating: 'AAA' },
      { type: 'Export Finance', value: BigInt(2000000), rating: 'AA' },
      { type: 'Import Finance', value: BigInt(1500000), rating: 'A' }
    ]
  }
]

async function seedPools() {
  console.log('🌱 Starting to seed pools...')
  
  for (const poolData of poolsData) {
    try {
      const pool = await prisma.pool.create({
        data: {
          vaultId: poolData.vaultId,
          name: poolData.name,
          description: poolData.description,
          assetType: poolData.assetType,
          maturity: poolData.maturity,
          status: poolData.status,
          totalValue: poolData.totalValue,
          availableCapital: poolData.availableCapital,
          healthScore: poolData.healthScore,
          seniorApy: poolData.seniorApy,
          mezzanineApy: poolData.mezzanineApy,
          juniorApy: poolData.juniorApy,
          seniorTarget: poolData.seniorTarget,
          mezzanineTarget: poolData.mezzanineTarget,
          juniorTarget: poolData.juniorTarget,
          createdBy: poolData.createdBy,
          assets: {
            create: poolData.assets
          }
        },
        include: {
          assets: true
        }
      })

      console.log(`✅ Pool #${pool.vaultId} created successfully:`, {
        id: pool.id,
        vaultId: pool.vaultId,
        name: pool.name,
        assets: pool.assets.length,
        createdBy: pool.createdBy.slice(0, 10) + '...'
      })
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`ℹ️  Pool #${poolData.vaultId} already exists in database`)
      } else {
        console.error(`❌ Error creating pool #${poolData.vaultId}:`, error.message)
      }
    }
  }
  
  console.log('🎉 Pool seeding completed!')
  await prisma.$disconnect()
}

seedPools()
