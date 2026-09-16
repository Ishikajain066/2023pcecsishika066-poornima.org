import { describe, it, expect } from 'vitest';
import {
  calculateEqualShare,
  calculateBalances,
  calculatePoolSummary,
} from '../calculations';
import { formatINR, roundCurrency } from '../currency';
import { Pool, Participant, Payment } from '../../types';

describe('Financial Calculations & Currency Formatting', () => {
  it('formats INR properly with comma grouping and symbol without negative zero', () => {
    expect(formatINR(6000)).toBe('₹6,000');
    expect(formatINR(1250.5)).toBe('₹1,250.50');
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-0.00000001)).toBe('₹0');
    expect(formatINR(-500)).toBe('-₹500');
  });

  it('calculates equal share per person correctly', () => {
    expect(calculateEqualShare(6000, 6)).toBe(1000);
    expect(calculateEqualShare(6000, 0)).toBe(0);
    expect(calculateEqualShare(1000, 3)).toBe(333.33);
  });

  it('calculates individual balances correctly in realistic scenario', () => {
    const pool: Pool = {
      id: 'pool-1',
      name: 'Manager Gift',
      targetBudget: 6000,
      currency: 'INR',
      createdAt: '',
      updatedAt: '',
    };

    const participants: Participant[] = [
      { id: 'p1', name: 'Aarav', createdAt: '' },
      { id: 'p2', name: 'Priya', createdAt: '' },
      { id: 'p3', name: 'Rahul', createdAt: '' },
    ];

    const payments: Payment[] = [
      { id: 'pay1', payerId: 'p1', amount: 2000, date: '' }, // Aarav paid full
      { id: 'pay2', payerId: 'p2', amount: 2500, date: '' }, // Priya overpaid
      { id: 'pay3', payerId: 'p3', amount: 1500, date: '' }, // Rahul underpaid
    ];

    const balances = calculateBalances(pool, participants, payments);

    expect(balances).toHaveLength(3);

    const aarav = balances.find((b) => b.name === 'Aarav')!;
    const priya = balances.find((b) => b.name === 'Priya')!;
    const rahul = balances.find((b) => b.name === 'Rahul')!;

    // Equal share is 6000 / 3 = 2000
    expect(aarav.share).toBe(2000);
    expect(aarav.paidOutOfPocket).toBe(2000);
    expect(aarav.netBalance).toBe(0);
    expect(aarav.status).toBe('settled');

    expect(priya.share).toBe(2000);
    expect(priya.paidOutOfPocket).toBe(2500);
    expect(priya.netBalance).toBe(500);
    expect(priya.status).toBe('gets');
    expect(priya.amountToReceive).toBe(500);

    expect(rahul.share).toBe(2000);
    expect(rahul.paidOutOfPocket).toBe(1500);
    expect(rahul.netBalance).toBe(-500);
    expect(rahul.status).toBe('owes');
    expect(rahul.amountOwed).toBe(500);

    // Invariant: sum of net balances = total paid - total budget = 6000 - 6000 = 0
    const sumNet = balances.reduce((sum, b) => sum + b.netBalance, 0);
    expect(Math.abs(sumNet)).toBeLessThan(0.01);
  });

  it('correctly tracks payments made on behalf of another participant', () => {
    const pool: Pool = {
      id: 'pool-2',
      name: 'Team Gift',
      targetBudget: 2000,
      currency: 'INR',
      createdAt: '',
      updatedAt: '',
    };

    const participants: Participant[] = [
      { id: 'alice', name: 'Alice', createdAt: '' },
      { id: 'bob', name: 'Bob', createdAt: '' },
    ];

    // Alice pays 1000 for herself, and 1000 covering Bob's share
    const payments: Payment[] = [
      { id: 'pay-1', payerId: 'alice', beneficiaryId: 'alice', amount: 1000, date: '' },
      { id: 'pay-2', payerId: 'alice', beneficiaryId: 'bob', amount: 1000, date: '' },
    ];

    const balances = calculateBalances(pool, participants, payments);

    const alice = balances.find((b) => b.participantId === 'alice')!;
    const bob = balances.find((b) => b.participantId === 'bob')!;

    // Alice spent 2000 cash out of pocket
    expect(alice.paidOutOfPocket).toBe(2000);
    expect(alice.share).toBe(1000);
    expect(alice.netBalance).toBe(1000);
    expect(alice.status).toBe('gets');
    expect(alice.coveredForOthers).toBe(1000);

    // Bob spent 0 out of pocket
    expect(bob.paidOutOfPocket).toBe(0);
    expect(bob.share).toBe(1000);
    expect(bob.netBalance).toBe(-1000);
    expect(bob.status).toBe('owes');
    // But Bob's pool obligation was credited by Alice
    expect(bob.creditedPayments).toBe(1000);
    expect(bob.shareRemaining).toBe(0);
  });
});
