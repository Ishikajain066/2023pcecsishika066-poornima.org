export interface Pool {
  id: string;
  name: string;
  targetBudget: number;
  currency: string; // e.g. 'INR'
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface Participant {
  id: string;
  name: string;
  avatarColor?: string; // hex or tailwind color class
  createdAt: string;
}

export interface Payment {
  id: string;
  payerId: string; // ID of the person who actually paid cash out of pocket
  beneficiaryId?: string; // Optional: ID of the person on whose behalf the payment was made (defaults to payerId)
  amount: number; // In currency units (e.g. INR)
  note?: string; // Optional note, e.g. "UPI ref", "Covered friend's share"
  date: string; // ISO date string
}

export type ParticipantStatus = 'settled' | 'owes' | 'gets';

export interface ParticipantBalance {
  participantId: string;
  name: string;
  share: number; // Amount they are responsible for (equal share)
  paidOutOfPocket: number; // Total cash physically paid by this person
  creditedPayments: number; // Payments credited towards their share (self + covered by others)
  coveredForOthers: number; // Amount this person paid on behalf of others
  netBalance: number; // paidOutOfPocket - share
  status: ParticipantStatus;
  amountOwed: number; // if netBalance < 0: Math.abs(netBalance), else 0
  amountToReceive: number; // if netBalance > 0: netBalance, else 0
  shareRemaining: number; // max(0, share - creditedPayments)
}

export interface SettlementTransfer {
  id: string; // unique hash or composite key
  fromParticipantId: string;
  toParticipantId: string;
  fromName: string;
  toName: string;
  amount: number;
  isCompleted: boolean;
}

export type PoolOverallStatus =
  | 'not_started' // 0 participants or 0 payments
  | 'collecting' // payments started, total collected < budget
  | 'fully_collected' // total collected >= budget, but settlement pending
  | 'ready_to_settle' // all funds accounted for, settlements can be executed
  | 'settled'; // all participants net 0 or all settlements marked complete

export interface PoolSummary {
  targetBudget: number;
  totalCollected: number;
  remainingToCollect: number;
  excessCollected: number;
  equalShare: number;
  participantCount: number;
  status: PoolOverallStatus;
  percentCollected: number;
}

export interface AppState {
  pool: Pool | null;
  participants: Participant[];
  payments: Payment[];
  completedSettlementIds: string[]; // Settlement transfer IDs that have been marked paid
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}
