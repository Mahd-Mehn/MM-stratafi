// Script to create on-chain vaults for seeded pools
// This should be run after seeding the database

const vaultsToCreate = [
  {
    vaultId: 2,
    name: 'Real Estate Bridge Loans #3',
    seniorTarget: 5100000,
    mezzanineTarget: 2550000,
    juniorTarget: 850000
  },
  {
    vaultId: 3,
    name: 'Supply Chain Finance Pool',
    seniorTarget: 1920000,
    mezzanineTarget: 960000,
    juniorTarget: 320000
  },
  {
    vaultId: 5,
    name: 'Trade Finance Facility #2',
    seniorTarget: 3780000,
    mezzanineTarget: 1890000,
    juniorTarget: 630000
  }
]

console.log('🔗 On-Chain Vault Creation Instructions')
console.log('=====================================')
console.log('')
console.log('To create the corresponding on-chain vaults for the seeded pools,')
console.log('run the following commands in the contracts directory:')
console.log('')
console.log('cd packages/contracts')
console.log('')

vaultsToCreate.forEach(vault => {
  console.log(`# Create Vault #${vault.vaultId} - ${vault.name}`)
  console.log(`aptos move run --function-id 'testnet::vault::create_vault' --args u64:${vault.vaultId} --assume-yes --max-gas 50000 --profile testnet`)
  console.log('')
  console.log(`# Mint tranches for Vault #${vault.vaultId}`)
  console.log(`aptos move run --function-id 'testnet::tranche::mint_tranches' --args u64:${vault.vaultId} u64:${vault.seniorTarget} u64:${vault.mezzanineTarget} u64:${vault.juniorTarget} --assume-yes --max-gas 50000 --profile testnet`)
  console.log('')
  console.log('---')
  console.log('')
})

console.log('✅ After running these commands, all pools will be available for investment!')
console.log('')
console.log('💡 Alternatively, you can use the admin interface at /admin/pools/create')
console.log('   to create new pools with automatic on-chain vault creation.')
