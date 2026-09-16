import React, { useState } from 'react';
import { SettlementTransfer, ParticipantBalance } from '../../types';
import { SettlementItem } from './SettlementItem';
import { formatINR } from '../../utils/currency';
import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface SettlementPanelProps {
  transfers: SettlementTransfer[];
  balances: ParticipantBalance[];
  poolName: string;
  onToggleComplete: (id: string) => void;
  onResetAllSettlements: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const SettlementPanel: React.FC<SettlementPanelProps> = ({
  transfers,
  balances,
  poolName,
  onToggleComplete,
  onResetAllSettlements,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const completedCount = transfers.filter((t) => t.isCompleted).length;
  const isAllCompleted = transfers.length > 0 && completedCount === transfers.length;

  const totalTransferAmount = transfers.reduce((sum, t) => sum + t.amount, 0);

  const handleCopyText = () => {
    if (transfers.length === 0) return;

    let text = `🎁 *${poolName} — Settlement Plan*\n\n`;
    text += `Fewest practical transfers to settle everyone fairly:\n\n`;

    transfers.forEach((t, idx) => {
      const checkMark = t.isCompleted ? '✅ ' : '⏳ ';
      text += `${idx + 1}. ${checkMark}${t.fromName} pays ${t.toName} ${formatINR(t.amount)}\n`;
    });

    text += `\nTotal amount settling: ${formatINR(totalTransferAmount)}\n`;
    text += `Generated with FairShare Group Gift Pool.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onShowToast('Copied to Clipboard!', 'Settlement summary formatted for WhatsApp or Slack.', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Fair Settlement Engine
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Simple settlement plan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's the fewest practical transfers needed to settle everyone.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {transfers.length > 0 && (
            <>
              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                title="Copy formatted settlement plan for WhatsApp or Slack"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy for Team'}
              </button>

              {completedCount > 0 && (
                <button
                  onClick={onResetAllSettlements}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  title="Reset all marked settlements"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Checks
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {transfers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              No settlements needed!
            </h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Everyone is currently settled or has contributed their fair share. As more payments or participants are logged, optimal transfer instructions will automatically appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Completion Banner */}
            {isAllCompleted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    All transfers completed! 🎉
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Everyone has squared up their debts. The farewell gift pool is completely settled!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  <strong>{completedCount}</strong> of <strong>{transfers.length}</strong> transfers completed
                </span>
                <span>
                  Total transferring: <strong className="text-slate-800">{formatINR(totalTransferAmount)}</strong>
                </span>
              </div>
            )}

            {/* List of settlement items */}
            <div className="space-y-2.5">
              {transfers.map((transfer, index) => (
                <SettlementItem
                  key={transfer.id}
                  index={index}
                  transfer={transfer}
                  onToggleComplete={onToggleComplete}
                />
              ))}
            </div>

            {/* Invariant & algorithm note */}
            <div className="pt-2 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <p>
                Greedy net-balance algorithm minimizes total transactions by matching maximum debtors with maximum creditors. Total amount transferring exactly reconciles outstanding debtor balances.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
