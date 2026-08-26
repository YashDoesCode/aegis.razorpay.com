# Razorpay Aegis

> Autonomous dispute defense and contest automation layer built on top of Razorpay's Disputes API.

**Aegis** intercepts incoming payment disputes (focusing on UPI reason codes first), computes dispute winnability scores, orchestrates required evidentiary documents according to Razorpay reason-code specifications, drafts authoritative rebuttals using LLMs, and submits contests to Razorpay's API in draft mode.

---

## 🔒 Locked Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Motion & Animations**: Framer Motion (`framer-motion`) for subtle drawer/sheet transitions, row hovers, and score-badge reveals
- **Font**: Inter loaded via `next/font/google` (Google Fonts)
- **Database**: SQLite via Prisma ORM
- **Razorpay SDK**: Official `razorpay` Node SDK (`npm i razorpay`), strictly server-side
- **LLM Engine**: OpenAI-compatible SDK (`openai`), server-side only
- **Hosting & Deployment**: Vercel (Next.js native host)
- **Monitoring**: Sentry optional (deferred post-prototype)
- **Architecture**: Single repo, single app (non-monorepo)

---

## 📁 Project Architecture & Directory Layout

```
aegis.razorpay.com/
├── prisma/
│   ├── schema.prisma       # SQLite schema and migration definitions
│   ├── dev.db              # Local SQLite database
│   └── migrations/         # Prisma migration history
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/     # Health check endpoint (/api/health)
│   │   ├── disputes/       # Disputes workspace page (/disputes)
│   │   ├── globals.css     # Tailwind v4 theme variables & Razorpay brand tokens
│   │   ├── layout.tsx      # Root layout with Inter font & providers
│   │   └── page.tsx        # Entrypoint (redirects to /disputes)
│   ├── components/
│   │   ├── dashboard/      # Razorpay merchant shell (sidebar, topbar, footer)
│   │   └── ui/             # shadcn/ui components (button, card, table, badge, etc.)
│   ├── lib/
│   │   ├── razorpay.ts     # Official Razorpay SDK client singleton
│   │   ├── prisma.ts       # Prisma Client singleton
│   │   └── utils.ts        # shadcn class merging utilities
│   └── data/               # Seed data & static constants (to be populated)
├── .env.example            # Template for environment variables
├── .env                    # Local environment variables (git-ignored)
└── README.md
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and provide your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Exposure |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Merchant API Key ID | Server-side only |
| `RAZORPAY_KEY_SECRET` | Razorpay Merchant API Secret Key | Server-side only |
| `OPENAI_API_KEY` | OpenAI API Key for rebuttal drafting & scoring | Server-side only |
| `DATABASE_URL` | SQLite database connection string (`file:./dev.db`) | Server-side only |

> **Security Rule**: All secrets and SDK calls remain strictly server-side (API Routes / Server Actions). Never expose secrets to client-side bundles.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
```bash
npx prisma migrate dev
```

### 3. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/disputes](http://localhost:3000/disputes) to view the merchant dashboard shell.

### 4. Health Check
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "ok": true,
  "timestamp": "2026-08-26T...",
  "service": "razorpay-aegis"
}
```

---

## 🎨 Theme & Motion Tokens

Razorpay brand colors are configured as CSS variables and Tailwind tokens:
- `rp-navy`: `#0c2340` (Razorpay dark navigation surface)
- `rp-blue`: `#0b72e7` (Razorpay action blue)
- `rp-green`: `#10b981` (Dispute won / success indicator)
- `rp-red`: `#ef4444` (Dispute open / high-risk warning)
- `rp-border`: `#e2e8f0` (Subdued border grey)

Motion guidelines:
- Subtle ease-out transitions (`0.15s - 0.25s`) matching Razorpay dashboard feel.

---

## ⚖️ Hackathon Disclaimer
*Hackathon prototype — not an official Razorpay product.*
