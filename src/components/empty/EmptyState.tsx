import React from 'react';
import { Gift, Sparkles, Users, Calculator, ArrowRightLeft, ShieldCheck, FileText } from 'lucide-react';

interface EmptyStateProps {
  onCreatePool: () => void;
  onLoadDemo: () => void;
  onOpenBrief?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreatePool, onLoadDemo, onOpenBrief }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-8 shadow-sm">
        <Gift className="w-10 h-10 stroke-[1.75]" />
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
        Keep the farewell fund simple.
      </h1>

      {/* Subtitle */}
      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        Track contributions, see what's left to collect, and settle everyone fairly with zero awkward math.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <button
          onClick={onCreatePool}
          className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          <Gift className="w-5 h-5" />
          Create a Pool
        </button>

        <button
          onClick={onLoadDemo}
          className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          Load Demo Pool (₹6,000)
        </button>
      </div>

      {/* Prompt Brief link */}
      {onOpenBrief && (
        <div className="mb-16">
          <button
            onClick={onOpenBrief}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            View Round 2 Assessment Scenario & Brief
          </button>
        </div>
      )}

      {/* Value Proposition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Flexible Contributions
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Support full payments, partial payments, extra payments, and paying on behalf of friends.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Automatic Balance Tracking
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Instantly answers "How much do I owe?" and "Have we collected enough?" in plain Rupees.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Smart Settle-Up
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Greedy settlement algorithm calculates the absolute fewest cash transfers to make everyone even.
          </p>
        </div>
      </div>

      {/* Persistence note */}
      <div className="mt-12 inline-flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Runs with embedded SQLite database (`better-sqlite3`) & offline browser fallback.
      </div>
    </div>
  );
};
