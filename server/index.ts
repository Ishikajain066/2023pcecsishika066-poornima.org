import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  getActivePoolState,
  createPool,
  updatePool,
  addParticipant,
  updateParticipant,
  deleteParticipant,
  addPayment,
  updatePayment,
  deletePayment,
  toggleSettlement,
  resetSettlements,
  resetAllData,
  seedDemoPool,
} from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health / Status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', database: 'sqlite3', timestamp: new Date().toISOString() });
});

// GET active pool state
app.get('/api/pool', (req: Request, res: Response) => {
  try {
    const state = getActivePoolState();
    res.json(state);
  } catch (error) {
    console.error('Failed to get pool state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create pool
app.post('/api/pool', (req: Request, res: Response) => {
  try {
    const { name, budget } = req.body;
    if (!name || typeof name !== 'string' || !budget || budget <= 0) {
      return res.status(400).json({ error: 'Invalid pool name or budget' });
    }
    const state = createPool(name.trim(), Number(budget));
    res.json(state);
  } catch (error) {
    console.error('Failed to create pool:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update pool
app.put('/api/pool', (req: Request, res: Response) => {
  try {
    const { poolId, name, budget } = req.body;
    if (!poolId || !name || typeof name !== 'string' || !budget || budget <= 0) {
      return res.status(400).json({ error: 'Invalid pool data' });
    }
    const state = updatePool(poolId, name.trim(), Number(budget));
    res.json(state);
  } catch (error) {
    console.error('Failed to update pool:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add participant
app.post('/api/participants', (req: Request, res: Response) => {
  try {
    const { poolId, name, avatarColor } = req.body;
    if (!poolId || !name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Participant name is required' });
    }
    const state = addParticipant(poolId, name.trim(), avatarColor);
    res.json(state);
  } catch (error) {
    console.error('Failed to add participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update participant
app.put('/api/participants/:id', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const participantId = req.params.id;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Participant name is required' });
    }
    const state = updateParticipant(participantId, name.trim());
    res.json(state);
  } catch (error) {
    console.error('Failed to update participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE participant
app.delete('/api/participants/:id', (req: Request, res: Response) => {
  try {
    const participantId = req.params.id;
    const state = deleteParticipant(participantId);
    res.json(state);
  } catch (error) {
    console.error('Failed to delete participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add payment
app.post('/api/payments', (req: Request, res: Response) => {
  try {
    const { poolId, payerId, beneficiaryId, amount, note, date } = req.body;
    if (!poolId || !payerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payer and amount are required' });
    }
    const state = addPayment(
      poolId,
      payerId,
      beneficiaryId,
      Number(amount),
      note,
      date || new Date().toISOString()
    );
    res.json(state);
  } catch (error) {
    console.error('Failed to add payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update payment
app.put('/api/payments/:id', (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const { payerId, beneficiaryId, amount, note, date } = req.body;
    if (!payerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payer and amount are required' });
    }
    const state = updatePayment(
      paymentId,
      payerId,
      beneficiaryId,
      Number(amount),
      note,
      date || new Date().toISOString()
    );
    res.json(state);
  } catch (error) {
    console.error('Failed to update payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE payment
app.delete('/api/payments/:id', (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const state = deletePayment(paymentId);
    res.json(state);
  } catch (error) {
    console.error('Failed to delete payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST toggle settlement
app.post('/api/settlements/toggle', (req: Request, res: Response) => {
  try {
    const { poolId, transferId } = req.body;
    if (!poolId || !transferId) {
      return res.status(400).json({ error: 'Pool and transfer IDs are required' });
    }
    const state = toggleSettlement(poolId, transferId);
    res.json(state);
  } catch (error) {
    console.error('Failed to toggle settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST reset settlements
app.post('/api/settlements/reset', (req: Request, res: Response) => {
  try {
    const { poolId } = req.body;
    if (!poolId) {
      return res.status(400).json({ error: 'Pool ID is required' });
    }
    const state = resetSettlements(poolId);
    res.json(state);
  } catch (error) {
    console.error('Failed to reset settlements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST load demo pool
app.post('/api/demo', (req: Request, res: Response) => {
  try {
    const state = seedDemoPool();
    res.json(state);
  } catch (error) {
    console.error('Failed to seed demo pool:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST reset all
app.post('/api/reset', (req: Request, res: Response) => {
  try {
    const state = resetAllData();
    res.json(state);
  } catch (error) {
    console.error('Failed to reset data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`[SQLite Backend] Server listening on http://localhost:${PORT}`);
  console.log(`[SQLite Backend] Database connected at gift_pool.db`);
});
