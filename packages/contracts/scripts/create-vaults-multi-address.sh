#!/bin/bash

# Script to create vaults using different addresses
# This works around the limitation that each address can only have one vault

echo "🚀 Creating vaults with different addresses..."
echo "=============================================="

# Fund both accounts
echo "💰 Funding primary account..."
aptos account fund-with-faucet --account testnet --amount 200000000

echo ""
echo "💰 Funding secondary account..."
# Switch to the second profile/address if it exists
# For now, we'll create vaults under the primary address but with different vault IDs

echo ""
echo "📦 Creating Vault #2 under primary address..."
echo "Note: This will fail because address already has Vault #1"
echo "We need to use a different approach..."

echo ""
echo "🔧 SOLUTION NEEDED:"
echo "The current smart contract only allows ONE vault per address."
echo "To create multiple vaults, we need either:"
echo "1. Different wallet addresses for each vault"
echo "2. Modify the smart contract to support multiple vaults per address"
echo "3. Use a single vault with multiple 'pools' (logical separation)"

echo ""
echo "📋 Current Status:"
echo "✅ Vault #1: Created successfully under 0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53"
echo "❌ Vault #2-5: Cannot be created under the same address"

echo ""
echo "💡 RECOMMENDED APPROACH:"
echo "1. Use the existing Vault #1 for all pools (modify frontend)"
echo "2. Or deploy contracts that support multiple vaults per address"
echo "3. Or use different wallet addresses for each vault"
