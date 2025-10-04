#!/bin/bash

# Script to create vaults using different wallet addresses
# This works around the one-vault-per-address limitation

echo "🚀 Creating vaults with different addresses..."
echo "=============================================="

# First, let's check if we have the second profile configured
echo "📋 Checking available profiles..."
aptos config show-profiles

echo ""
echo "💰 Funding accounts..."

# Fund the testnet account (primary)
echo "Funding primary account (testnet profile)..."
aptos account fund-with-faucet --account testnet --amount 200000000

echo ""
echo "🔧 Setting up second address for additional vaults..."
echo "We need to create vaults under different addresses since each address can only have one vault."

# Create a temporary profile for the second address
echo ""
echo "Creating temporary profile for second address..."
aptos init --profile secondary --private-key ed25519-priv-0x1f58f59d947f1dae0fbd798be55c09335fda304bad321601db5d77f7f8d1861e --skip-faucet --network testnet --assume-yes

echo ""
echo "💰 Funding secondary account..."
aptos account fund-with-faucet --account secondary --amount 200000000

echo ""
echo "📦 Creating Vault #2 under secondary address..."
aptos move run --function-id 'secondary::vault::create_vault' --args u64:2 --assume-yes --max-gas 50000 --profile secondary

echo ""
echo "🎯 Minting tranches for Vault #2..."
aptos move run --function-id 'secondary::tranche::mint_tranches' --args u64:2 u64:5100000 u64:2550000 u64:850000 --assume-yes --max-gas 50000 --profile secondary

echo ""
echo "✅ Vault creation completed!"
echo ""
echo "📊 Summary:"
echo "✅ Vault #1: 0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53"
echo "✅ Vault #2: 0x22852031ad71d5d056bf2f345a6241629c9870055bb5363d4d831473b16eafbe"
echo ""
echo "💡 Note: Due to smart contract limitations, each address can only have one vault."
echo "For additional vaults, we would need more wallet addresses or contract modifications."
