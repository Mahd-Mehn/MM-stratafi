# 🏆 StrataFi - Institutional-Grade Structured Credit on Aptos

**Production-ready DeFi protocol** for tokenizing real-world credit assets into risk-tranched investment products, powered by Move smart contracts and Helios AI.

## ✅ Completed Features

### Smart Contracts (Move) ✨
- ✅ **vault.move**: RWA pool management with event emission
- ✅ **tranche.move**: Coin-based Senior/Mezzanine/Junior tranches  
- ✅ **waterfall.move**: Atomic payment distribution (single transaction)
- ✅ **risk_oracle.move**: On-chain health scores with risk factors

### Helios AI Agent (Python/FastAPI) 🤖
- ✅ **Complete REST API** with CORS support
- ✅ **Nodit integration** for blockchain data indexing
- ✅ **Risk modeling engine** with multi-factor assessment
- ✅ **On-chain publisher** with Aptos SDK integration

### Frontend (Next.js) 🎨
- ✅ **Beautiful glassmorphic UI** with Tailwind CSS
- ✅ **Petra wallet integration** with connect/disconnect
- ✅ **Dynamic pool pages** with actual data from clicked pools
- ✅ **Portfolio dashboard** with investment tracking
- ✅ **API integration** connecting to Helios AI agent

## 🚀 Quick Start

### Prerequisites
1. Install [Petra Wallet](https://petra.app/)
2. Node.js 18+, Python 3.11+, Aptos CLI

### Installation & Running

```bash
# Install dependencies
npm install
cd apps/helios-agent && pip install -r requirements.txt
cd ../..

# Option 1: Start everything with one command
chmod +x start.sh
./start.sh

# Option 2: Start services individually
# Terminal 1 - Helios AI Agent
cd apps/helios-agent
python main.py

# Terminal 2 - Frontend
npm run dev:frontend
```

Access:
- 🌐 **Frontend**: http://localhost:3000
- 🤖 **Helios API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs

## 🏗️ Project Structure

```
stratafi-monorepo/
├── apps/
│   ├── frontend/          # Next.js dApp with wallet integration
│   └── helios-agent/      # Python AI Oracle with Nodit integration
├── packages/
│   ├── contracts/         # Move smart contracts (fixed & enhanced)
│   ├── ui/               # Shared React components
│   └── sdk/              # TypeScript SDK
├── lib/
│   ├── poolsData.ts      # Dynamic pool data
│   └── api.ts            # API service layer
└── .stratafi/            # PRD & documentation
```

## 💡 Key Innovations

1. **Atomic Waterfall**: All tranche distributions in single Move transaction
2. **AI Risk Oracle**: Real-time health scoring with Helios
3. **Dynamic Data Flow**: Seamless data between pool listing and details
4. **Production UI/UX**: Professional interface rivaling mainnet DeFi

## 🎯 Hackathon Deliverables

✅ **Main Track**: Novel structured credit primitive  
✅ **Tech Implementation**: Atomic waterfalls leveraging Move  
✅ **Nodit Integration**: Real-time indexing ready  
✅ **Wallet Integration**: Petra wallet connect implemented  
✅ **AI Integration**: Helios risk oracle operational

## 📝 Smart Contract Deployment
This repo supports Devnet and Testnet via Aptos CLI profiles. Below uses Testnet.

### 1) Install Aptos CLI (macOS)
```bash
brew install aptos
```

### 2) Create a Testnet profile and fund it
```bash
cd packages/contracts
aptos init --profile testnet --network testnet
aptos account fund-with-faucet --profile testnet --amount 100000000
```

### 3) Compile
```bash
aptos move compile
```

### 4) Publish to Testnet
Bind the named address to your testnet profile at publish-time:
```bash
aptos move publish --profile testnet --named-addresses stratafi=testnet
```
After success, note the sender address (your module address), e.g. `0x5a2d...9b53`.

### 5) Initialize modules (one-time)
Replace `ADDR` with your testnet address from the publish result.
```bash
ADDR=0x<your_testnet_address>

# Initialize Vault events
aptos move run --profile testnet --function-id "${ADDR}::vault::initialize"

# Initialize Tranche coins & events
aptos move run --profile testnet --function-id "${ADDR}::tranche::initialize"
```

### 6) Configure environment (Frontend + Helios)
- Frontend `apps/frontend/.env.local` (or root `.env` if shared):
```bash
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_MODULE_ADDR=0x<your_testnet_address>
```

- Helios Agent `apps/helios-agent/.env`:
```bash
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
HELIOS_AGENT_PRIVATE_KEY=0x<your_hex_private_key>
```
Find your CLI private key at `~/.aptos/config.yaml` → `profiles.testnet.private_key`.

## 🔧 On-Chain Operations (CLI)
Examples using the Vault module. Replace `ADDR` accordingly.

```bash
ADDR=0x<your_testnet_address>

# Create a vault with ID 1
aptos move run \
  --profile testnet \
  --function-id "${ADDR}::vault::create_vault" \
  --args u64:1

# Add a single RWA (vault_id=1, rwa_id=1001, value=1_000_000, asset_type="Invoice Financing", originator=ADDR)
# String as utf8 bytes in hex: "Invoice Financing" -> 0x496e766f6963652046696e616e63696e67
aptos move run \
  --profile testnet \
  --function-id "${ADDR}::vault::add_rwa" \
  --args u64:1 u64:1001 u64:1000000 hex:0x496e766f6963652046696e616e63696e67 address:${ADDR}
```

Batch adds are supported via `vault::add_rwas` but crafting vector args in CLI is verbose; prefer the Admin UI (below).

## 🖥️ Operate via dApp Admin
1) Start services
```bash
npm install
cd apps/helios-agent && pip install -r requirements.txt && cd ../..
chmod +x start.sh && ./start.sh  # or run services individually
```

2) Ensure env is set as above and Petra is on Testnet.

3) Initialize (if not yet): open `http://localhost:3000/admin/settings` and click
- Initialize Vault Events
- Initialize Tranche Coins & Events

4) Create/configure a pool: open `http://localhost:3000/admin`, choose a pool → Edit
- In "On-chain Actions": set Vault ID (e.g., 1) → "Create Vault"
- Add Single RWA (ID, Value, Asset Type, Originator) → "Add RWA"
- Optionally use "Add RWAs Batch"
- Provide Senior/Mezz/Junior supplies → "Mint Tranches"

All actions sign and submit real Testnet transactions via Petra.

## 🔎 Verify on Aptos Explorer
- Transactions: https://explorer.aptoslabs.com/txn/<TXN_HASH>?network=testnet
- Account/modules: https://explorer.aptoslabs.com/account/0x<your_testnet_address>?network=testnet
- Events (e.g., `VaultCreatedEvent`, `RWAAddedEvent`) under account resources/events

## 🧪 Testing

```bash
# Move tests
cd packages/contracts
aptos move test

# Frontend
cd apps/frontend
npm test
```

Refer to `.stratafi/prd.md` for full specification.
