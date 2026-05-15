# ⚡ PayxMint — Enterprise UPI Gateway Ecosystem

PayxMint is a high-performance, institutional-grade UPI payment aggregation platform. It enables merchants to accept UPI payments via automated VPA (Virtual Payment Address) management, featuring a real-time risk engine, automated settlement custody, and headless bot-driven verification.

---

## 🚀 Quick Start for Developers

### 1. Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **Database**: PostgreSQL (Recommended for production) or SQLite (Dev only)
- **Bots**: Playwright/Chromium dependencies for headless automation

### 2. Installation
```bash
git clone https://github.com/your-repo/payxmint.git
cd payxmint
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: Your Postgres/SQLite connection string
- `NEXTAUTH_SECRET`: Secret for session encryption
- `ENCRYPTION_KEY`: 32-character key for sensitive VPA credentials

### 4. Database Initialization
```bash
npx prisma db push
npx prisma db seed # Optional: Initialize admin accounts
```

### 5. Running the System
```bash
# Start Web Dashboard & API
npm run dev

# Start Bot Daemon (via PM2 in production)
npx pm2 start ecosystem.config.js
```

---

## 🏗️ Core Architecture

The system is built on four primary pillars:

### 1. Verification Engine (Headless Bots)
Headless Playwright scripts (`src/bot/`) mimic real user behavior to scrape Google Pay/Paytm transactions. These bots push data to the **Matching Engine** via an internal bridge.

### 2. Smart Matching Engine
Located in `src/services/matching/MatchingEngine.ts`. It uses a combination of:
- **Amount Exact Match**: Matches the transaction amount.
- **Note/Reference Matching**: Scans transaction notes for the unique `paymentToken`.
- **Idempotency Locks**: Ensures one transaction can only be credited to one intent.

### 3. Risk & Routing Engine
`src/services/routing/GatewayRouter.ts` handles intelligent traffic distribution:
- **Tiered Routing**: High-Risk users get routed to "Burner" VPAs; VIP users get "Stable" VPAs.
- **Dynamic Limits**: Enforces 100 transaction hard caps per VPA per day to prevent bank freezing.
- **Cooldowns**: Automatically disables VPAs showing high failure rates.

### 4. Settlement Custody (T+1)
Unlike traditional pre-paid models, PayxMint uses a custody model:
- **Unsettled Balance**: Funds are held until the T+1 batch processor runs.
- **Hold Logic**: High-risk transactions are flagged and held for manual review.
- **Automated Payouts**: Calculates net payouts minus 2% merchant fees and agent commissions.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Prisma ORM](https://www.prisma.io/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Automation**: [Playwright](https://playwright.dev/)
- **Analytics**: Custom HSL-based dashboard engine

---

## 📚 Detailed Documentation

- [Internal Architecture & Logic](./ARCHITECTURE.md)
- [API Reference (Merchant & Admin)](./API_REFERENCE.md)
- [Bot Operations & Maintenance](./BOT_GUIDE.md)

---

## 🔒 Security

- **Webhook Signing**: All merchant callbacks are signed with HMAC-SHA256.
- **IP Whitelisting**: Admin and Merchant panels can be restricted to specific CIDR ranges.
- **Encrypted VPAs**: Bot credentials are encrypted at rest using AES-256-GCM.

---

## ⚖️ License
Proprietary — All Rights Reserved.
