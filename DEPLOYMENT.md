# 🚀 StrataFi Deployment Guide

## Smart Contract Deployment to Aptos Testnet

### Prerequisites

1. **Install Aptos CLI**
```bash
# macOS
brew install aptos

# Linux/WSL
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version
```

2. **Create Aptos Account**
```bash
# Navigate to contracts directory
cd packages/contracts

# Initialize new account
aptos init

# This will:
# - Create .aptos/config.yaml
# - Generate new keypair
# - Create account on testnet
# - Fund with test APT tokens
```

3. **Save your credentials**
```bash
# Your account address will be shown
# Save the private key from .aptos/config.yaml securely
```

### Deploy Smart Contracts

#### Step 1: Update Module Addresses

Edit `packages/contracts/Move.toml`:
```toml
[addresses]
stratafi = "YOUR_ACCOUNT_ADDRESS"  # Replace with your address from aptos init
aptos_framework = "0x1"
aptos_std = "0x1"
```

#### Step 2: Compile Contracts

```bash
cd packages/contracts

# Compile all modules
aptos move compile

# You should see output like:
# Compiling, may take a little while...
# INCLUDING DEPENDENCY AptosFramework
# INCLUDING DEPENDENCY AptosStdlib
# BUILDING StrataFi
# Success!
```

#### Step 3: Deploy to Testnet

```bash
# Deploy all contracts at once
aptos move publish \
  --assume-yes \
  --named-addresses stratafi=default

# Or deploy with specific gas settings
aptos move publish \
  --assume-yes \
  --named-addresses stratafi=default \
  --max-gas 50000 \
  --gas-unit-price 100
```

#### Step 4: Initialize Protocol

```bash
# Initialize vault module
aptos move run \
  --function-id 'default::vault::initialize' \
  --assume-yes

# Initialize tranche module  
aptos move run \
  --function-id 'default::tranche::initialize' \
  --assume-yes

# Initialize waterfall module
aptos move run \
  --function-id 'default::waterfall::initialize' \
  --assume-yes

# Initialize risk oracle
aptos move run \
  --function-id 'default::risk_oracle::initialize_events' \
  --assume-yes
```

#### Step 5: Verify Deployment

```bash
# Check your account resources
aptos account list --account default

# View specific module
aptos move view \
  --function-id 'default::vault::get_vault_count'
```

### Create Your First Pool (Admin)

```bash
# Create a vault with initial RWAs
aptos move run \
  --function-id 'default::vault::create_vault' \
  --args u64:1 'vector<u8>:[]' \
  --assume-yes

# Mint tranches for the vault
aptos move run \
  --function-id 'default::tranche::mint_tranches' \
  --args u64:1 u64:3000000 u64:1500000 u64:500000 \
  --assume-yes
```

### Environment Configuration

#### Update Frontend Environment

Create `.env.local` in `apps/frontend/`:
```env
NEXT_PUBLIC_APTOS_NODE=https://fullnode.testnet.aptoslabs.com/v1
NEXT_PUBLIC_MODULE_ADDRESS=YOUR_DEPLOYED_ADDRESS
NEXT_PUBLIC_HELIOS_URL=http://localhost:8000
```

#### Update Helios Agent Environment

Create `.env` in `apps/helios-agent/`:
```env
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
STRATAFI_ADDR=YOUR_DEPLOYED_ADDRESS
HELIOS_AGENT_PRIVATE_KEY=YOUR_PRIVATE_KEY_HEX
NODIT_API_KEY=your_nodit_api_key
```

### Testing Deployed Contracts

#### Test Investment Flow

```bash
# Invest in senior tranche
aptos move run \
  --function-id 'default::tranche::invest' \
  --args u64:1 u8:0 u64:100000 \
  --assume-yes

# Check tranche balances
aptos move view \
  --function-id 'default::tranche::get_tranche_supplies' \
  --args address:YOUR_ADDRESS u64:1
```

#### Test Waterfall Distribution

```bash
# Process payment through waterfall
aptos move run \
  --function-id 'default::waterfall::process_payment' \
  --args u64:1 u64:100000 \
  --assume-yes
```

### Mainnet Deployment

⚠️ **Important for Mainnet:**

1. **Security Audit**: Get contracts audited before mainnet
2. **Multisig Setup**: Use multisig for admin functions
3. **Rate Limiting**: Implement rate limits on critical functions
4. **Monitoring**: Set up monitoring with Nodit
5. **Emergency Pause**: Add pause mechanism for emergencies

#### Mainnet Deployment Steps

```bash
# Switch to mainnet
aptos init --network mainnet

# Update Move.toml with mainnet address
# Deploy with higher gas limits
aptos move publish \
  --assume-yes \
  --named-addresses stratafi=default \
  --max-gas 200000 \
  --gas-unit-price 100 \
  --network mainnet
```

### Common Issues & Solutions

#### Issue: "Account does not exist"
```bash
# Fund your account
aptos account fund-with-faucet --account default
```

#### Issue: "INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE"
```bash
# Get more test APT
aptos account fund-with-faucet --account default --amount 100000000
```

#### Issue: "MODULE_ADDRESS_DOES_NOT_MATCH_SENDER"
```bash
# Make sure stratafi address in Move.toml matches your account
aptos account list --account default
```

#### Issue: "SEQUENCE_NUMBER_TOO_OLD"
```bash
# Wait a moment and retry, or check account sequence
aptos account list --account default
```

### Integration Checklist

- [ ] Deploy all 4 smart contracts
- [ ] Initialize all modules
- [ ] Update frontend with contract address
- [ ] Update Helios agent with contract address
- [ ] Create at least one test pool
- [ ] Test investment flow end-to-end
- [ ] Verify waterfall distribution
- [ ] Check Helios oracle updates

### Useful Aptos Explorer Links

- **Testnet Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Your Account**: `https://explorer.aptoslabs.com/account/YOUR_ADDRESS?network=testnet`
- **Your Modules**: `https://explorer.aptoslabs.com/account/YOUR_ADDRESS/modules?network=testnet`

### Next Steps

1. **Frontend**: Update contract addresses in `lib/api.ts`
2. **Helios**: Configure with your deployed address
3. **Testing**: Run end-to-end tests with testnet
4. **Monitoring**: Set up Nodit indexer for events
5. **Documentation**: Update README with your deployed addresses

---

## Support

For deployment issues:
- Aptos Discord: https://discord.gg/aptoslabs
- StrataFi Docs: Check `.stratafi/prd.md`
- GitHub Issues: Create an issue with deployment logs
