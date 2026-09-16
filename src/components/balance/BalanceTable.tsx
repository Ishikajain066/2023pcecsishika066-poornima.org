import React from 'react';
import { ParticipantBalance } from '../../types';
import { formatINR } from '../../utils/currency';
import { CheckCircle2, AlertCircle, ArrowUpRight, Scale, Info } from 'lucide-react';

interface BalanceTableProps {
  balances: ParticipantBalance[];
}

export const BalanceTable: React.FC<BalanceTableProps> = ({ balances }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Individual Balances & Status
            </h3>
            <p className="text-xs text-slate-500">
              Complete breakdown of fair shares, actual payments, and net obligations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Settled / Paid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Owes money
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Fronted extra
          </span>
        </div>
      </div>

      {balances.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No participant balances available. Add participants to view breakdown.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-6">Participant</th>
                  <th className="py-3.5 px-6">Equal Share</th>
                  <th className="py-3.5 px-6">Total Paid</th>
                  <th className="py-3.5 px-6">Net Balance</th>
                  <th className="py-3.5 px-6">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map((b) => {
                  const isSettled = b.status === 'settled';
                  const isDebtor = b.status === 'owes';
                  const isCreditor = b.status === 'gets';

                  return (
                    <tr key={b.participantId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{b.name}</span>
                            {b.coveredForOthers > 0 && (
                              <p className="text-[11px] font-normal text-purple-600">
                                Fronted {formatINR(b.coveredForOthers)} for friends
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Equal Share */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {formatINR(b.share)}
                      </td>

                      {/* Total Paid */}
                      <td className="py-4 px-6 font-medium">
                        <span className="text-slate-900">{formatINR(b.paidOutOfPocket)}</span>
                        {b.shareRemaining > 0 && (
                          <span className="text-xs text-slate-400 block font-normal">
                            ({formatINR(b.shareRemaining)} left of share)
                          </span>
                        )}
                      </td>

                      {/* Net Balance */}
                      <td className="py-4 px-6 font-bold">
                        {isSettled && <span className="text-slate-500">₹0</span>}
                        {isDebtor && (
                          <span className="text-amber-600 font-bold">
                            -{formatINR(b.amountOwed)}
                          </span>
                        )}
                        {isCreditor && (
                          <span className="text-indigo-600 font-bold">
                            +{formatINR(b.amountToReceive)}
                          </span>
                        )}
                      </td>

                      {/* Status Badge with Text & Icon */}
                      <td className="py-4 px-6">
                        {isSettled && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Settled
                          </span>
                        )}
                        {isDebtor && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Owes {formatINR(b.amountOwed)}
                          </span>
                        )}
                        {isCreditor && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Gets {formatINR(b.amountToReceive)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Card View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {balances.map((b) => (
              <div key={b.participantId} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                      {b.coveredForOthers > 0 && (
                        <p className="text-[11px] text-purple-600">
                          Covered {formatINR(b.coveredForOthers)} for teammate
                        </p>
                      )}
                    </div>
                  </div>

                  {b.status === 'settled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Settled
                    </span>
                  )}
                  {b.status === 'owes' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Owes {formatINR(b.amountOwed)}
                    </span>
                  )}
                  {b.status === 'gets' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Gets {formatINR(b.amountToReceive)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Share</span>
                    <span className="font-semibold text-slate-700">{formatINR(b.share)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paid</span>
                    <span className="font-semibold text-slate-900">{formatINR(b.paidOutOfPocket)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Balance</span>
                    <span
                      className={`font-bold ${
                        b.status === 'owes'
                          ? 'text-amber-600'
                          : b.status === 'gets'
                          ? 'text-indigo-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {b.netBalance < 0
                        ? `-${formatINR(b.amountOwed)}`
                        : b.netBalance > 0
                        ? `+${formatINR(b.amountToReceive)}`
                        : '₹0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Helper Footer Note */}
      <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Net balance = (Total cash paid out of pocket) - (Equal gift share). Sum of all balances reconciles across the pool.
        </span>
      </div>
    </div>
  );
};
