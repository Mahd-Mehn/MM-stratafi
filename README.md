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

```bash
cd packages/contracts
aptos init
aptos move compile
aptos move publish --named-addresses stratafi=default
```

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
