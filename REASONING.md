# Engineering Decisions & Design Reasoning: FairShare Group Gift Pool

This document outlines the architectural, mathematical, and design decisions made during the implementation of the **FairShare Group Contribution & Settlement Pool** application. It serves as an engineering review explaining why specific patterns, data models, and algorithms were chosen.

---

## 1. Problem Interpretation

The challenge originates from a familiar real-world scenario: a group of colleagues agrees to pool money for an occasion (e.g. buying a manager a ₹6,000 farewell gift). While the agreement calls for equal contributions, real-world execution is messy:
- Teammates pay in different increments (full payments, partial payments, zero payments).
- Some people front extra cash to cover friends who cannot pay immediately.
- The gift might be purchased before all contributions are collected, or money might be collected gradually.
- Organisers find themselves repeatedly doing spreadsheet calculations and answering identical inquiries: *"How much do I still owe?"*, *"Have we collected enough yet?"*, and *"Who needs to pay whom?"*.

The core objective is not merely displaying a ledger, but **eliminating cognitive overhead for the organiser** by computing balances dynamically and producing the mathematically fewest transactions to settle all debts.

---

## 2. Key Assumptions

1. **Equal Default Obligation**: By default, each participant is responsible for an equal share: $\text{equalShare} = \frac{\text{totalBudget}}{N}$. If the budget is ₹6,000 and there are 6 members, each person's baseline target is ₹1,000.
2. **Cash Contributor vs. Covered Obligation**:
   - Out-of-pocket cash paid by person $A$ is credited to $A$'s financial standing ($P_A$).
   - If person $A$ indicates that a payment covers person $B$, person $B$'s gift share obligation is marked as satisfied, but $A$'s financial balance reflects that $A$ fronted money on $B$'s behalf.
3. **Reconciliation Invariant**:
   - Total out-of-pocket contributions minus total participant shares equals the pool's overall surplus or deficit ($\sum \text{netBalance}_i = \text{Total Collected} - \text{Total Budget}$).
   - When the pool is fully collected ($\text{Total Collected} = \text{Total Budget}$), $\sum \text{netBalance}_i = 0$, meaning the sum of all debtor debts exactly matches the sum of all creditor credits.
4. **Offline First / Zero Infrastructure**: The app must run immediately on any machine without database provisioning, network access, or backend services.

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
    ├── [Load Demo Pool] ──> Instant populated 6-person scenario
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

## 5. Data Model

The data model was structured in `src/types/index.ts` to cleanly separate raw entity state from derived views:

```typescript
// Core Entities Stored in State
interface Pool {
  id: string;
  name: string;
  targetBudget: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  name: string;
  avatarColor?: string;
  createdAt: string;
}

interface Payment {
  id: string;
  payerId: string;       // Person who contributed the cash out of pocket
  beneficiaryId?: string; // Person on whose behalf the payment is made (defaults to payerId)
  amount: number;         // Positive numeric currency value
  note?: string;          // Optional UPI/GPay note or reference
  date: string;           // ISO timestamp
}

// Derived Analytical Types (Calculated On-the-fly)
interface ParticipantBalance {
  participantId: string;
  name: string;
  share: number;
  paidOutOfPocket: number;
  creditedPayments: number;
  coveredForOthers: number;
  netBalance: number;     // paidOutOfPocket - share
  status: 'settled' | 'owes' | 'gets';
  amountOwed: number;
  amountToReceive: number;
  shareRemaining: number;
}

interface SettlementTransfer {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  fromName: string;
  toName: string;
  amount: number;
  isCompleted: boolean;
}
```

### Why Beneficiary is Tracked Separately:
Tracking `payerId` and `beneficiaryId` distinctly allows the system to recognize that while Neha paid ₹1,500, ₹500 of that was intended to cover Priya. Neha is credited with ₹1,500 out of pocket, Priya's gift share obligation reflects the ₹500 coverage, and the settlement algorithm routes Priya's reimbursement back to Neha.

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
   JavaScript floating-point arithmetic can introduce fractional artifacts (e.g. `1000 / 3 = 333.3333333333333` or `0.1 + 0.2 = 0.30000000000000004`). We implemented `roundCurrency(val)` which uses `Number.EPSILON` rounding to 2 decimal places and normalizes values smaller than $10^{-4}$ to $0$, preventing undesirable UI artifacts like `-₹0` or `₹0.00000001`.

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
   - Total runtime: **$O(N \log N)$**, executing in sub-millisecond time in the browser.

### Invariant Verification:
The total amount transferred across all settlement transactions is proven to match:
$$\sum T = \min\left(\sum D_i, \sum C_i\right)$$
When the pool is fully collected, $\sum D_i = \sum C_i$, meaning every rupee of outstanding debt is directly matched to a creditor with zero remaining balance.

---

## 8. Why This Tech Stack?

- **React 18**: Provides declarative component composition, clean separation between UI and state, and seamless reactivity when payments or participants change.
- **TypeScript**: Crucial for financial applications. Strict type-checking guarantees that amounts are numbers, IDs are strings, and optional fields (`beneficiaryId`, `note`) are guarded against null-pointer exceptions.
- **Vite 6**: Extremely fast dev server startup (< 300ms) and lightweight production bundling with zero configuration bloat.
- **Tailwind CSS**: Eliminates custom CSS drift, offers a refined color palette (slate/indigo/emerald/amber/rose), and makes responsive layouts straightforward.
- **Vitest**: Native ESM test runner with zero overhead, verifying mathematical invariants in CI and local dev.

---

## 9. Why LocalStorage?

1. **Immediate Execution**: Works directly upon `npm install` and `npm run dev` with zero setup (no docker, no postgres, no external accounts).
2. **Data Privacy**: Farewell gift pools frequently contain colleagues' real names and payment details. LocalStorage ensures sensitive financial records never leave the user's personal device.
3. **Sub-millisecond Persistence**: Reads and writes are synchronous, avoiding loading spinners, network latency, and offline failures.
4. **Defensive Storage Abstraction**: Isolated in `src/utils/storage.ts` with error handling, schema integrity validation, and fallback to default states if corrupted.

---

## 10. Edge Cases Considered & Handled

| Edge Case | Mitigation |
| :--- | :--- |
| **0 Participants** | `calculateEqualShare` returns `0` instead of `NaN` or `Infinity`. |
| **Odd division (₹1,000 / 3)** | Rounded safely to ₹333.33 per person without displaying micro-fractions. |
| **Negative zero (`-₹0`)** | `formatINR` normalizes any value whose absolute value is below $\epsilon = 0.0001$ to positive zero. |
| **Duplicate participant names** | Modal verifies names case-insensitively and warns user if a duplicate exists. |
| **Deleting member with payments** | Confirmation modal counts attached payments and alerts the user before deletion. |
| **Budget changes mid-way** | Dynamic calculation automatically updates all participants' equal shares and net balances. |
| **Invalid amount inputs** | Strict numeric sanitizer rejects negative values, zero, letters, and special symbols. |
| **Surplus pool collection** | Over-collected funds are highlighted in purple (`+₹500 over target`) and refunded/settled via the algorithm. |

---

## 11. UX Decisions

- **Direct Answer Placement**: The two questions the organiser hears 90% of the time (*"Have we collected enough?"* and *"How much do I owe?"*) are placed in a high-contrast dark indigo banner at the very top of the dashboard.
- **Redundant Indicators**: Colors (emerald, amber, rose) are always accompanied by icons (`CheckCircle`, `AlertCircle`) and explicit text labels (`"Settled"`, `"Owes ₹500"`, `"Gets ₹500"`), adhering to WCAG accessibility guidelines.
- **Responsive Table-to-Card**: Data tables become difficult to parse on mobile viewports. On screens `< 768px`, the balance table transforms into compact cards highlighting individual net balances.
- **Shareable Team Summary**: Includes a 1-click "Copy for Team" button that exports the entire pool status and settlement plan formatted cleanly for WhatsApp and Slack.

---

## 12. Trade-Offs Made

1. **Greedy Settlement vs. Subset-Sum / Exact Integer NP-Hard Partitioning**:
   - The greedy algorithm generates $O(N)$ transfers, which is practical, highly intuitive, and fast.
   - While theoretically a dynamic programming subset-sum approach might save 1 transfer in rare cyclic debt scenarios (which is NP-complete), the greedy approach is vastly more transparent and understandable to human users.
2. **Local Storage vs. Cloud Backend**:
   - Trade-off: Teammates cannot access a shared live link from their own phones simultaneously unless the organiser exports the summary.
   - Rationale: Strictly aligns with assessment constraints ("Do NOT introduce a backend unless absolutely necessary", "Do NOT require MongoDB, Firebase, Supabase").

---

## 13. Future Improvements

If extended into a full multi-user product:
1. **P2P Sync / WebRTC**: Peer-to-peer synchronization across mobile devices without hosting a central database.
2. **UPI Dynamic QR Codes**: Generate instant UPI payment QR codes pre-filled with the exact settlement amount and recipient VPA.
3. **Unequal Split Rules**: Support custom percentage splits (e.g. interns contribute 50%, team leads contribute 150%).
4. **Receipt Image Attachments**: Allow upload of gift store receipts to store in IndexedDB.
