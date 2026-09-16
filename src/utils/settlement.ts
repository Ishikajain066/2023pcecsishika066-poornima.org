import { ParticipantBalance, SettlementTransfer } from '../types';
import { roundCurrency, EPSILON } from './currency';

interface BalanceNode {
  participantId: string;
  name: string;
  amount: number; // positive number representing either debt or credit
}

/**
 * Greedy Debt Settlement Algorithm
 *
 * 1. Separates participants into debtors (netBalance < -EPSILON) and creditors (netBalance > EPSILON).
 * 2. Sorts debtors descending by debt magnitude, and creditors descending by credit magnitude.
 * 3. Greedily pairs the largest current debtor with the largest current creditor.
 * 4. Transfer amount = min(debtorAmount, creditorAmount).
 * 5. Deducts transfer amount from both.
 * 6. Advances pointers/continues until all mutual debts and credits are reconciled to within EPSILON.
 *
 * Time Complexity: O(N log N) where N is number of participants.
 * Minimizes unnecessary pairwise transactions while producing human-friendly settlement instructions.
 */
export function calculateSettlements(
  balances: ParticipantBalance[],
  completedSettlementIds: string[] = []
): SettlementTransfer[] {
  const debtors: BalanceNode[] = [];
  const creditors: BalanceNode[] = [];

  for (const b of balances) {
    const net = roundCurrency(b.netBalance);
    if (net < -EPSILON) {
      debtors.push({
        participantId: b.participantId,
        name: b.name,
        amount: Math.abs(net),
      });
    } else if (net > EPSILON) {
      creditors.push({
        participantId: b.participantId,
        name: b.name,
        amount: net,
      });
    }
  }

  // Sort descending by outstanding amount to minimize transactions
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let dIdx = 0;
  let cIdx = 0;
  let stepIndex = 1;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (debtor.amount < EPSILON) {
      dIdx++;
      continue;
    }
    if (creditor.amount < EPSILON) {
      cIdx++;
      continue;
    }

    const transferAmount = roundCurrency(Math.min(debtor.amount, creditor.amount));

    if (transferAmount > EPSILON) {
      const transferId = `transfer-${debtor.participantId}-${creditor.participantId}-${stepIndex}`;
      const isCompleted = completedSettlementIds.includes(transferId);

      transfers.push({
        id: transferId,
        fromParticipantId: debtor.participantId,
        toParticipantId: creditor.participantId,
        fromName: debtor.name,
        toName: creditor.name,
        amount: transferAmount,
        isCompleted,
      });

      debtor.amount = roundCurrency(debtor.amount - transferAmount);
      creditor.amount = roundCurrency(creditor.amount - transferAmount);
      stepIndex++;
    }

    if (debtor.amount < EPSILON) {
      dIdx++;
    }
    if (creditor.amount < EPSILON) {
      cIdx++;
    }
  }

  return transfers;
}

/**
 * Validates that all settlements generated reconcile properly.
 */
export function areAllSettlementsCompleted(transfers: SettlementTransfer[]): boolean {
  if (transfers.length === 0) return true;
  return transfers.every((t) => t.isCompleted);
}
