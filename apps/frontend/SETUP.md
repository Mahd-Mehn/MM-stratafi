# Frontend Setup Instructions

## Prerequisites
1. Install Petra Wallet browser extension from: https://petra.app/

## Installation & Running

1. **Install dependencies:**
```bash
cd apps/frontend
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

3. **Access the app:**
Open http://localhost:3000 in your browser

## Key Features

### ✨ Pool Detail Page
- Beautiful UI with glassmorphic design
- Real-time health score visualization
- Interactive tranche selector
- Payment waterfall visualizer
- Detailed asset composition
- Investment calculator with expected returns

### 🔗 Wallet Connection
- Direct Petra wallet integration
- Auto-detects if Petra is installed
- Shows wallet address when connected
- Smooth connect/disconnect flow

## Troubleshooting

### Styles not appearing?
If you see plain text instead of styled components:

1. Make sure Tailwind CSS is installed:
```bash
npm install -D tailwindcss postcss autoprefixer
```

2. Ensure the postcss.config.js and tailwind.config.js files exist

3. Restart the development server:
```bash
npm run dev
```

### Wallet not connecting?
1. Make sure Petra wallet extension is installed
2. Check that you're on the Aptos testnet
3. Try refreshing the page after installing Petra
4. Check browser console for any errors

## Project Structure

```
frontend/
├── components/
│   ├── Layout.tsx          # Main layout with navigation
│   ├── WalletConnect.tsx   # Petra wallet connection
│   └── UIComponents.tsx    # Reusable UI components
├── pages/
│   ├── index.tsx           # Landing page
│   ├── pools/
│   │   ├── index.tsx       # Pools listing
│   │   └── [id].tsx        # Individual pool detail
│   └── portfolio.tsx       # User portfolio
└── styles/
    └── globals.css         # Tailwind CSS imports
```
