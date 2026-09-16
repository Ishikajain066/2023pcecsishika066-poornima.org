import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Participant,
  Payment,
  ToastMessage,
  Pool,
} from './types';
import { loadAppState, saveAppState, clearAppState, initialAppState } from './utils/storage';
import {
  calculateBalances,
  calculatePoolSummary,
  calculateEqualShare,
} from './utils/calculations';
import { calculateSettlements, areAllSettlementsCompleted } from './utils/settlement';
import { DEMO_APP_STATE } from './data/demoPool';
import { formatINR } from './utils/currency';

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

export const App: React.FC = () => {
  // Main persistent state
  const [state, setState] = useState<AppState>(() => loadAppState());

  // Modal open states
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isEditPoolOpen, setIsEditPoolOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  // Sync state to localStorage on changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

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
  const handleCreatePool = (name: string, budget: number) => {
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name,
      targetBudget: budget,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState({
      pool: newPool,
      participants: [],
      payments: [],
      completedSettlementIds: [],
    });

    addToast('Pool Created!', `"${name}" with a budget of ${formatINR(budget)} is ready.`);
  };

  const handleUpdatePool = (name: string, budget: number) => {
    if (!state.pool) return;
    setState((prev) => ({
      ...prev,
      pool: {
        ...prev.pool!,
        name,
        targetBudget: budget,
        updatedAt: new Date().toISOString(),
      },
    }));
    addToast('Pool Updated', 'Target budget and equal shares have been recalculated.');
  };

  const handleLoadDemo = () => {
    setState(DEMO_APP_STATE);
    addToast(
      'Demo Pool Loaded',
      'Loaded "Manager Farewell Gift" (₹6,000 budget, 6 members, realistic payments).',
      'info'
    );
  };

  const handleResetPool = () => {
    clearAppState();
    setState(initialAppState);
    addToast('Data Cleared', 'All pool data and settlements have been reset.', 'info');
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

  const handleSaveParticipant = (name: string, participantId?: string) => {
    const avatarColors = [
      '#4f46e5', '#059669', '#d97706', '#dc2626',
      '#7c3aed', '#0284c7', '#db2777', '#0891b2',
    ];

    if (participantId) {
      // Edit
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, name } : p
        ),
      }));
      addToast('Participant Updated', `Updated details for ${name}.`);
    } else {
      // Add
      const newParticipant: Participant = {
        id: `part-${Date.now()}`,
        name,
        avatarColor: avatarColors[state.participants.length % avatarColors.length],
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        participants: [...prev.participants, newParticipant],
      }));
      addToast('Participant Added', `${name} joined the pool. Equal share updated.`);
    }
  };

  const handleDeleteParticipant = (participantId: string) => {
    const participant = state.participants.find((p) => p.id === participantId);
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== participantId),
      // Clean up payments related to this participant
      payments: prev.payments.filter(
        (pay) => pay.payerId !== participantId && pay.beneficiaryId !== participantId
      ),
      // Reset settlements since member left
      completedSettlementIds: [],
    }));
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

  const handleSavePayment = (
    paymentData: Omit<Payment, 'id'>,
    editingId?: string
  ) => {
    if (editingId) {
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) =>
          p.id === editingId ? { ...paymentData, id: editingId } : p
        ),
        completedSettlementIds: [], // Reset checks when financial data changes
      }));
      addToast('Payment Updated', `Payment of ${formatINR(paymentData.amount)} updated.`);
    } else {
      const newPayment: Payment = {
        ...paymentData,
        id: `pay-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        payments: [...prev.payments, newPayment],
        completedSettlementIds: [], // Reset checks when new payment arrives
      }));
      addToast('Payment Recorded', `Logged contribution of ${formatINR(paymentData.amount)}.`);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== paymentId),
      completedSettlementIds: [],
    }));
    addToast('Payment Deleted', 'Payment removed and balances updated.');
  };

  // Settlement handlers
  const handleToggleSettlement = (transferId: string) => {
    setState((prev) => {
      const isCurrentlyCompleted = prev.completedSettlementIds.includes(transferId);
      const updatedIds = isCurrentlyCompleted
        ? prev.completedSettlementIds.filter((id) => id !== transferId)
        : [...prev.completedSettlementIds, transferId];

      return {
        ...prev,
        completedSettlementIds: updatedIds,
      };
    });
  };

  const handleResetAllSettlements = () => {
    setState((prev) => ({
      ...prev,
      completedSettlementIds: [],
    }));
    addToast('Settlement Checks Reset', 'All transfers marked as pending again.', 'info');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <Navbar
        pool={state.pool}
        summary={summary}
        onEditPool={() => setIsEditPoolOpen(true)}
        onResetPool={() => setIsResetConfirmOpen(true)}
        onLoadDemo={handleLoadDemo}
        onShareSummary={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!state.pool ? (
          <EmptyState
            onCreatePool={() => setIsCreatePoolOpen(true)}
            onLoadDemo={handleLoadDemo}
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
        message="This will permanently delete the current pool, all participants, payments, and settlement progress from your browser. Are you sure?"
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
export default App;
