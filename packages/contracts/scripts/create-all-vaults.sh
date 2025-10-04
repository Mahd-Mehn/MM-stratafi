#!/bin/bash

# Script to create all vaults for seeded pools
# Run this from the packages/contracts directory

echo "🚀 Creating all vaults for seeded pools..."
echo "=========================================="

# Fund the account first
echo "💰 Funding account..."
aptos account fund-with-faucet --account testnet --amount 200000000

echo ""
echo "📦 Creating Vault #2 - Real Estate Bridge Loans..."
aptos move run --function-id 'testnet::vault::create_vault' --args u64:2 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "🎯 Minting tranches for Vault #2..."
aptos move run --function-id 'testnet::tranche::mint_tranches' --args u64:2 u64:5100000 u64:2550000 u64:850000 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "📦 Creating Vault #3 - Supply Chain Finance Pool..."
aptos move run --function-id 'testnet::vault::create_vault' --args u64:3 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "🎯 Minting tranches for Vault #3..."
aptos move run --function-id 'testnet::tranche::mint_tranches' --args u64:3 u64:1920000 u64:960000 u64:320000 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "📦 Creating Vault #4 - Equipment Leasing Pool..."
aptos move run --function-id 'testnet::vault::create_vault' --args u64:4 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "🎯 Minting tranches for Vault #4..."
aptos move run --function-id 'testnet::tranche::mint_tranches' --args u64:4 u64:2850000 u64:1425000 u64:475000 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "📦 Creating Vault #5 - Trade Finance Facility..."
aptos move run --function-id 'testnet::vault::create_vault' --args u64:5 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "🎯 Minting tranches for Vault #5..."
aptos move run --function-id 'testnet::tranche::mint_tranches' --args u64:5 u64:3780000 u64:1890000 u64:630000 --assume-yes --max-gas 50000 --profile testnet

echo ""
echo "✅ All vaults created successfully!"
echo "🎉 Your StrataFi pools are now ready for investment!"
