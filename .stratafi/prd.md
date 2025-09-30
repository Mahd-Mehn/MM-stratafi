
---

## **Prompt: Build StrataFi - The Winning Project for the CTRL+MOVE Hackathon**

### **Project Vision: The On-Chain Structured Credit Engine**

You are tasked with building  **StrataFi** , a decentralized protocol on Aptos that tokenizes and structures real-world credit assets (like invoice financing, real estate loans, etc.) into tranched investment products. This project is designed to win by demonstrating a novel, high-value financial primitive that is uniquely feasible on Aptos due to its performance and the safety of the Move language.

**The core idea:** StrataFi allows asset originators to pool real-world assets into an on-chain vault. The protocol then "slices" the ownership of this vault into three risk/reward tranches:  **Senior (low-risk, stable yield)** ,  **Mezzanine (medium-risk, moderate yield)** , and  **Junior (high-risk, high-yield)** . An AI-powered risk oracle, named **"Helios,"** will provide real-time health scores for these asset pools.

This project will win by excelling in  **technical sophistication** ,  **financial innovation** , and  **deep ecosystem integration** .

---

### **I. System Architecture & Monorepo Setup**

You will build StrataFi within a **monorepo** to manage the different parts of the application efficiently. Use a tool like **Turborepo** for this.

**Project Structure:**

```
/stratafi-monorepo
|
|--- /apps
|    |--- /frontend          # Next.js dApp for users
|    |--- /helios-agent      # Python FastAPI for AI risk oracle
|
|--- /packages
|    |--- /contracts         # Aptos Move smart contracts
|    |--- /ui                # Shared React component library
|    |--- /sdk               # TypeScript SDK to interact with contracts
|
|--- package.json
|--- turbo.json
```

---

### **II. The Smart Contracts (Move)**

This is the core of your project. You will use the resources from **`aptos-labs/move-by-examples`** to guide your development. The contracts must be secure, efficient, and leverage Aptos-specific features.

#### **1. `vault.move`**

This module will manage the pools of tokenized Real-World Assets (RWAs).

* **`struct RWA`:** Represents a single real-world asset with properties like `id`, `value`, `asset_type`, and `originator`.
* **`struct Vault`:** A resource that holds a collection of `RWA` objects. It will have a unique ID and store metadata about the asset pool.
* **`create_vault()`:** A function that allows a whitelisted asset originator to create a new vault by depositing a collection of RWAs.
* **`add_rwa()`:** Allows adding new assets to an existing vault.

#### **2. `tranche.move`**

This module handles the creation and management of the different risk tranches. These tranches will be represented as  **Fungible Assets (FAs)** .

* **`struct TrancheToken`:** A struct to manage the metadata for each tranche (e.g., `Senior`, `Mezzanine`, `Junior`).
* **`struct VaultShare`:** Represents a user's share in a specific tranche of a vault.
* **`mint_tranches()`:** When a `Vault` is created, this function will mint a corresponding set of Senior, Mezzanine, and Junior tranche tokens. These tokens represent a claim on the vault's cashflows. The initial distribution can be held by the vault creator or sent to an AMM.
* **`get_tranche_supply()`:** A view function to check the total supply of each tranche token.

#### **3. `waterfall.move`**

This is the most critical and innovative contract. It handles the distribution of payments from the RWA pool to the tranche holders. **This is where you demonstrate the power of Aptos's parallel execution.**

* **`struct Payment`:** Represents an incoming payment from the off-chain assets.
* **`process_payment(vault_id, amount)`:** This function executes the payment waterfall.

  1. It takes the incoming `amount`.
  2. It first pays out to all **Senior** tranche holders until their yield target is met.
  3. If funds remain, it pays out to **Mezzanine** holders.
  4. Finally, any remaining funds (profits or losses) are allocated to the **Junior** tranche holders.

  * **Key Winning Feature:** You must design this function to perform all these distributions in a single, atomic transaction. Document in your code comments how this is a feature that prevents the "legging risk" and high gas costs of sequential transactions on EVM chains.

#### **4. `risk_oracle.move`**

This contract is the on-chain component for the Helios AI agent.

* **`struct HealthScore`:** A resource that stores the risk score for a specific vault. It should contain fields like `score` (a U64), `last_updated_timestamp`, and a history of previous scores.
* **`update_health_score(vault_id, new_score)`:** A function that can only be called by the designated Helios AI agent's account. It updates the `HealthScore` for a given vault. This function will be called by the off-chain Python agent.

---

### **III. The Helios AI Agent (Python)**

The Helios agent will be an off-chain service that provides the intelligence layer for StrataFi. You'll use Python with FastAPI for the API and libraries like `requests` and an Aptos SDK for Python. This follows the  **Move Controller Pattern (MCP)** .

#### **1. Data Ingestion Agent (`ingestion.py`)**

* **Nodit Integration (Bounty Winner):** This agent's primary data source will be the  **Nodit Indexer API** . You will use it to:
  * Monitor all transactions related to your `vault.move` and `tranche.move` contracts.
  * Track the creation of new vaults and the addition of new RWAs.
  * Fetch on-chain data about the composition and value of each asset pool.
* **Off-Chain Data:** For the hackathon, you can simulate fetching off-chain data (e.g., from a mock API that provides credit scores or property valuations).

#### **2. Risk Modeling Agent (`modeling.py`)**

* This agent will contain the logic for calculating the `HealthScore`. For the hackathon, a simple weighted model is sufficient:
  * `score = (w1 * asset_diversity) + (w2 * loan_to_value_ratio) + (w3 * originator_reputation)`
* The agent should process the data from the ingestion agent and output a single score (e.g., from 0 to 100).

#### **3. Publisher Agent (`publisher.py`)**

* This agent is the  **Move Controller** . It takes the calculated `HealthScore` and calls the `update_health_score` function in your `risk_oracle.move` contract.
* It will need to manage the private key for the Helios Aptos account and be responsible for signing and submitting the transaction.

#### **4. API (`main.py`)**

* Create a simple FastAPI endpoint (e.g., `/api/v1/vaults/:vault_id/health`) that the frontend can call to get the latest health score for a vault.

---

### **IV. The Frontend dApp (Next.js & TypeScript)**

This is the user-facing part of StrataFi. Use the **`create-aptos-dapp`** template as your starting point. The design should be clean, modern, and make complex financial information easy to understand.

#### **User Flow**

1. **Connect Wallet:** User connects their Petra or other Aptos-compatible wallet.
2. **Dashboard (`/`):** The main page shows a high-level overview of the StrataFi protocol: total value locked (TVL), number of active vaults, and featured pools.
3. **Pools Page (`/pools`):** A gallery of all available RWA vaults. Each `PoolCard` component will display:
   * Vault name (e.g., "Invoice Financing Pool #1").
   * Total value of assets in the vault.
   * The **Helios Health Score** (visualized as a gauge or a color-coded meter).
   * The current APY for each of the three tranches.
4. **Pool Detail Page (`/pools/[id]`):**
   * Detailed information about the RWA pool.
   * A **`TrancheSelector`** component where the user can choose to invest in the Senior, Mezzanine, or Junior tranche.
   * An input field to enter the amount of USDC they want to invest.
   * A **`WaterfallVisualizer`** component that graphically shows how payments are distributed.
   * A button to execute the investment, which calls the appropriate smart contract function.
5. **Portfolio Page (`/portfolio`):**
   * Shows the user's current investments across all vaults and tranches.
   * Displays their total holdings and realized returns.

---

### **V. Integrations for Bounties**

To maximize your score, you must integrate with the hackathon partners.

1. **Hyperion & Tapp.Exchange Bounty:**
   * After your `tranche.move` contract mints the tranche tokens, create a script that uses the **Hyperion SDK** or **Tapp.Exchange SDK** to create new concentrated liquidity pools for these tokens (e.g., `sUSDC/USDC`).
   * This provides immediate liquidity for your tranche tokens and demonstrates powerful ecosystem composability. You should have a "Trade on Hyperion" button on your Pool Detail Page.
2. **Nodit Bounty:**
   * As mentioned in the AI Agent section, **Nodit** will be the backbone of your off-chain intelligence. Use their Indexer API as the primary way to get on-chain data for your Helios agent.
   * In your project's documentation, explicitly state that you are using Nodit for real-time, reliable on-chain data monitoring.

---

### **VI. Testing Strategy**

A winning project is a robust project.

* **Smart Contracts:** Write unit tests in Move for all your contract functions. Use the Aptos CLI to run these tests. Pay special attention to testing the `waterfall.move` logic under various scenarios (full payment, partial payment, default).
* **AI Agent:** Write unit tests for your risk model and integration tests for the publisher's interaction with the Aptos testnet.
* **Frontend:** Use a framework like Vitest or Jest to write component tests for your UI, especially for complex components like the `WaterfallVisualizer`.
* **End-to-End:** Use a tool like Playwright to simulate a full user journey: connecting a wallet, investing in a tranche, and verifying the transaction on the Aptos explorer.

---

### **Final Submission Checklist**

* **Live Demo:** A deployed, functional version of the dApp on the Aptos testnet.
* **Video Presentation:** A concise (3-5 minute) video that explains the vision, demonstrates the product, and highlights the technical innovations (especially the atomic waterfall and AI oracle).
* **GitHub Repository:** A clean, well-documented monorepo with a detailed `README.md` that explains how to set up and run the project locally.
* **Pitch Deck:** A short slide deck summarizing the problem, solution, market opportunity, and why StrataFi is the winning project.

By following this prompt, you will create a project that is not only technically impressive and innovative but also strategically designed to meet all the criteria of the CTRL+MOVE Hackathon. Good luck.
