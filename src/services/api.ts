import { AppState, Payment, Participant } from '../types';
import { loadAppState, saveAppState, clearAppState } from '../utils/storage';
import { DEMO_APP_STATE } from '../data/demoPool';

const API_BASE = '/api';

/**
 * Checks server health and SQLite database connectivity.
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Fetches the active pool state from the SQLite backend.
 * Falls back to localStorage if server is offline.
 */
export async function fetchPoolState(): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/pool`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    // Cache to local storage as fallback
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Server unreachable, using local cache:', error);
    return loadAppState();
  }
}

/**
 * Creates a new pool in SQLite.
 */
export async function createPoolApi(name: string, budget: number): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, budget }),
    });
    if (!res.ok) throw new Error('Failed to create pool on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage create:', error);
    const newPool = {
      id: `pool-${Date.now()}`,
      name,
      targetBudget: budget,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newState: AppState = {
      pool: newPool,
      participants: [],
      payments: [],
      completedSettlementIds: [],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Updates pool name and budget in SQLite.
 */
export async function updatePoolApi(poolId: string, name: string, budget: number): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/pool`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId, name, budget }),
    });
    if (!res.ok) throw new Error('Failed to update pool on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage update:', error);
    const current = loadAppState();
    if (!current.pool) return current;
    const newState: AppState = {
      ...current,
      pool: { ...current.pool, name, targetBudget: budget, updatedAt: new Date().toISOString() },
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Adds a participant in SQLite.
 */
export async function addParticipantApi(poolId: string, name: string, avatarColor?: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId, name, avatarColor }),
    });
    if (!res.ok) throw new Error('Failed to add participant on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage addParticipant:', error);
    const current = loadAppState();
    const newP: Participant = {
      id: `part-${Date.now()}`,
      name,
      avatarColor: avatarColor || '#6366f1',
      createdAt: new Date().toISOString(),
    };
    const newState: AppState = {
      ...current,
      participants: [...current.participants, newP],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Updates participant name in SQLite.
 */
export async function updateParticipantApi(participantId: string, name: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/participants/${participantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to update participant on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage updateParticipant:', error);
    const current = loadAppState();
    const newState: AppState = {
      ...current,
      participants: current.participants.map((p) => (p.id === participantId ? { ...p, name } : p)),
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Deletes a participant and their attached payments in SQLite.
 */
export async function deleteParticipantApi(participantId: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/participants/${participantId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete participant on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage deleteParticipant:', error);
    const current = loadAppState();
    const newState: AppState = {
      ...current,
      participants: current.participants.filter((p) => p.id !== participantId),
      payments: current.payments.filter(
        (pay) => pay.payerId !== participantId && pay.beneficiaryId !== participantId
      ),
      completedSettlementIds: [],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Records a payment in SQLite.
 */
export async function addPaymentApi(
  poolId: string,
  paymentData: Omit<Payment, 'id'>
): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId, ...paymentData }),
    });
    if (!res.ok) throw new Error('Failed to record payment on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage addPayment:', error);
    const current = loadAppState();
    const newPay: Payment = { ...paymentData, id: `pay-${Date.now()}` };
    const newState: AppState = {
      ...current,
      payments: [...current.payments, newPay],
      completedSettlementIds: [],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Updates a payment in SQLite.
 */
export async function updatePaymentApi(
  paymentId: string,
  paymentData: Omit<Payment, 'id'>
): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error('Failed to update payment on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage updatePayment:', error);
    const current = loadAppState();
    const newState: AppState = {
      ...current,
      payments: current.payments.map((p) => (p.id === paymentId ? { ...paymentData, id: paymentId } : p)),
      completedSettlementIds: [],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Deletes a payment in SQLite.
 */
export async function deletePaymentApi(paymentId: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete payment on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage deletePayment:', error);
    const current = loadAppState();
    const newState: AppState = {
      ...current,
      payments: current.payments.filter((p) => p.id !== paymentId),
      completedSettlementIds: [],
    };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Toggles settlement completed status in SQLite.
 */
export async function toggleSettlementApi(poolId: string, transferId: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/settlements/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId, transferId }),
    });
    if (!res.ok) throw new Error('Failed to toggle settlement on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage toggleSettlement:', error);
    const current = loadAppState();
    const isCompleted = current.completedSettlementIds.includes(transferId);
    const updatedIds = isCompleted
      ? current.completedSettlementIds.filter((id) => id !== transferId)
      : [...current.completedSettlementIds, transferId];
    const newState: AppState = { ...current, completedSettlementIds: updatedIds };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Resets all settlement checks in SQLite.
 */
export async function resetSettlementsApi(poolId: string): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/settlements/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId }),
    });
    if (!res.ok) throw new Error('Failed to reset settlements on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage resetSettlements:', error);
    const current = loadAppState();
    const newState: AppState = { ...current, completedSettlementIds: [] };
    saveAppState(newState);
    return newState;
  }
}

/**
 * Seeds demo pool into SQLite.
 */
export async function seedDemoPoolApi(): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed demo pool on server');
    const data = await res.json();
    saveAppState(data);
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage seedDemoPool:', error);
    saveAppState(DEMO_APP_STATE);
    return DEMO_APP_STATE;
  }
}

/**
 * Wipes all tables in SQLite.
 */
export async function resetAllDataApi(): Promise<AppState> {
  try {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset data on server');
    const data = await res.json();
    clearAppState();
    return data;
  } catch (error) {
    console.warn('[API] Fallback to local storage resetAllData:', error);
    clearAppState();
    return { pool: null, participants: [], payments: [], completedSettlementIds: [] };
  }
}
