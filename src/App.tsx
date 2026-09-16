import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Participant,
  Payment,
  ToastMessage,
} from './types';
import { initialAppState } from './utils/storage';
import {
  calculateBalances,
  calculatePoolSummary,
} from './utils/calculations';
import { calculateSettlements, areAllSettlementsCompleted } from './utils/settlement';
import { formatINR } from './utils/currency';
import {
  fetchPoolState,
  createPoolApi,
  updatePoolApi,
  addParticipantApi,
  updateParticipantApi,
  deleteParticipantApi,
  addPaymentApi,
  updatePaymentApi,
  deletePaymentApi,
  toggleSettlementApi,
  resetSettlementsApi,
  seedDemoPoolApi,
  resetAllDataApi,
  checkServerHealth,
} from './services/api';

// Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { EmptyState } from './components/empty/EmptyState';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { QuickAnswersBar } from './components/dashboard/QuickAnswersBar';
import { CreatePoolModal } from './components/dashboard/CreatePoolModal';
import { EditPoolModal } from './components/dashboard/EditPoolModal';
import { ParticipantList } from './components/participants/ParticipantList';
import { ParticipantModal } from './components/participants/ParticipantModal';
import { PaymentFormModal } from './components/payments/PaymentFormModal';
import { PaymentHistory } from './components/payments/PaymentHistory';
import { BalanceTable } from './components/balance/BalanceTable';
import { SettlementPanel } from './components/settlement/SettlementPanel';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ToastContainer } from './components/common/Toast';
import { Modal } from './components/common/Modal';
import { BriefModal } from './components/common/BriefModal';

export const App: React.FC = () => {
  // Main persistent state
  const [state, setState] = useState<AppState>(initialAppState);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal open states
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isEditPoolOpen, setIsEditPoolOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load from SQLite backend (with localStorage fallback)
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const isOnline = await checkServerHealth();
      setIsDbConnected(isOnline);
      const loadedState = await fetchPoolState();
      setState(loadedState);
      setIsLoading(false);
    }
    init();
  }, []);

  // Derived calculations
  const balances = useMemo(() => {
    return calculateBalances(state.pool, state.participants, state.payments);
  }, [state.pool, state.participants, state.payments]);

  const settlements = useMemo(() => {
    return calculateSettlements(balances, state.completedSettlementIds);
  }, [balances, state.completedSettlementIds]);

  const allSettlementsDone = useMemo(() => {
    return areAllSettlementsCompleted(settlements);
  }, [settlements]);

  const summary = useMemo(() => {
    return calculatePoolSummary(
      state.pool,
      state.participants,
      state.payments,
      allSettlementsDone
    );
  }, [state.pool, state.participants, state.payments, allSettlementsDone]);

  // Pool handlers
  const handleCreatePool = async (name: string, budget: number) => {
    const updated = await createPoolApi(name, budget);
    setState(updated);
    addToast('Pool Created in SQLite!', `"${name}" with budget ${formatINR(budget)} saved to database.`);
  };

  const handleUpdatePool = async (name: string, budget: number) => {
    if (!state.pool) return;
    const updated = await updatePoolApi(state.pool.id, name, budget);
    setState(updated);
    addToast('Pool Updated', 'Target budget and equal shares saved to database.');
  };

  const handleLoadDemo = async () => {
    const updated = await seedDemoPoolApi();
    setState(updated);
    addToast(
      'Demo Pool Loaded',
      'Loaded 6-person demo pool directly into SQLite database (gift_pool.db).',
      'info'
    );
  };

  const handleResetPool = async () => {
    const updated = await resetAllDataApi();
    setState(updated);
    addToast('Database Reset', 'All pool tables wiped in SQLite database.', 'info');
  };

  // Participant handlers
  const handleOpenAddParticipant = () => {
    setEditingParticipant(null);
    setIsParticipantModalOpen(true);
  };

  const handleOpenEditParticipant = (p: Participant) => {
    setEditingParticipant(p);
    setIsParticipantModalOpen(true);
  };

  const handleSaveParticipant = async (name: string, participantId?: string) => {
    const avatarColors = [
      '#4f46e5', '#059669', '#d97706', '#dc2626',
      '#7c3aed', '#0284c7', '#db2777', '#0891b2',
    ];

    if (participantId) {
      const updated = await updateParticipantApi(participantId, name);
      setState(updated);
      addToast('Participant Updated', `Saved changes for ${name} to SQLite.`);
    } else {
      if (!state.pool) return;
      const color = avatarColors[state.participants.length % avatarColors.length];
      const updated = await addParticipantApi(state.pool.id, name, color);
      setState(updated);
      addToast('Participant Added', `${name} added to database. Equal shares recomputed.`);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    const participant = state.participants.find((p) => p.id === participantId);
    const updated = await deleteParticipantApi(participantId);
    setState(updated);
    addToast(
      'Participant Removed',
      `Removed ${participant?.name || 'participant'} and adjusted pool shares.`
    );
  };

  // Payment handlers
  const handleOpenAddPayment = () => {
    setEditingPayment(null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (
    paymentData: Omit<Payment, 'id'>,
    editingId?: string
  ) => {
    if (!state.pool) return;
    if (editingId) {
      const updated = await updatePaymentApi(editingId, paymentData);
      setState(updated);
      addToast('Payment Updated', `Updated payment of ${formatINR(paymentData.amount)} in database.`);
    } else {
      const updated = await addPaymentApi(state.pool.id, paymentData);
      setState(updated);
      addToast('Payment Recorded', `Logged contribution of ${formatINR(paymentData.amount)} into SQLite.`);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const updated = await deletePaymentApi(paymentId);
    setState(updated);
    addToast('Payment Deleted', 'Payment removed from database and balances updated.');
  };

  // Settlement handlers
  const handleToggleSettlement = async (transferId: string) => {
    if (!state.pool) return;
    const updated = await toggleSettlementApi(state.pool.id, transferId);
    setState(updated);
  };

  const handleResetAllSettlements = async () => {
    if (!state.pool) return;
    const updated = await resetSettlementsApi(state.pool.id);
    setState(updated);
    addToast('Settlement Checks Reset', 'All transfers marked as pending in SQLite.', 'info');
  };

  // Share summary generator
  const getShareableText = () => {
    if (!state.pool) return '';
    let text = `🎁 *${state.pool.name}* (FairShare Summary)\n\n`;
    text += `💰 Target Budget: ${formatINR(summary.targetBudget)}\n`;
    text += `👥 Equal Share: ${formatINR(summary.equalShare)} per person (${summary.participantCount} members)\n`;
    text += `📥 Total Collected: ${formatINR(summary.totalCollected)} (${summary.percentCollected}%)\n`;

    if (summary.remainingToCollect > 0) {
      text += `⏳ Remaining to Collect: ${formatINR(summary.remainingToCollect)}\n\n`;
    } else {
      text += `✅ Pool fully collected!\n\n`;
    }

    text += `*Participant Balances:*\n`;
    balances.forEach((b) => {
      let statusText = 'Settled';
      if (b.status === 'owes') statusText = `Owes ${formatINR(b.amountOwed)}`;
      if (b.status === 'gets') statusText = `Receives ${formatINR(b.amountToReceive)}`;
      text += `• ${b.name}: Paid ${formatINR(b.paidOutOfPocket)} | ${statusText}\n`;
    });

    if (settlements.length > 0) {
      text += `\n*Settlement Plan:*\n`;
      settlements.forEach((s, idx) => {
        const check = s.isCompleted ? '✅' : '⏳';
        text += `${idx + 1}. ${check} ${s.fromName} pays ${s.toName} ${formatINR(s.amount)}\n`;
      });
    }

    return text;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <Navbar
        pool={state.pool}
        summary={summary}
        isDbConnected={isDbConnected}
        onEditPool={() => setIsEditPoolOpen(true)}
        onResetPool={() => setIsResetConfirmOpen(true)}
        onLoadDemo={handleLoadDemo}
        onShareSummary={() => setIsShareModalOpen(true)}
        onOpenBrief={() => setIsBriefModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!state.pool ? (
          <EmptyState
            onCreatePool={() => setIsCreatePoolOpen(true)}
            onLoadDemo={handleLoadDemo}
            onOpenBrief={() => setIsBriefModalOpen(true)}
          />
        ) : (
          <div className="space-y-8">
            {/* Top Summary Metric Cards & Progress */}
            <SummaryCards summary={summary} />

            {/* Organiser Quick Answers Bar */}
            <QuickAnswersBar summary={summary} balances={balances} />

            {/* Split Grid: Left = Participants & Payments, Right = Balances & Settlements */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Management (Participants + Payment History) */}
              <div className="lg:col-span-5 space-y-6">
                <ParticipantList
                  participants={state.participants}
                  payments={state.payments}
                  onAddParticipant={handleOpenAddParticipant}
                  onEditParticipant={handleOpenEditParticipant}
                  onDeleteParticipant={handleDeleteParticipant}
                />

                <PaymentHistory
                  payments={state.payments}
                  participants={state.participants}
                  onAddPayment={handleOpenAddPayment}
                  onEditPayment={handleOpenEditPayment}
                  onDeletePayment={handleDeletePayment}
                />
              </div>

              {/* Right Column: Financial Breakdown & Settlement Engine */}
              <div className="lg:col-span-7 space-y-6">
                <BalanceTable balances={balances} />

                <SettlementPanel
                  transfers={settlements}
                  balances={balances}
                  poolName={state.pool.name}
                  onToggleComplete={handleToggleSettlement}
                  onResetAllSettlements={handleResetAllSettlements}
                  onShowToast={addToast}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <CreatePoolModal
        isOpen={isCreatePoolOpen}
        onClose={() => setIsCreatePoolOpen(false)}
        onCreate={handleCreatePool}
      />

      <EditPoolModal
        isOpen={isEditPoolOpen}
        onClose={() => setIsEditPoolOpen(false)}
        pool={state.pool}
        onUpdate={handleUpdatePool}
      />

      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        onSave={handleSaveParticipant}
        existingParticipants={state.participants}
        editingParticipant={editingParticipant}
      />

      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        participants={state.participants}
        editingPayment={editingPayment}
        defaultEqualShare={summary.equalShare}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetPool}
        title="Reset Entire Pool?"
        message="This will permanently delete the current pool, all participants, payments, and settlement progress from the SQLite database. Are you sure?"
        confirmLabel="Reset Everything"
        isDestructive={true}
      />

      {/* Share / Export Summary Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Pool Summary"
        subtitle="Copy formatted text to share on WhatsApp, Slack, or Teams"
      >
        <div className="space-y-4">
          <textarea
            readOnly
            value={getShareableText()}
            rows={10}
            className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(getShareableText());
                addToast('Copied!', 'Summary copied to clipboard.', 'success');
                setIsShareModalOpen(false);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      </Modal>

      {/* Assessment Brief Modal */}
      <BriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        onLoadDemo={handleLoadDemo}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
export default App;
