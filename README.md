# FairShare — Group Farewell-Gift Contribution & Settlement Pool

A modern, responsive full-stack web application designed for group contribution pools (such as a manager's farewell gift, team dinner, or shared event fund).

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and a local **SQLite** (`better-sqlite3`) database served by an **Express REST API**, FairShare eliminates the chaos of group collections by tracking who has paid, who hasn't, how much is left to collect, and calculating the mathematically minimal cash transfers needed to settle all debts fairly.

---

## Overview

When a team chips in for a collective gift or event with an agreed budget (e.g. ₹6,000 across 6 people):
- Some teammates pay their exact share.
- Some pay partial amounts.
- Some generous colleagues front extra money or pay on behalf of friends.
- Some teammates have not paid anything yet.

The organiser is repeatedly fielding the same questions:
1. *"How much do I still owe?"*
2. *"Have we collected enough yet?"*
3. *"Who has paid and who hasn't?"*
4. *"Who should pay whom so everyone lands on their fair share?"*

FairShare provides immediate, unambiguous answers to all these questions in plain Indian Rupees without requiring manual calculations.

---

## Problem Statement & Scenario

- **Goal Budget**: ₹6,000 (configurable for any pool).
- **Default Contribution Model**: Equal share per participant (`totalBudget / numberOfParticipants`).
- **Reality**: Non-uniform payments, partial payments, advance coverage on behalf of teammates, and pending balances.
- **Objective**: Provide an organiser-friendly dashboard that tracks funds in real-time, displays personal balance answers, and executes a greedy settlement algorithm to produce the fewest direct transfers.

---

## Key Features

- **Relational SQLite Database & REST API**:
  - Full local relational database (`better-sqlite3`) stored in `gift_pool.db`.
  - Atomic transactions with WAL mode and foreign key constraints on `pools`, `participants`, `payments`, and `completed_settlements`.
  - RESTful Express endpoints supporting full CRUD operations.
  - Automatic fallback to browser `localStorage` ensuring zero downtime if the server is offline.
- **Dynamic Equal Share Engine**: Automatically recalculates per-person obligations as participants join, leave, or the budget is edited.
- **Flexible Contribution Tracking**:
  - Full payments
  - Partial payments
  - Extra payments (fronting / overpaying)
  - Zero payment tracking
  - Payments made on behalf of another teammate (with clear visual audit trail)
- **Organiser "Quick Answers" Bar**:
  - High-visibility banner answering *"Have we collected enough yet?"*
  - Interactive participant switcher answering *"How much do I still owe?"* with personalized plain-English status cards (`"You still owe ₹600"`, `"You're settled"`, `"You should receive ₹300"`).
- **Greedy Minimal-Cash-Flow Settlement Algorithm**:
  - Computes exact net balances ($P_{\text{paid}} - S_{\text{share}}$).
  - Matches the largest debtor with the largest creditor iteratively to minimize pairwise transactions.
  - Interactive "Mark as paid" toggles to track real-world settlement completion.
  - Copy-to-clipboard button formatting settlement plans for instant WhatsApp or Slack sharing.
- **Participant & Payment Management**:
  - Add, edit, and delete participants with duplicate-name prevention.
  - Confirmation dialogs preventing accidental data loss when deleting participants with payment histories.
  - Searchable, filterable payment audit log with date, payer, beneficiary, and notes.
- **Realistic 1-Click Demo Pool**:
  - Pre-loaded with the exact ₹6,000 / 6-person scenario from the prompt (demonstrating full, partial, overpaid, and friend-covered payments).
- **Responsive & Accessible UI**:
  - Responsive table-to-card transformation on mobile.
  - High-contrast badges with clear text indicators (never relying solely on color).
  - Live database status indicator (`SQLite DB` / `Local Cache`).

---

## Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) | Component modularity, reactive state management, and high performance |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe financial calculations, preventing runtime type coercion errors |
| **Database** | [SQLite (`better-sqlite3`)](https://github.com/WiseLibs/better-sqlite3) | Embedded relational database with WAL mode, foreign keys, and zero config |
| **Backend API** | [Express](https://expressjs.com/) | Lightweight REST API running on port 3001 with CORS |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Instant HMR, API proxying, and optimized production build |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) | Clean design system, custom typography, responsive layout utilities |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, clean iconography |
| **Testing** | [Vitest](https://vitest.dev/) | Unit testing financial invariants and greedy settlement logic |

---

## Database Schema & Architecture

The database is stored locally in `gift_pool.db` with the following relational schema:

```sql
CREATE TABLE pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_budget REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_color TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  payer_id TEXT NOT NULL,
  beneficiary_id TEXT,
  amount REAL NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
  FOREIGN KEY (payer_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE TABLE completed_settlements (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  transfer_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
  UNIQUE(pool_id, transfer_id)
);
```

### REST API Endpoints:
- `GET /api/health` — Returns server & SQLite database health
- `GET /api/pool` — Retrieves active pool with participants, payments, and settlements
- `POST /api/pool` — Creates a new pool and initializes tables
- `PUT /api/pool` — Updates pool name and target budget
- `POST /api/participants` — Adds a participant
- `PUT /api/participants/:id` — Edits a participant name
- `DELETE /api/participants/:id` — Removes participant and cascades to payments
- `POST /api/payments` — Records a contribution
- `PUT /api/payments/:id` — Updates a contribution
- `DELETE /api/payments/:id` — Deletes a contribution
- `POST /api/settlements/toggle` — Toggles settlement completion status
- `POST /api/settlements/reset` — Resets settlement checkboxes
- `POST /api/demo` — Seeds the 6-person demo pool directly into SQLite
- `POST /api/reset` — Clears all database tables

---

## Project Structure

```
gift-pool/
├── server/
│   ├── db.ts                            # SQLite database schema, initialization & queries
│   └── index.ts                         # Express REST API server
├── src/
│   ├── components/
│   │   ├── balance/
│   │   │   └── BalanceTable.tsx         # Participant balances & status table/cards
│   │   ├── common/
│   │   │   ├── ConfirmModal.tsx         # Reusable confirmation dialog for deletions
│   │   │   ├── Modal.tsx                # Accessible dialog modal
│   │   │   └── Toast.tsx                # Toast notification system
│   │   ├── dashboard/
│   │   │   ├── CreatePoolModal.tsx      # Modal to initialize a new pool
│   │   │   ├── EditPoolModal.tsx        # Modal to modify pool name or budget
│   │   │   ├── QuickAnswersBar.tsx      # Direct answers to organiser's repeated questions
│   │   │   └── SummaryCards.tsx         # Budget, Collected, Remaining, Share & Progress bar
│   │   ├── empty/
│   │   │   └── EmptyState.tsx           # Landing page when no pool exists
│   │   ├── layout/
│   │   │   ├── Footer.tsx               # Footer with metadata
│   │   │   └── Navbar.tsx               # Header with DB status indicator & actions
│   │   ├── participants/
│   │   │   ├── ParticipantList.tsx      # Participant manager with actions
│   │   │   └── ParticipantModal.tsx     # Add/edit participant modal
│   │   ├── payments/
│   │   │   ├── PaymentFormModal.tsx     # Record/edit payments (self & on-behalf)
│   │   │   └── PaymentHistory.tsx       # Searchable payment audit log
│   │   └── settlement/
│   │       ├── SettlementItem.tsx       # Individual transfer step with "Mark as paid"
│   │       └── SettlementPanel.tsx      # Settle-up plan with WhatsApp/Slack exporter
│   ├── data/
│   │   └── demoPool.ts                  # Demo pool data constants
│   ├── services/
│   │   └── api.ts                       # REST API client with offline fallback
│   ├── types/
│   │   └── index.ts                     # TypeScript models for Pool, Participant, Payment, etc.
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── calculations.test.ts     # Invariant & balance tests
│   │   │   └── settlement.test.ts       # Greedy settlement algorithm unit tests
│   │   ├── calculations.ts              # Equal share, balances, and status derivations
│   │   ├── currency.ts                  # INR currency formatting, epsilon guard, rounding
│   │   ├── settlement.ts                # Greedy debt-settlement algorithm implementation
│   │   └── storage.ts                   # LocalStorage fallback abstraction
│   ├── App.tsx                          # Core application orchestrator
│   ├── index.css                        # Tailwind directives & custom scrollbars
│   └── main.tsx                         # React entrypoint
├── gift_pool.db                         # Local SQLite database file
├── index.html                           # HTML template
├── package.json                         # Dependencies and concurrent scripts
├── postcss.config.js                    # PostCSS plugins
├── tailwind.config.js                   # Tailwind theme setup
├── tsconfig.json                        # TypeScript compiler options
├── vite.config.ts                       # Vite configuration with API proxy
├── README.md                            # Comprehensive product and developer documentation
├── REASONING.md                         # Engineering decisions, assumptions, and trade-offs
└── AI_LOGS.md                           # AI conversation transcript documentation
```

---

## How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Launch (Single Command)
1. Clone the repository and navigate into the project directory:
   ```bash
   cd gift-pool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development environment (launches both the Express SQLite backend and the Vite frontend concurrently):
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.
   - The backend runs on `http://localhost:3001`
   - The frontend connects via `/api` proxy with live indicator `SQLite DB`

### Run Automated Tests
Execute the unit test suite verifying the calculations and settlement algorithm:
```bash
npm run test
```

### Build for Production
```bash
npm run build
```

---

## How the Settlement Algorithm Works

### The Algorithm:
1. **Net Balance Calculation**:
   $$\text{netBalance}_i = P_i - S_i$$
   Where $P_i$ is total cash physically contributed by $i$, and $S_i$ is $i$'s equal share of the budget.
2. **Classification**:
   - **Debtors** ($\text{netBalance} < -\epsilon$): People who paid less than their share.
   - **Creditors** ($\text{netBalance} > \epsilon$): People who paid more than their share.
   - **Settled** ($|\text{netBalance}| \le \epsilon$): People who paid exactly their share.
3. **Greedy Matching**:
   - Sort debtors in descending order of outstanding debt.
   - Sort creditors in descending order of outstanding credit.
   - Match the largest debtor with the largest creditor.
   - Transfer amount $T = \min(\text{debtorAmount}, \text{creditorAmount})$.
   - Deduct $T$ from both debtor and creditor.
   - Repeat until all balances reconcile to zero.

---

## Edge Cases Handled

1. **Zero Participants / Zero Budget**: Equal share safely defaults to `₹0` without `NaN` or `Infinity` divisions.
2. **Floating-Point Precision**: Currency calculations use an `EPSILON = 0.0001` tolerance, preventing `-₹0` or `₹0.0000001`.
3. **Odd Splits (e.g. ₹1,000 / 3)**: Rounded safely to ₹333.33 per person.
4. **Duplicate Participant Names**: Verified case-insensitively.
5. **Deleting Participant with Payments**: Protected with a warning confirmation dialog specifying how many payments are associated.
6. **Network / Server Outage**: Gracefully falls back to browser `localStorage` if the backend server is unreachable.
