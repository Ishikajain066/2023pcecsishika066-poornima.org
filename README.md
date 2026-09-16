# FairShare — Group Farewell-Gift Contribution & Settlement Pool

A modern, responsive, zero-backend single-page web application designed for group contribution pools (such as a manager's farewell gift, team dinner, or shared event fund).

Built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**, FairShare eliminates the chaos of group collections by tracking who has paid, who hasn't, how much is left to collect, and calculating the mathematically minimal cash transfers needed to settle all debts fairly.

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
- **Persistent & Offline First**:
  - 100% browser `localStorage` persistence with defensive schema validation and graceful corruption recovery.
  - No external database, no API keys, and no login walls required.
- **Realistic 1-Click Demo Pool**:
  - Pre-loaded with the exact ₹6,000 / 6-person scenario from the prompt (demonstrating full, partial, overpaid, and friend-covered payments).
- **Responsive & Accessible UI**:
  - Responsive table-to-card transformation on mobile.
  - High-contrast badges with clear text indicators (never relying solely on color).
  - Semantic HTML with accessible modal dialogs and keyboard traps.

---

## Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) | Component modularity, reactive state management, and high performance |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe financial calculations, preventing runtime type coercion errors |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Instant HMR and optimized production build |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) | Clean design system, custom typography, responsive layout utilities |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, clean iconography |
| **Testing** | [Vitest](https://vitest.dev/) | Unit testing financial invariants and greedy settlement logic |
| **Persistence**| Browser `localStorage` | Instant load, zero external latency, complete user privacy |

---

## Project Structure

```
gift-pool/
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
│   │   │   └── Navbar.tsx               # App header with live status pill and actions
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
│   │   └── demoPool.ts                  # Realistic demo scenario pre-load
│   ├── types/
│   │   └── index.ts                     # TypeScript models for Pool, Participant, Payment, etc.
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── calculations.test.ts     # Invariant & balance tests
│   │   │   └── settlement.test.ts       # Greedy settlement algorithm unit tests
│   │   ├── calculations.ts              # Equal share, balances, and status derivations
│   │   ├── currency.ts                  # INR currency formatting, epsilon guard, rounding
│   │   ├── settlement.ts                # Greedy debt-settlement algorithm implementation
│   │   └── storage.ts                   # LocalStorage abstraction with schema fallback
│   ├── App.tsx                          # Core application orchestrator
│   ├── index.css                        # Tailwind directives & custom scrollbars
│   └── main.tsx                         # React entrypoint
├── index.html                           # HTML template
├── package.json                         # Dependencies and scripts
├── postcss.config.js                    # PostCSS plugins
├── tailwind.config.js                   # Tailwind theme setup
├── tsconfig.json                        # TypeScript compiler options
├── vite.config.ts                       # Vite bundling configuration
├── README.md                            # Comprehensive product and developer documentation
├── REASONING.md                         # Engineering decisions, assumptions, and trade-offs
└── AI_LOGS.md                           # AI conversation transcript documentation
```

---

## How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Launch
1. Clone the repository and navigate into the project directory:
   ```bash
   cd gift-pool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

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

When friends or colleagues pay different amounts toward a shared expense, settlement does not require every single person who owes money to pay the organiser or make individual micro-transfers to multiple people.

### The Algorithm:
1. **Net Balance Calculation**:
   For each participant $i$:
   $$\text{netBalance}_i = P_i - S_i$$
   Where $P_i$ is the total cash physically contributed by $i$, and $S_i$ is $i$'s equal share of the budget.
2. **Classification**:
   - **Debtors** ($\text{netBalance} < -\epsilon$): People who paid less than their share.
   - **Creditors** ($\text{netBalance} > \epsilon$): People who paid more than their share.
   - **Settled** ($|\text{netBalance}| \le \epsilon$): People who paid exactly their share.
3. **Greedy Matching**:
   - Sort debtors in descending order of outstanding debt.
   - Sort creditors in descending order of outstanding credit.
   - Match the current largest debtor with the current largest creditor.
   - Transfer amount $T = \min(\text{debtorAmount}, \text{creditorAmount})$.
   - Deduct $T$ from both debtor and creditor.
   - When a debtor's balance reaches 0, advance to the next debtor. When a creditor's balance reaches 0, advance to the next creditor.
   - Repeat until all balances reconcile to zero.

### Example Walkthrough (from Prompt):
- Budget = ₹6,000, 6 members, Equal share = ₹1,000 each.
- Rahul paid ₹500 $\rightarrow$ owes ₹500
- Neha paid ₹700 $\rightarrow$ owes ₹300
- Aman paid ₹1,600 $\rightarrow$ should receive ₹600
- Priya paid ₹1,200 $\rightarrow$ should receive ₹200
- Others paid ₹1,000 $\rightarrow$ settled (₹0)

**Generated Transfers:**
1. **Rahul $\rightarrow$ Aman ₹500** (Rahul is settled; Aman still needs ₹100)
2. **Neha $\rightarrow$ Aman ₹100** (Aman is fully settled; Neha still owes ₹200)
3. **Neha $\rightarrow$ Priya ₹200** (Neha is settled; Priya is fully settled)

**Result**: 3 simple transfers completely settle 4 distinct party balances.

---

## Data Persistence

All application state is saved to the browser's `localStorage` via a dedicated utility layer (`src/utils/storage.ts`):
- **Pool metadata**: Name, total target budget, currency, creation timestamps.
- **Participants**: IDs, names, color avatars.
- **Payments**: Out-of-pocket transactions, beneficiary associations, notes, dates.
- **Settlement Progress**: List of completed transfer IDs.

### Defensive Storage Design:
- **Schema Validation**: When loading, data structures are inspected to prevent corrupted objects from breaking the application.
- **Graceful Fallback**: If `localStorage` contains unparseable or outdated data, it falls back cleanly to the initial state without displaying raw JavaScript errors to the user.
- **Safe Reset**: "Reset Pool" prompts the user with a confirmation modal before clearing localStorage.

---

## Example Usage

1. **Create a Pool**: Click "Create a Pool", enter *"Manager Farewell Gift"*, and set the budget to `₹6,000`.
2. **Add Participants**: Add team members (e.g. *Aarav, Priya, Rahul, Neha, Aman, Vikram*). Equal share automatically updates to `₹1,000/person`.
3. **Record Payments**:
   - Click "Record Payment", select *Priya*, and enter `₹1,000`.
   - Select *Rahul*, and enter `₹500` (partial payment).
   - Select *Aman*, enter `₹1,600` (overpayment), and optionally note that ₹600 was fronted for a friend.
4. **Check Dashboard**:
   - See collected total, remaining amount, and percentage bar update live.
   - Use the Quick Answers dropdown to see personal balance: *"You still owe ₹500"*.
5. **Settle Up**:
   - Review the generated settlement plan under **"Simple settlement plan"**.
   - As teammates transfer funds, click **"Mark as paid"** to check off steps.
   - Click **"Copy for Team"** to paste the formatted plan directly into your WhatsApp or Slack group.

---

## Edge Cases Handled

1. **Zero Participants / Zero Budget**: Equal share safely defaults to `₹0` without `NaN` or `Infinity` divisions.
2. **Floating-Point Precision**: Currency calculations use an `EPSILON = 0.0001` tolerance and standard cent rounding, preventing `-₹0`, `₹0.0000001`, or binary floating-point glitches.
3. **Odd Splits (e.g. ₹1,000 / 3)**: Rounded safely to ₹333.33 with consistent rounding behavior.
4. **Duplicate Participant Names**: Case-insensitive duplicate check warns the user before adding duplicate names.
5. **Deleting Participant with Payments**: Protected with a warning confirmation dialog specifying how many payments are associated.
6. **Pool Budget / Member Edits**: When budget or members change, all shares and net balances automatically re-synchronize, and existing settlement transfer checks reset safely to avoid stale settlement states.
7. **Over-collection / Surplus**: When contributions exceed the target budget, the UI highlights the surplus in purple (`+₹500 over target`) and settles it through the creditor engine.

---

## Future Improvements

- **Export to CSV / PDF**: Allow organisers to download complete payment audit spreadsheets.
- **Custom Unequal Splits**: Support percentage-based or weighted contributions for interns or senior colleagues.
- **QR Code Generation**: Generate dynamic UPI payment QR codes directly inside the settlement card for 1-tap mobile settlements.
- **Multiple Concurrent Pools**: Support switching between multiple active pools (e.g. "Farewell Gift", "Friday Team Lunch").
