import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { parseCurrencyInput } from '../../utils/currency';
import { IndianRupee } from 'lucide-react';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, budget: number) => void;
}

export const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a pool name.');
      return;
    }

    const parsedBudget = parseCurrencyInput(budget);
    if (parsedBudget === null || parsedBudget <= 0) {
      setError('Please enter a valid budget amount greater than ₹0.');
      return;
    }

    setError(null);
    onCreate(trimmedName, parsedBudget);
    setName('');
    setBudget('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Contribution Pool"
      subtitle="Set up a gift or event pool to start tracking contributions"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="pool-name" className="block text-sm font-medium text-slate-700 mb-1">
            Pool Name <span className="text-red-500">*</span>
          </label>
          <input
            id="pool-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Manager Farewell Gift"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="pool-budget" className="block text-sm font-medium text-slate-700 mb-1">
            Total Target Budget <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              id="pool-budget"
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 6000"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This will be split equally among all participants as they join.
          </p>
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
            Create Pool
          </button>
        </div>
      </form>
    </Modal>
  );
};
