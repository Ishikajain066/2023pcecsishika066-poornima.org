import { describe, it, expect } from 'vitest';
import { calculateSettlements } from '../settlement';
import { ParticipantBalance } from '../../types';

describe('Greedy Debt Settlement Algorithm', () => {
  it('matches prompt Section 16 scenario with minimal transactions', () => {
    // Rahul owes ₹500, Neha owes ₹300, Aman gets ₹600, Priya gets ₹200
    const balances: ParticipantBalance[] = [
      {
        participantId: 'p-rahul',
        name: 'Rahul',
        share: 1000,
        paidOutOfPocket: 500,
        creditedPayments: 500,
        coveredForOthers: 0,
        netBalance: -500,
        status: 'owes',
        amountOwed: 500,
        amountToReceive: 0,
        shareRemaining: 500,
      },
      {
        participantId: 'p-neha',
        name: 'Neha',
        share: 1000,
        paidOutOfPocket: 700,
        creditedPayments: 700,
        coveredForOthers: 0,
        netBalance: -300,
        status: 'owes',
        amountOwed: 300,
        amountToReceive: 0,
        shareRemaining: 300,
      },
      {
        participantId: 'p-aman',
        name: 'Aman',
        share: 1000,
        paidOutOfPocket: 1600,
        creditedPayments: 1000,
        coveredForOthers: 600,
        netBalance: 600,
        status: 'gets',
        amountOwed: 0,
        amountToReceive: 600,
        shareRemaining: 0,
      },
      {
        participantId: 'p-priya',
        name: 'Priya',
        share: 1000,
        paidOutOfPocket: 1200,
        creditedPayments: 1000,
        coveredForOthers: 200,
        netBalance: 200,
        status: 'gets',
        amountOwed: 0,
        amountToReceive: 200,
        shareRemaining: 0,
      },
    ];

    const settlements = calculateSettlements(balances);

    // Expected 3 transfers:
    // 1. Rahul pays Aman ₹500
    // 2. Neha pays Aman ₹100
    // 3. Neha pays Priya ₹200
    expect(settlements).toHaveLength(3);

    expect(settlements[0].fromName).toBe('Rahul');
    expect(settlements[0].toName).toBe('Aman');
    expect(settlements[0].amount).toBe(500);

    expect(settlements[1].fromName).toBe('Neha');
    expect(settlements[1].toName).toBe('Aman');
    expect(settlements[1].amount).toBe(100);

    expect(settlements[2].fromName).toBe('Neha');
    expect(settlements[2].toName).toBe('Priya');
    expect(settlements[2].amount).toBe(200);

    // Financial invariant: Total transferred equals total debt
    const totalTransferred = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalTransferred).toBe(800);
  });

  it('generates zero transfers when everyone has paid their exact share', () => {
    const balances: ParticipantBalance[] = [
      {
        participantId: 'p1',
        name: 'Alice',
        share: 1000,
        paidOutOfPocket: 1000,
        creditedPayments: 1000,
        coveredForOthers: 0,
        netBalance: 0,
        status: 'settled',
        amountOwed: 0,
        amountToReceive: 0,
        shareRemaining: 0,
      },
      {
        participantId: 'p2',
        name: 'Bob',
        share: 1000,
        paidOutOfPocket: 1000,
        creditedPayments: 1000,
        coveredForOthers: 0,
        netBalance: 0,
        status: 'settled',
        amountOwed: 0,
        amountToReceive: 0,
        shareRemaining: 0,
      },
    ];

    const settlements = calculateSettlements(balances);
    expect(settlements).toHaveLength(0);
  });

  it('handles simple 2-person debt transfer', () => {
    const balances: ParticipantBalance[] = [
      {
        participantId: 'p1',
        name: 'Debtor',
        share: 500,
        paidOutOfPocket: 0,
        creditedPayments: 0,
        coveredForOthers: 0,
        netBalance: -500,
        status: 'owes',
        amountOwed: 500,
        amountToReceive: 0,
        shareRemaining: 500,
      },
      {
        participantId: 'p2',
        name: 'Creditor',
        share: 500,
        paidOutOfPocket: 1000,
        creditedPayments: 500,
        coveredForOthers: 500,
        netBalance: 500,
        status: 'gets',
        amountOwed: 0,
        amountToReceive: 500,
        shareRemaining: 0,
      },
    ];

    const settlements = calculateSettlements(balances);
    expect(settlements).toHaveLength(1);
    expect(settlements[0].fromName).toBe('Debtor');
    expect(settlements[0].toName).toBe('Creditor');
    expect(settlements[0].amount).toBe(500);
  });
});
