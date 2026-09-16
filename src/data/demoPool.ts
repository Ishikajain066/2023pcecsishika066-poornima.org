import { AppState, Participant, Payment, Pool } from '../types';

export const DEMO_POOL: Pool = {
  id: 'pool-farewell-demo',
  name: 'Manager Farewell Gift',
  targetBudget: 6000,
  currency: 'INR',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_PARTICIPANTS: Participant[] = [
  { id: 'part-1', name: 'Aarav', avatarColor: '#4f46e5', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'part-2', name: 'Priya', avatarColor: '#059669', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'part-3', name: 'Rahul', avatarColor: '#d97706', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'part-4', name: 'Neha', avatarColor: '#dc2626', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'part-5', name: 'Aman', avatarColor: '#7c3aed', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'part-6', name: 'Vikram', avatarColor: '#0284c7', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    payerId: 'part-1', // Aarav
    beneficiaryId: 'part-1',
    amount: 1000,
    note: 'Initial contribution via GPay',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-2',
    payerId: 'part-2', // Priya
    beneficiaryId: 'part-2',
    amount: 1000,
    note: 'Full share paid via UPI',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
  },
  {
    id: 'pay-3',
    payerId: 'part-3', // Rahul
    beneficiaryId: 'part-3',
    amount: 500,
    note: 'Partial payment - will transfer rest soon',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-4',
    payerId: 'part-4', // Neha
    beneficiaryId: 'part-4',
    amount: 700,
    note: 'Partial share via Paytm',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
  },
  {
    id: 'pay-5',
    payerId: 'part-5', // Aman (pays 1,000 for self and 600 covering advance)
    beneficiaryId: 'part-5',
    amount: 1000,
    note: 'My equal share',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-6',
    payerId: 'part-5', // Aman (covers extra 600)
    beneficiaryId: 'part-3', // Paid on behalf of Rahul
    amount: 600,
    note: 'Covered part of Rahul’s share in advance',
    date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-7',
    payerId: 'part-6', // Vikram
    beneficiaryId: 'part-6',
    amount: 1200,
    note: 'Fronted extra ₹200 for gift wrapping/card',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_APP_STATE: AppState = {
  pool: DEMO_POOL,
  participants: DEMO_PARTICIPANTS,
  payments: DEMO_PAYMENTS,
  completedSettlementIds: [],
};
