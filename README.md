# StrataFi - Institutional-Grade Structured Credit on Aptos

**Production-ready DeFi protocol** for tokenizing real-world credit assets into risk-tranched investment products, powered by Move smart contracts and Helios AI.

##  **LIVE ON APTOS TESTNET** 

**Contract Address**: `0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53`

**Deployed Modules**:
- `vault` - [Initialized](https://explorer.aptoslabs.com/txn/0x73f77cd4130906008bc019bf54fa2dd606c27c99a0bcb355e4f4af20e3f17e2e?network=testnet)
- `tranche` - [Initialized](https://explorer.aptoslabs.com/txn/0xc746824a049bca889cec70bcebbd63ec2521c38797eb803bc2c2e747eb102e68?network=testnet)
- `waterfall` - Deployed & Ready
- `risk_oracle` - Deployed & Ready

**Live Transactions**:
- [Vault Creation](https://explorer.aptoslabs.com/txn/0x807ac636899d209e89247a651618cb21d46b0f1849364541375104fb3b511085?network=testnet) - Vault ID: 1
- [Tranche Minting](https://explorer.aptoslabs.com/txn/0xee67ccf697d78cc04e06d50d701d8393413d24c8489905311046cd637ded8a45?network=testnet) - 3M Senior, 1.5M Mezzanine, 500K Junior

**Try It Live**: [https://stratafi-demo.vercel.app](http://localhost:3000) (Connect Petra Wallet on Testnet)

##  Smart Contract Deployment

**ALREADY DEPLOYED ON TESTNET** - Ready to use!

**Contract Address**: `0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53`

### Quick Setup for Development

### 6) Configure environment (Frontend + Helios)
- Frontend `apps/frontend/.env.local`:
```bash
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_MODULE_ADDR=0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53
```

- Helios Agent `apps/helios-agent/.env`:
```bash
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
HELIOS_AGENT_PRIVATE_KEY=0x<your_hex_private_key>
```

##  On-Chain Operations (CLI)
Examples using the deployed contracts. **All modules are live and ready!**

```bash
# Use the deployed contract address
ADDR=0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53

# Create a new vault (Vault ID 1 already exists, use ID 2+)
aptos move run \
  --profile testnet \
  --function-id "${ADDR}::vault::create_vault" \
  --args u64:2

# Add RWAs to existing vaults
aptos move run \
  --profile testnet \
  --function-id "${ADDR}::vault::add_rwa" \
  --args u64:1 u64:1001 u64:1000000 hex:0x496e766f6963652046696e616e63696e67 address:${ADDR}
```

##  Verify on Aptos Explorer
**Live Contract**: https://explorer.aptoslabs.com/account/0x5a2db6fce3e213f1bc902e8827a98e306b1bb0987d8d8cd63f96f87edcc69b53?network=testnet

**Recent Transactions**:
- [Vault Initialization](https://explorer.aptoslabs.com/txn/0x73f77cd4130906008bc019bf54fa2dd606c27c99a0bcb355e4f4af20e3f17e2e?network=testnet)
- [Tranche Initialization](https://explorer.aptoslabs.com/txn/0xc746824a049bca889cec70bcebbd63ec2521c38797eb803bc2c2e747eb102e68?network=testnet)
- [Vault Creation (ID: 1)](https://explorer.aptoslabs.com/txn/0x807ac636899d209e89247a651618cb21d46b0f1849364541375104fb3b511085?network=testnet)
- [Tranche Minting](https://explorer.aptoslabs.com/txn/0xee67ccf697d78cc04e06d50d701d8393413d24c8489905311046cd637ded8a45?network=testnet)
