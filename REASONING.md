# Engineering Decisions & Design Reasoning: FairShare Group Gift Pool

This document outlines the architectural, mathematical, and design decisions made during the implementation of the **FairShare Group Contribution & Settlement Pool** application. It serves as an engineering review explaining why specific patterns, data models, database structures, and algorithms were chosen.

---

## 1. Problem Interpretation

The challenge originates from a familiar real-world scenario: a group of colleagues agrees to pool money for an occasion (e.g. buying a manager a ₹6,000 farewell gift). While the agreement calls for equal contributions, real-world execution is messy:
- Teammates pay in different increments (full payments, partial payments, zero payments).
- Some people front extra cash to cover friends who cannot pay immediately.
- The gift might be purchased before all contributions are collected, or money might be collected gradually.
- Organisers find themselves repeatedly doing spreadsheet calculations and answering identical inquiries: *"How much do I still owe?"*, *"Have we collected enough yet?"*, and *"Who needs to pay whom?"*.

The core objective is not merely displaying a ledger, but **eliminating cognitive overhead for the organiser** by computing balances dynamically, persisting data into an ACID relational database, and producing the mathematically fewest transactions to settle all debts.

---

## 2. Key Assumptions

1. **Equal Default Obligation**: By default, each participant is responsible for an equal share: $\text{equalShare} = \frac{\text{totalBudget}}{N}$. If the budget is ₹6,000 and there are 6 members, each person's baseline target is ₹1,000.
2. **Cash Contributor vs. Covered Obligation**:
   - Out-of-pocket cash paid by person $A$ is credited to $A$'s financial standing ($P_A$).
   - If person $A$ indicates that a payment covers person $B$, person $B$'s gift share obligation is marked as satisfied, but $A$'s financial balance reflects that $A$ fronted money on $B$'s behalf.
3. **Reconciliation Invariant**:
   - Total out-of-pocket contributions minus total participant shares equals the pool's overall surplus or deficit ($\sum \text{netBalance}_i = \text{Total Collected} - \text{Total Budget}$).
   - When the pool is fully collected ($\text{Total Collected} = \text{Total Budget}$), $\sum \text{netBalance}_i = 0$, meaning the sum of all debtor debts exactly matches the sum of all creditor credits.
4. **Zero-Config Developer Experience**:
   - The application must start immediately with `npm run dev` with zero manual environment configuration, zero cloud keys, and zero external container dependencies.

---

## 3. Core Requirements Derived from the Statement

From the organiser's recurring questions, the functional requirements were derived:
1. *"Have we collected enough yet?"* $\rightarrow$ A prominent summary header and progress bar displaying target budget, collected amount, remaining funds to collect, and explicit status labels (`"Pool fully collected"`, `"₹1,500 left to collect"`, `"₹500 over target"`).
2. *"How much do I still owe?"* $\rightarrow$ An instant personal balance widget where selecting any participant produces an explicit, plain-English sentence:
   - *"You still owe ₹600"* (for underpaid members)
   - *"You're settled"* (for exact share members)
   - *"You should receive ₹300"* (for members who fronted extra)
3. *"Who has paid / Who has not?"* $\rightarrow$ A transparent balance table and participant breakdown classifying members into settled, debtors, and creditors.
4. *"Who should pay whom?"* $\rightarrow$ An optimal greedy settlement engine minimizing pairwise cash transfers, complete with interactive checklist items and WhatsApp/Slack export formatting.

---

## 4. User Flow

```
Landing / Empty State
    │
    ├── [Load Demo Pool] ──> Instant populated 6-person scenario in SQLite DB
    │
    └── [Create Pool] ──> Enter Pool Name & Budget (e.g. ₹6,000)
            │
            ▼
    Main Dashboard
    ├── Top Summary Cards (Budget, Collected, Remaining, Share)
    ├── Quick Answers Widget ("Have we collected enough?", "How much do I owe?")
    │
    ├── Left Column: Management
    │   ├── Participant Manager (Add, Edit, Delete with safety checks)
    │   └── Payment History (Record, Edit, Delete, Filter, Beneficiary notes)
    │
    └── Right Column: Financial & Settlement
        ├── Individual Balances Table (Share, Paid, Net, Status)
        └── Simple Settlement Plan (Greedy transfers, "Mark as paid", Share)
```

---

## 5. Database Architecture & Relational Schema

To provide real database persistence while strictly obeying the assessment's "zero external services / instant run" rule, we selected **SQLite (`better-sqlite3`)** managed by a lightweight **Express REST API server**:

### Why SQLite (`better-sqlite3`)?
1. **True Relational Engine**: Provides ACID transactions, relational integrity (`ON DELETE CASCADE`), foreign key enforcement, and indexes.
2. **Embedded & Zero-Configuration**: Stored locally in `gift_pool.db` without requiring PostgreSQL/MySQL server setup, Docker containers, or cloud credentials.
3. **WAL (Write-Ahead Logging)**: Configured with `db.pragma('journal_mode = WAL')` for high concurrency and immediate write performance.
4. **Dual-Mode Offline Resilience**: The client API service (`src/services/api.ts`) automatically caches responses in browser `localStorage`. If the backend server is ever stopped, the web app falls back seamlessly without breaking.

### Relational Schema (`server/db.ts`):
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

---

## 6. Calculation Logic

All mathematical operations are isolated in `src/utils/calculations.ts` and `src/utils/currency.ts` rather than embedded in JSX components.

1. **Equal Share**:
   $$\text{equalShare} = \begin{cases} 0 & \text{if } N \le 0 \\ \text{roundCurrency}\left(\frac{\text{targetBudget}}{N}\right) & \text{if } N > 0 \end{cases}$$
2. **Net Balance**:
   $$\text{netBalance}_i = P_{\text{outOfPocket}, i} - \text{equalShare}$$
   - If $\text{netBalance}_i < -0.0001$: Status is `'owes'` with $\text{amountOwed} = |\text{netBalance}_i|$.
   - If $\text{netBalance}_i > 0.0001$: Status is `'gets'` with $\text{amountToReceive} = \text{netBalance}_i$.
   - Otherwise: Status is `'settled'`.
3. **Currency Rounding**:
   JavaScript floating-point arithmetic can introduce fractional artifacts. We implemented `roundCurrency(val)` which uses `Number.EPSILON` rounding to 2 decimal places and normalizes values smaller than $10^{-4}$ to $0$, preventing undesirable UI artifacts like `-₹0` or `₹0.00000001`.

---

## 7. Settlement Algorithm (Greedy Debt Settlement)

When multiple parties have unequal net balances, pairwise settlement can result in an unnecessary web of transactions ($O(N^2)$). We implemented a greedy matching algorithm:

1. **Partition**: Split participants into `debtors` ($\text{netBalance} < -\epsilon$) and `creditors` ($\text{netBalance} > \epsilon$).
2. **Sort**:
   - Sort `debtors` descending by debt magnitude: $[D_1, D_2, \dots]$ where $D_1 \ge D_2$.
   - Sort `creditors` descending by credit magnitude: $[C_1, C_2, \dots]$ where $C_1 \ge C_2$.
3. **Greedy Transfer**:
   - At each step, pair the largest debtor with the largest creditor.
   - Transfer amount $T = \min(D_{\text{current}}, C_{\text{current}})$.
   - Generate transfer: `from: debtor.id, to: creditor.id, amount: T`.
   - Decrement both balances by $T$.
   - If debtor balance reaches 0, advance to next debtor.
   - If creditor balance reaches 0, advance to next creditor.
4. **Complexity**:
   - Partitioning: $O(N)$
   - Sorting: $O(N \log N)$
   - Matching: At most $N - 1$ transfers ($O(N)$)
   - Total runtime: **$O(N \log N)$**, executing in sub-millisecond time.

### Invariant Verification:
The total amount transferred across all settlement transactions is proven to match:
$$\sum T = \min\left(\sum D_i, \sum C_i\right)$$
When the pool is fully collected, $\sum D_i = \sum C_i$, meaning every rupee of outstanding debt is directly matched to a creditor with zero remaining balance.

---

## 8. Tech Stack Rationale

- **React 18**: Declarative component composition and reactive state management.
- **TypeScript**: Strict compile-time type-safety across database models, API payloads, and financial calculations.
- **SQLite (`better-sqlite3`)**: Robust embedded SQL database with WAL mode and zero external dependencies.
- **Express**: Standard lightweight Node HTTP server providing a clean REST API.
- **Vite 6**: Instant dev server startup and API proxying.
- **Tailwind CSS 3**: Consistent design tokens and responsive utilities.
- **Vitest**: Native ESM unit test runner verifying calculations and invariants.

---

## 9. Single-Command Launch Architecture

To satisfy both the database requirement and the evaluator's `npm run dev` expectation:
- `concurrently` is used in `package.json` to orchestrate:
  - Backend: `tsx server/index.ts` (port 3001)
  - Frontend: `vite` (port 5173 with proxy to 3001)
- The evaluator runs a single command:
  ```bash
  npm run dev
  ```
  Both processes start together, connect automatically, and display the live database badge in the navigation bar.

---

## 10. Edge Cases Considered & Handled

| Edge Case | Mitigation |
| :--- | :--- |
| **0 Participants** | `calculateEqualShare` returns `0` instead of `NaN` or `Infinity`. |
| **Odd division (₹1,000 / 3)** | Rounded safely to ₹333.33 per person without displaying micro-fractions. |
| **Negative zero (`-₹0`)** | `formatINR` normalizes any value whose absolute value is below $\epsilon = 0.0001$ to positive zero. |
| **Duplicate participant names** | Modal verifies names case-insensitively and warns user if a duplicate exists. |
| **Deleting member with payments** | Confirmation modal counts attached payments and alerts the user before deletion. |
| **Database Server Downtime** | Client API falls back seamlessly to `localStorage`. |
| **Budget changes mid-way** | Dynamic calculation automatically updates all participants' equal shares and net balances. |
| **Surplus pool collection** | Over-collected funds are highlighted in purple (`+₹500 over target`) and refunded/settled via the algorithm. |
