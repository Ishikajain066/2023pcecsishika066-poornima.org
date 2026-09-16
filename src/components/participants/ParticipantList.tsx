import React, { useState } from 'react';
import { Participant, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { UserPlus, Edit2, Trash2, Users, Receipt } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface ParticipantListProps {
  participants: Participant[];
  payments: Payment[];
  onAddParticipant: () => void;
  onEditParticipant: (participant: Participant) => void;
  onDeleteParticipant: (participantId: string) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  payments,
  onAddParticipant,
  onEditParticipant,
  onDeleteParticipant,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const participantToDelete = participants.find((p) => p.id === confirmDeleteId);
  const paymentsForToDelete = confirmDeleteId
    ? payments.filter((p) => p.payerId === confirmDeleteId || p.beneficiaryId === confirmDeleteId)
    : [];

  const handleDeleteClick = (p: Participant) => {
    setConfirmDeleteId(p.id);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteParticipant(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Participants ({participants.length})
          </h3>
        </div>

        <button
          onClick={onAddParticipant}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Participant List */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No participants yet. Click "Add Member" to begin.
          </div>
        ) : (
          participants.map((p) => {
            const payerPayments = payments.filter((pay) => pay.payerId === p.id);
            const totalPaid = payerPayments.reduce((sum, pay) => sum + pay.amount, 0);

            return (
              <div
                key={p.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0"
                    style={{ backgroundColor: p.avatarColor || '#6366f1' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-slate-400" />
                      Paid: <span className="font-medium text-slate-700">{formatINR(totalPaid)}</span>
                      {payerPayments.length > 0 && ` (${payerPayments.length} txn)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditParticipant(p)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit participant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(p)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Deleting Participant */}
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={`Remove ${participantToDelete?.name || 'Participant'}?`}
        message={
          paymentsForToDelete.length > 0
            ? `Warning: ${participantToDelete?.name} has ${paymentsForToDelete.length} payment record(s) attached. Removing them will delete these payments and recalculate all balances.`
            : `Are you sure you want to remove ${participantToDelete?.name} from this pool? Equal shares for remaining members will be updated.`
        }
        confirmLabel="Remove Participant"
        isDestructive={true}
      />
    </div>
  );
};
