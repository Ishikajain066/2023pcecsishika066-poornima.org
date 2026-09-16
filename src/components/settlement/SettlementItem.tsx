import React from 'react';
import { SettlementTransfer } from '../../types';
import { formatINR } from '../../utils/currency';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';

interface SettlementItemProps {
  index: number;
  transfer: SettlementTransfer;
  onToggleComplete: (id: string) => void;
}

export const SettlementItem: React.FC<SettlementItemProps> = ({
  index,
  transfer,
  onToggleComplete,
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        transfer.isCompleted
          ? 'bg-emerald-50/50 border-emerald-200/80'
          : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Step indicator & participants */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              transfer.isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {transfer.isCompleted ? <Check className="w-4 h-4" /> : index + 1}
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-wrap text-sm">
            <span
              className={`font-bold ${
                transfer.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}
            >
              {transfer.fromName}
            </span>

            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              pays
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </span>

            <span
              className={`font-bold ${
                transfer.isCompleted ? 'text-slate-500 line-through' : 'text-indigo-900'
              }`}
            >
              {transfer.toName}
            </span>

            <span
              className={`ml-1 px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                transfer.isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              {formatINR(transfer.amount)}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={() => onToggleComplete(transfer.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              transfer.isCompleted
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            {transfer.isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settled (Undo)
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Mark as paid
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
