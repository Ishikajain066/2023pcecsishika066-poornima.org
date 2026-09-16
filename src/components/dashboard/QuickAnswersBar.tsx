import React, { useState } from 'react';
import { ParticipantBalance, PoolSummary } from '../../types';
import { formatINR } from '../../utils/currency';
import { HelpCircle, CheckCircle2, AlertCircle, ArrowUpRight, UserCheck, Search } from 'lucide-react';

interface QuickAnswersBarProps {
  summary: PoolSummary;
  balances: ParticipantBalance[];
}

export const QuickAnswersBar: React.FC<QuickAnswersBarProps> = ({ summary, balances }) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    balances.length > 0 ? balances[0].participantId : ''
  );

  const selectedBalance =
    balances.find((b) => b.participantId === selectedParticipantId) || balances[0];

  const fullyPaidCount = balances.filter((b) => b.status === 'settled' || b.status === 'gets').length;
  const pendingCount = balances.filter((b) => b.status === 'owes').length;

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            Organiser Quick Answers
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Have we collected enough yet?
          </h2>
        </div>

        {/* Quick Answer 1 */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
          {summary.excessCollected > 0 ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-200">Collection Status</p>
                <p className="text-sm font-bold text-emerald-300">
                  Yes! {formatINR(summary.excessCollected)} over target
                </p>
              </div>
            </>
          ) : summary.remainingToCollect === 0 && summary.targetBudget > 0 ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-200">Collection Status</p>
                <p className="text-sm font-bold text-emerald-300">
                  Yes! Pool is fully collected
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-200">Collection Status</p>
                <p className="text-sm font-bold text-amber-300">
                  Not yet: {formatINR(summary.remainingToCollect)} left to collect
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Second Quick Answer: "How much do I still owe?" */}
      <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5">
          <label
            htmlFor="participant-selector"
            className="block text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-indigo-300" />
            Check personal balance ("How much do I owe?")
          </label>
          <div className="relative">
            <select
              id="participant-selector"
              value={selectedBalance ? selectedBalance.participantId : ''}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              className="w-full bg-indigo-950/80 border border-indigo-700/80 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer appearance-none"
            >
              {balances.map((b) => (
                <option key={b.participantId} value={b.participantId} className="bg-slate-900 text-white">
                  {b.name} (Paid: {formatINR(b.paidOutOfPocket)})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-indigo-300">
              <Search className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-indigo-200">
            <span>
              <strong className="text-emerald-400">{fullyPaidCount}</strong> covered / settled
            </span>
            <span>•</span>
            <span>
              <strong className="text-amber-400">{pendingCount}</strong> still owe
            </span>
          </div>
        </div>

        {/* Dynamic Personal Answer Card */}
        {selectedBalance && (
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-indigo-200">Status for {selectedBalance.name}:</p>
              <h3 className="text-lg font-bold mt-0.5">
                {selectedBalance.status === 'owes' && (
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    You still owe {formatINR(selectedBalance.amountOwed)}
                  </span>
                )}
                {selectedBalance.status === 'gets' && (
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    You should receive {formatINR(selectedBalance.amountToReceive)}
                  </span>
                )}
                {selectedBalance.status === 'settled' && (
                  <span className="text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    You're settled! (Fair share paid)
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-indigo-800/80 pt-3 sm:pt-0 sm:pl-4">
              <div>
                <p className="text-indigo-300">Share</p>
                <p className="font-semibold text-white">{formatINR(selectedBalance.share)}</p>
              </div>
              <div>
                <p className="text-indigo-300">Paid</p>
                <p className="font-semibold text-white">{formatINR(selectedBalance.paidOutOfPocket)}</p>
              </div>
              <div>
                <p className="text-indigo-300">Net</p>
                <p
                  className={`font-semibold ${
                    selectedBalance.netBalance < 0
                      ? 'text-amber-400'
                      : selectedBalance.netBalance > 0
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {formatINR(selectedBalance.netBalance)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
