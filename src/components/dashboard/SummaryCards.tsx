import React from 'react';
import { PoolSummary } from '../../types';
import { formatINR } from '../../utils/currency';
import { Target, Wallet, Clock, Users, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

interface SummaryCardsProps {
  summary: PoolSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const isFullyCollected = summary.totalCollected >= summary.targetBudget && summary.targetBudget > 0;
  const isOverTarget = summary.excessCollected > 0;

  return (
    <div className="space-y-4">
      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Budget
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {formatINR(summary.targetBudget)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {summary.participantCount} participant{summary.participantCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Collected
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatINR(summary.totalCollected)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {summary.percentCollected}% of total goal
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Remaining / Excess */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {isOverTarget ? 'Extra Surplus' : 'Remaining to Collect'}
            </p>
            <h3
              className={`text-2xl font-bold ${
                isOverTarget
                  ? 'text-indigo-600'
                  : summary.remainingToCollect > 0
                  ? 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {isOverTarget
                ? `+${formatINR(summary.excessCollected)}`
                : formatINR(summary.remainingToCollect)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isOverTarget
                ? 'Will be refunded/settled'
                : summary.remainingToCollect > 0
                ? 'Still owed to pool'
                : 'Target reached!'}
            </p>
          </div>
          <div
            className={`p-2.5 rounded-xl ${
              isOverTarget
                ? 'bg-indigo-50 text-indigo-600'
                : summary.remainingToCollect > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isOverTarget ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : summary.remainingToCollect > 0 ? (
              <Clock className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Per Person (Equal Share) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Equal Share / Person
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {formatINR(summary.equalShare)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.participantCount > 0
                ? `Split among ${summary.participantCount}`
                : 'Add participants'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress & Collection Status Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isOverTarget ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatINR(summary.excessCollected)} over target
              </span>
            ) : isFullyCollected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pool fully collected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {formatINR(summary.remainingToCollect)} left to collect
              </span>
            )}

            <span className="text-xs text-slate-500">
              ({formatINR(summary.totalCollected)} of {formatINR(summary.targetBudget)})
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-700">
            {summary.percentCollected}% collected
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyCollected ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, summary.percentCollected)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
