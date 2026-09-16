import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'gift_pool.db');

export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize relational schema
db.exec(`
  CREATE TABLE IF NOT EXISTS pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_budget REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    pool_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_color TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
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

  CREATE TABLE IF NOT EXISTS completed_settlements (
    id TEXT PRIMARY KEY,
    pool_id TEXT NOT NULL,
    transfer_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
    UNIQUE(pool_id, transfer_id)
  );

  CREATE INDEX IF NOT EXISTS idx_participants_pool ON participants(pool_id);
  CREATE INDEX IF NOT EXISTS idx_payments_pool ON payments(pool_id);
  CREATE INDEX IF NOT EXISTS idx_settlements_pool ON completed_settlements(pool_id);
`);

export interface DbPool {
  id: string;
  name: string;
  targetBudget: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbParticipant {
  id: string;
  name: string;
  avatarColor?: string;
  createdAt: string;
}

export interface DbPayment {
  id: string;
  payerId: string;
  beneficiaryId?: string;
  amount: number;
  note?: string;
  date: string;
}

export function getActivePoolState() {
  const poolRow = db.prepare(`SELECT * FROM pools ORDER BY created_at DESC LIMIT 1`).get() as any;
  if (!poolRow) {
    return {
      pool: null,
      participants: [],
      payments: [],
      completedSettlementIds: [],
    };
  }

  const pool: DbPool = {
    id: poolRow.id,
    name: poolRow.name,
    targetBudget: Number(poolRow.target_budget),
    currency: poolRow.currency,
    createdAt: poolRow.created_at,
    updatedAt: poolRow.updated_at,
  };

  const participantRows = db
    .prepare(`SELECT * FROM participants WHERE pool_id = ? ORDER BY created_at ASC`)
    .all(pool.id) as any[];

  const participants: DbParticipant[] = participantRows.map((r) => ({
    id: r.id,
    name: r.name,
    avatarColor: r.avatar_color,
    createdAt: r.created_at,
  }));

  const paymentRows = db
    .prepare(`SELECT * FROM payments WHERE pool_id = ? ORDER BY date DESC`)
    .all(pool.id) as any[];

  const payments: DbPayment[] = paymentRows.map((r) => ({
    id: r.id,
    payerId: r.payer_id,
    beneficiaryId: r.beneficiary_id || undefined,
    amount: Number(r.amount),
    note: r.note || undefined,
    date: r.date,
  }));

  const settlementRows = db
    .prepare(`SELECT transfer_id FROM completed_settlements WHERE pool_id = ?`)
    .all(pool.id) as any[];

  const completedSettlementIds = settlementRows.map((r) => r.transfer_id);

  return {
    pool,
    participants,
    payments,
    completedSettlementIds,
  };
}

export function createPool(name: string, budget: number) {
  const wipe = db.transaction(() => {
    db.prepare(`DELETE FROM completed_settlements`).run();
    db.prepare(`DELETE FROM payments`).run();
    db.prepare(`DELETE FROM participants`).run();
    db.prepare(`DELETE FROM pools`).run();

    const poolId = `pool-${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO pools (id, name, target_budget, currency, created_at, updated_at)
      VALUES (?, ?, ?, 'INR', ?, ?)
    `).run(poolId, name, budget, now, now);

    return poolId;
  });

  wipe();
  return getActivePoolState();
}

export function updatePool(poolId: string, name: string, budget: number) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE pools SET name = ?, target_budget = ?, updated_at = ? WHERE id = ?
  `).run(name, budget, now, poolId);
  return getActivePoolState();
}

export function addParticipant(poolId: string, name: string, avatarColor?: string) {
  const id = `part-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO participants (id, pool_id, name, avatar_color, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, poolId, name, avatarColor || '#6366f1', now);
  return getActivePoolState();
}

export function updateParticipant(participantId: string, name: string) {
  db.prepare(`UPDATE participants SET name = ? WHERE id = ?`).run(name, participantId);
  return getActivePoolState();
}

export function deleteParticipant(participantId: string) {
  const txn = db.transaction(() => {
    db.prepare(`DELETE FROM payments WHERE payer_id = ? OR beneficiary_id = ?`).run(
      participantId,
      participantId
    );
    db.prepare(`DELETE FROM participants WHERE id = ?`).run(participantId);
    db.prepare(`DELETE FROM completed_settlements`).run();
  });
  txn();
  return getActivePoolState();
}

export function addPayment(
  poolId: string,
  payerId: string,
  beneficiaryId: string | undefined,
  amount: number,
  note: string | undefined,
  date: string
) {
  const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const txn = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (id, pool_id, payer_id, beneficiary_id, amount, note, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, poolId, payerId, beneficiaryId || payerId, amount, note || null, date);
    db.prepare(`DELETE FROM completed_settlements WHERE pool_id = ?`).run(poolId);
  });
  txn();
  return getActivePoolState();
}

export function updatePayment(
  paymentId: string,
  payerId: string,
  beneficiaryId: string | undefined,
  amount: number,
  note: string | undefined,
  date: string
) {
  const txn = db.transaction(() => {
    const pay = db.prepare(`SELECT pool_id FROM payments WHERE id = ?`).get(paymentId) as any;
    db.prepare(`
      UPDATE payments SET payer_id = ?, beneficiary_id = ?, amount = ?, note = ?, date = ?
      WHERE id = ?
    `).run(payerId, beneficiaryId || payerId, amount, note || null, date, paymentId);
    if (pay?.pool_id) {
      db.prepare(`DELETE FROM completed_settlements WHERE pool_id = ?`).run(pay.pool_id);
    }
  });
  txn();
  return getActivePoolState();
}

export function deletePayment(paymentId: string) {
  const txn = db.transaction(() => {
    const pay = db.prepare(`SELECT pool_id FROM payments WHERE id = ?`).get(paymentId) as any;
    db.prepare(`DELETE FROM payments WHERE id = ?`).run(paymentId);
    if (pay?.pool_id) {
      db.prepare(`DELETE FROM completed_settlements WHERE pool_id = ?`).run(pay.pool_id);
    }
  });
  txn();
  return getActivePoolState();
}

export function toggleSettlement(poolId: string, transferId: string) {
  const existing = db
    .prepare(`SELECT id FROM completed_settlements WHERE pool_id = ? AND transfer_id = ?`)
    .get(poolId, transferId);

  if (existing) {
    db.prepare(`DELETE FROM completed_settlements WHERE pool_id = ? AND transfer_id = ?`).run(
      poolId,
      transferId
    );
  } else {
    const id = `settle-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    db.prepare(`
      INSERT INTO completed_settlements (id, pool_id, transfer_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, poolId, transferId, new Date().toISOString());
  }
  return getActivePoolState();
}

export function resetSettlements(poolId: string) {
  db.prepare(`DELETE FROM completed_settlements WHERE pool_id = ?`).run(poolId);
  return getActivePoolState();
}

export function resetAllData() {
  const txn = db.transaction(() => {
    db.prepare(`DELETE FROM completed_settlements`).run();
    db.prepare(`DELETE FROM payments`).run();
    db.prepare(`DELETE FROM participants`).run();
    db.prepare(`DELETE FROM pools`).run();
  });
  txn();
  return getActivePoolState();
}

export function seedDemoPool() {
  const txn = db.transaction(() => {
    db.prepare(`DELETE FROM completed_settlements`).run();
    db.prepare(`DELETE FROM payments`).run();
    db.prepare(`DELETE FROM participants`).run();
    db.prepare(`DELETE FROM pools`).run();

    const poolId = 'pool-farewell-demo';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pools (id, name, target_budget, currency, created_at, updated_at)
      VALUES (?, 'Manager Farewell Gift', 6000, 'INR', ?, ?)
    `).run(poolId, now, now);

    const participants = [
      { id: 'part-1', name: 'Aarav', color: '#4f46e5' },
      { id: 'part-2', name: 'Priya', color: '#059669' },
      { id: 'part-3', name: 'Rahul', color: '#d97706' },
      { id: 'part-4', name: 'Neha', color: '#dc2626' },
      { id: 'part-5', name: 'Aman', color: '#7c3aed' },
      { id: 'part-6', name: 'Vikram', color: '#0284c7' },
    ];

    for (const p of participants) {
      db.prepare(`
        INSERT INTO participants (id, pool_id, name, avatar_color, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(p.id, poolId, p.name, p.color, now);
    }

    const payments = [
      { id: 'pay-1', payer: 'part-1', forP: 'part-1', amount: 1000, note: 'Initial contribution via GPay' },
      { id: 'pay-2', payer: 'part-2', forP: 'part-2', amount: 1000, note: 'Full share paid via UPI' },
      { id: 'pay-3', payer: 'part-3', forP: 'part-3', amount: 500, note: 'Partial payment - will transfer rest soon' },
      { id: 'pay-4', payer: 'part-4', forP: 'part-4', amount: 700, note: 'Partial share via Paytm' },
      { id: 'pay-5', payer: 'part-5', forP: 'part-5', amount: 1000, note: 'My equal share' },
      { id: 'pay-6', payer: 'part-5', forP: 'part-3', amount: 600, note: 'Covered part of Rahul’s share in advance' },
      { id: 'pay-7', payer: 'part-6', forP: 'part-6', amount: 1200, note: 'Fronted extra ₹200 for gift wrapping/card' },
    ];

    for (const pay of payments) {
      db.prepare(`
        INSERT INTO payments (id, pool_id, payer_id, beneficiary_id, amount, note, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(pay.id, poolId, pay.payer, pay.forP, pay.amount, pay.note, now);
    }
  });

  txn();
  return getActivePoolState();
}
