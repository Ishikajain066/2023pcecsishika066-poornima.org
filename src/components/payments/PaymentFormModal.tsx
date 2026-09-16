import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Participant, Payment } from '../../types';
import { parseCurrencyInput } from '../../utils/currency';
import { IndianRupee, Users } from 'lucide-react';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: Omit<Payment, 'id'>, editingId?: string) => void;
  participants: Participant[];
  editingPayment?: Payment | null;
  defaultEqualShare?: number;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  participants,
  editingPayment,
  defaultEqualShare = 0,
}) => {
  const [payerId, setPayerId] = useState<string>('');
  const [beneficiaryId, setBeneficiaryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPayment) {
      setPayerId(editingPayment.payerId);
      setBeneficiaryId(editingPayment.beneficiaryId || editingPayment.payerId);
      setAmount(editingPayment.amount.toString());
      setNote(editingPayment.note || '');
      setDate(editingPayment.date ? editingPayment.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    } else {
      setPayerId(participants.length > 0 ? participants[0].id : '');
      setBeneficiaryId(participants.length > 0 ? participants[0].id : '');
      setAmount(defaultEqualShare > 0 ? defaultEqualShare.toString() : '');
      setNote('');
      setDate(new Date().toISOString().slice(0, 16));
    }
    setError(null);
  }, [editingPayment, isOpen, participants, defaultEqualShare]);

  const handlePayerChange = (newPayerId: string) => {
    setPayerId(newPayerId);
    // If beneficiary was set to previous payer or empty, default to new payer
    if (!beneficiaryId || beneficiaryId === payerId) {
      setBeneficiaryId(newPayerId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payerId) {
      setError('Please select who made the payment.');
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setError(null);
    onSave(
      {
        payerId,
        beneficiaryId: beneficiaryId || payerId,
        amount: parsedAmount,
        note: note.trim() || undefined,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      },
      editingPayment?.id
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPayment ? 'Edit Payment' : 'Record Contribution'}
      subtitle="Log a payment into the pool, whether for oneself or on behalf of someone else"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}

        {/* Payer field */}
        <div>
          <label htmlFor="payer-select" className="block text-sm font-medium text-slate-700 mb-1">
            Who paid the money? (Payer) <span className="text-red-500">*</span>
          </label>
          <select
            id="payer-select"
            value={payerId}
            onChange={(e) => handlePayerChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            The person who actually transferred or fronted the cash.
          </p>
        </div>

        {/* Beneficiary field (Paid for) */}
        <div>
          <label htmlFor="beneficiary-select" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Paid on behalf of (Whose share does this cover?)
          </label>
          <select
            id="beneficiary-select"
            value={beneficiaryId}
            onChange={(e) => setBeneficiaryId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === payerId ? `Themselves (${p.name})` : `Covering ${p.name}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Defaults to the payer. Select another person if paying to cover a teammate's share.
          </p>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="payment-amount" className="block text-sm font-medium text-slate-700 mb-1">
            Amount Paid <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              id="payment-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          {defaultEqualShare > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(defaultEqualShare.toString())}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
              >
                Set to full share (₹{defaultEqualShare})
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setAmount((defaultEqualShare / 2).toString())}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
              >
                Half share (₹{defaultEqualShare / 2})
              </button>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <label htmlFor="payment-date" className="block text-sm font-medium text-slate-700 mb-1">
            Date & Time
          </label>
          <input
            id="payment-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="payment-note" className="block text-sm font-medium text-slate-700 mb-1">
            Optional Note / Reference
          </label>
          <input
            id="payment-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. UPI / GPay, Cash, Covered friend's share"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {editingPayment ? 'Update Payment' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
