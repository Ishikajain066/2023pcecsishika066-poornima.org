import { AppState } from '../types';

const STORAGE_KEY = 'fairshare_gift_pool_state_v1';

export const initialAppState: AppState = {
  pool: null,
  participants: [],
  payments: [],
  completedSettlementIds: [],
};

/**
 * Saves the entire application state into localStorage.
 */
export function saveAppState(state: AppState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
    return false;
  }
}

/**
 * Loads application state from localStorage.
 * Validates integrity and falls back gracefully to default state on any parsing error.
 */
export function loadAppState(): AppState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return initialAppState;
    }

    const parsed = JSON.parse(serialized);

    // Basic schema validation
    if (typeof parsed !== 'object' || parsed === null) {
      return initialAppState;
    }

    const pool = parsed.pool && typeof parsed.pool === 'object' && typeof parsed.pool.name === 'string'
      ? parsed.pool
      : null;

    const participants = Array.isArray(parsed.participants) ? parsed.participants : [];
    const payments = Array.isArray(parsed.payments) ? parsed.payments : [];
    const completedSettlementIds = Array.isArray(parsed.completedSettlementIds)
      ? parsed.completedSettlementIds
      : [];

    return {
      pool,
      participants,
      payments,
      completedSettlementIds,
    };
  } catch (error) {
    console.error('Failed to parse state from localStorage, resetting to initial state:', error);
    return initialAppState;
  }
}

/**
 * Clears stored application state from localStorage.
 */
export function clearAppState(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
    return false;
  }
}
