import {
  Pool,
  Participant,
  Payment,
  ParticipantBalance,
  PoolSummary,
  PoolOverallStatus,
} from '../types';
import { roundCurrency, EPSILON } from './currency';

/**
 * Calculates equal share per participant.
 * Formula: totalBudget / numberOfParticipants
 */
export function calculateEqualShare(totalBudget: number, participantCount: number): number {
  if (participantCount <= 0 || totalBudget <= 0) {
    return 0;
  }
  return roundCurrency(totalBudget / participantCount);
}

/**
 * Computes individual balances for each participant in the pool.
 *
 * Financial Invariants:
 * 1. Each participant is responsible for `equalShare`.
 * 2. `netBalance = paidOutOfPocket - equalShare`.
 * 3. A participant with netBalance < 0 is a debtor (owes money).
 * 4. A participant with netBalance > 0 is a creditor (receives money).
 * 5. A participant with netBalance == 0 is settled.
 * 6. When someone pays on behalf of another, the cash paid is credited to the payer's out-of-pocket
 *    amount, while the beneficiary's gift obligation records the advance.
 */
export function calculateBalances(
  pool: Pool | null,
  participants: Participant[],
  payments: Payment[]
): ParticipantBalance[] {
  if (!pool || participants.length === 0) {
    return [];
  }

  const equalShare = calculateEqualShare(pool.targetBudget, participants.length);

  // Map participant IDs for fast lookup
  const participantMap = new Map<string, Participant>();
  participants.forEach((p) => participantMap.set(p.id, p));

  // Initialize balance accumulators
  const outOfPocketMap = new Map<string, number>();
  const creditedPaymentsMap = new Map<string, number>();
  const coveredForOthersMap = new Map<string, number>();

  participants.forEach((p) => {
    outOfPocketMap.set(p.id, 0);
    creditedPaymentsMap.set(p.id, 0);
    coveredForOthersMap.set(p.id, 0);
  });

  // Tally all payments
  for (const payment of payments) {
    const payerId = payment.payerId;
    const beneficiaryId = payment.beneficiaryId || payerId;
    const amount = roundCurrency(payment.amount);

    if (amount <= 0) continue;

    // Out of pocket cash contributed by the payer
    if (outOfPocketMap.has(payerId)) {
      outOfPocketMap.set(payerId, (outOfPocketMap.get(payerId) || 0) + amount);
    }

    // Amount credited toward the beneficiary's share
    if (creditedPaymentsMap.has(beneficiaryId)) {
      creditedPaymentsMap.set(
        beneficiaryId,
        (creditedPaymentsMap.get(beneficiaryId) || 0) + amount
      );
    }

    // If payer paid on behalf of someone else, track advance
    if (payerId !== beneficiaryId && outOfPocketMap.has(payerId)) {
      coveredForOthersMap.set(
        payerId,
        (coveredForOthersMap.get(payerId) || 0) + amount
      );
    }
  }

  return participants.map((p) => {
    const paidOutOfPocket = roundCurrency(outOfPocketMap.get(p.id) || 0);
    const creditedPayments = roundCurrency(creditedPaymentsMap.get(p.id) || 0);
    const coveredForOthers = roundCurrency(coveredForOthersMap.get(p.id) || 0);

    const rawNet = paidOutOfPocket - equalShare;
    const netBalance = roundCurrency(rawNet);

    let status: 'settled' | 'owes' | 'gets' = 'settled';
    let amountOwed = 0;
    let amountToReceive = 0;

    if (netBalance < -EPSILON) {
      status = 'owes';
      amountOwed = Math.abs(netBalance);
    } else if (netBalance > EPSILON) {
      status = 'gets';
      amountToReceive = netBalance;
    }

    const shareRemaining = Math.max(0, roundCurrency(equalShare - creditedPayments));

    return {
      participantId: p.id,
      name: p.name,
      share: equalShare,
      paidOutOfPocket,
      creditedPayments,
      coveredForOthers,
      netBalance,
      status,
      amountOwed,
      amountToReceive,
      shareRemaining,
    };
  });
}

/**
 * Calculates high-level pool summaries, totals, percentages, and current state.
 */
export function calculatePoolSummary(
  pool: Pool | null,
  participants: Participant[],
  payments: Payment[],
  allSettlementsCompleted = false
): PoolSummary {
  if (!pool) {
    return {
      targetBudget: 0,
      totalCollected: 0,
      remainingToCollect: 0,
      excessCollected: 0,
      equalShare: 0,
      participantCount: 0,
      status: 'not_started',
      percentCollected: 0,
    };
  }

  const targetBudget = pool.targetBudget;
  const participantCount = participants.length;
  const equalShare = calculateEqualShare(targetBudget, participantCount);

  const totalCollected = roundCurrency(
    payments.reduce((sum, p) => sum + (p.amount > 0 ? p.amount : 0), 0)
  );

  const remainingToCollect = Math.max(0, roundCurrency(targetBudget - totalCollected));
  const excessCollected = Math.max(0, roundCurrency(totalCollected - targetBudget));

  const percentCollected =
    targetBudget > 0
      ? Math.min(100, Math.round((totalCollected / targetBudget) * 100))
      : 0;

  // Determine overall status
  let status: PoolOverallStatus = 'not_started';

  if (payments.length === 0 || totalCollected === 0) {
    status = 'not_started';
  } else if (totalCollected < targetBudget) {
    status = 'collecting';
  } else if (allSettlementsCompleted) {
    status = 'settled';
  } else if (totalCollected >= targetBudget) {
    status = 'ready_to_settle';
  }

  return {
    targetBudget,
    totalCollected,
    remainingToCollect,
    excessCollected,
    equalShare,
    participantCount,
    status,
    percentCollected,
  };
}
