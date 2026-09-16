import React from 'react';
import { Pool, PoolSummary } from '../../types';
import { Gift, Edit3, RotateCcw, Sparkles, Share2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface NavbarProps {
  pool: Pool | null;
  summary: PoolSummary;
  onEditPool: () => void;
  onResetPool: () => void;
  onLoadDemo: () => void;
  onShareSummary: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pool,
  summary,
  onEditPool,
  onResetPool,
  onLoadDemo,
  onShareSummary,
}) => {
  const getStatusBadge = () => {
    switch (summary.status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settled
          </span>
        );
      case 'ready_to_settle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to Settle
          </span>
        );
      case 'fully_collected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fully Collected
          </span>
        );
      case 'collecting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Collecting
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Not Started
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Pool Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Gift className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate">
                {pool ? pool.name : 'FairShare'}
              </h1>
              {pool && getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              Group Contribution & Settlement Pool
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {pool ? (
            <>
              <button
                onClick={onEditPool}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Edit pool budget and name"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Edit Pool</span>
              </button>

              <button
                onClick={onShareSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Share pool overview"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={onLoadDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                title="Load the 6-person demo pool"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Demo Pool</span>
              </button>

              <button
                onClick={onResetPool}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Reset or clear all pool data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </>
          ) : (
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Load Demo Pool
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
