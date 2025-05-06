# ⚽️🎯 BetChain — A Decentralized Prediction Market

**BetChain** is a full-stack decentralized application (dApp) that allows users to place ETH-based predictions on real-world events — like football matches, elections, or crypto trends. The entire system is governed by smart contracts to ensure fairness, transparency, and decentralization.

---

## 🌐 Live Demo

🔗 [https://crypto-bet-zeta.vercel.app/](https://crypto-bet-zeta.vercel.app/)

> 🦊 Requires MetaMask connected to the **Sepolia test network**

---

## 🧠 Key Features

* ✅ Place bets using ETH on sports and real-world events
* 📜 Immutable smart contracts handle betting logic and payouts
* 🧾 Transparent pools and outcome tracking
* 👛 MetaMask integration for wallet-based participation
* 📊 Admin interface for event creation and resolution

---

## 🧱 Smart Contract Overview

### Core Functions

* `createEvent(string name, uint eventTime)`
* `placeBet(uint eventId, uint option)`
* `closeEvent(uint eventId, uint correctOption)`
* `claimReward(uint eventId)`

### Security Rules

* ❌ Bets are rejected after the event starts
* 🔐 Events can only be closed once
* 🎯 Only correct predictions can claim rewards

---

## 📁 Project Structure

```
.
├── Frontend   # React + Vite + Tailwind + ethers.js
└── backend    # Express + Prisma + PostgreSQL
```

### Frontend Highlights

* `src/pages/`: `Home.tsx`, `Dashboard.tsx`, `Admin.tsx`, `EventDetails.tsx`
* `src/components/`: modular UI for betting, layout, events
* `src/api/`: interacts with the backend (bets, events)
* `src/hooks/`: `useBetChain` for smart contract interaction
* `src/contracts/BetChain.json`: compiled ABI

### Backend Highlights

* REST API using Express.js
* Prisma ORM with PostgreSQL
* Routes: `/events`, `/bets`, `/outcomes`
* Smart contract event listener via `ethers.js`

---

## 🚀 Getting Started

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/betchain.git
cd betchain
```

### 2. Start Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

> Make sure PostgreSQL is configured via `.env`

### 3. Start Frontend

```bash
cd Frontend
npm install
npm run dev
```

> The frontend runs on `http://localhost:5173`

---

## 🦊 MetaMask Setup

To interact with the app:

1. Install [MetaMask](https://metamask.io/)
2. Add the **Sepolia Testnet** (from MetaMask settings)
3. Get test ETH from the [Sepolia faucet](https://sepoliafaucet.com/)
4. Visit [crypto-bet-zeta.vercel.app](https://crypto-bet-zeta.vercel.app/) and connect wallet

---

## 💼 Business Model

* 1–2% fee from each pool
* Token rewards (future)
* NFT trophies for top predictors (future)

---

## 🛠️ Future Enhancements

* ✅ Oracle-based event resolution (e.g., Chainlink)
* 🏅 NFT minting for top bettors
* 📱 Mobile/responsive layout improvements
* 🗳️ Governance token for platform voting

---

## 📽️ Demo Workflow

1. Deploy the contract on Sepolia
2. Create a prediction event
3. Place bets from multiple wallets
4. Close the event with the actual result
5. Claim winnings from the pool

---

## 📖 License

MIT License © 2025 Natty Metekie



