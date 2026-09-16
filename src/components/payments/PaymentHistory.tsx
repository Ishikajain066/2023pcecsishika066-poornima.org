import React, { useState } from 'react';
import { Participant, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { History, PlusCircle, Edit2, Trash2, Search, Calendar, User, ArrowRight } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface PaymentHistoryProps {
  payments: Payment[];
  participants: Participant[];
  onAddPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  participants,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParticipantId, setFilterParticipantId] = useState<string>('all');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const participantMap = new Map<string, Participant>();
  participants.forEach((p) => participantMap.set(p.id, p));

  const filteredPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((pay) => {
      const payer = participantMap.get(pay.payerId)?.name.toLowerCase() || '';
      const beneficiary = pay.beneficiaryId
        ? participantMap.get(pay.beneficiaryId)?.name.toLowerCase() || ''
        : '';
      const note = pay.note?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        payer.includes(query) || beneficiary.includes(query) || note.includes(query);

      const matchesParticipant =
        filterParticipantId === 'all' ||
        pay.payerId === filterParticipantId ||
        pay.beneficiaryId === filterParticipantId;

      return matchesSearch && matchesParticipant;
    });

  const handleConfirmDelete = () => {
    if (deletingPaymentId) {
      onDeletePayment(deletingPaymentId);
      setDeletingPaymentId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Payment History ({payments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Audit log of all cash contributions into the pool
            </p>
          </div>
        </div>

        <button
          onClick={onAddPayment}
          disabled={participants.length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by payer, covered friend, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={filterParticipantId}
            onChange={(e) => setFilterParticipantId(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Participants</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                Filter: {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {payments.length === 0
              ? 'No payments recorded yet. Click "Record Payment" to log contributions.'
              : 'No payments match your search filter.'}
          </div>
        ) : (
          filteredPayments.map((pay) => {
            const payer = participantMap.get(pay.payerId);
            const beneficiary = pay.beneficiaryId
              ? participantMap.get(pay.beneficiaryId)
              : payer;
            const isForOther = pay.beneficiaryId && pay.beneficiaryId !== pay.payerId;

            return (
              <div
                key={pay.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs mt-0.5 shrink-0">
                    <User className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {payer?.name || 'Unknown'}
                      </span>

                      {isForOther && beneficiary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          <ArrowRight className="w-3 h-3" />
                          For {beneficiary.name}
                        </span>
                      )}

                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {formatINR(pay.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(pay.date)}
                      </span>
                      {pay.note && (
                        <span className="italic text-slate-600 truncate max-w-xs">
                          "{pay.note}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditPayment(pay)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit payment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPaymentId(pay.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete payment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Payment Confirm Modal */}
      <ConfirmModal
        isOpen={deletingPaymentId !== null}
        onClose={() => setDeletingPaymentId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record?"
        message="Are you sure you want to remove this payment? All individual balances and settlement calculations will be recalculated."
        confirmLabel="Delete Payment"
        isDestructive={true}
      />
    </div>
  );
};
