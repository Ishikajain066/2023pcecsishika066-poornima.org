import React from 'react';
import { Modal } from './Modal';
import { FileText, CheckCircle2, Sparkles } from 'lucide-react';

interface BriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo: () => void;
}

export const BriefModal: React.FC<BriefModalProps> = ({
  isOpen,
  onClose,
  onLoadDemo,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Round 2 Assessment Brief"
      subtitle="The original design problem & how FairShare solves each requirement"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Original Challenge Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
            ROUND 2 · BUILD ROUND
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight mb-4">
            Chipping in for the farewell gift
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            The team is buying a farewell gift for their manager — budget <strong>₹6,000</strong>. Everyone agreed to chip in equally, but in practice it's chaos: some have paid their full share, a few paid only part, one generous soul paid extra to cover a friend, and two people haven't paid at all. The organiser is constantly asked <em>'how much do I still owe?'</em> and <em>'have we collected enough yet?'</em> At the end the organiser just wants the simplest list of who should pay whom so everyone lands on their fair share.
          </p>
          <div className="p-3 bg-white/10 rounded-xl text-xs text-indigo-200 border border-white/10 italic">
            <strong>Build something so the organiser can track the pool and settle up fairly.</strong>
            <br />
            (The questions the organiser keeps fielding are your clues — and build for any pool and organiser, not just this one. The easier you make it to see shares, balances and what's left to collect, the better. Start with equal shares and simple balances, then settlements.)
          </div>
        </div>

        {/* Feature Mapping */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            How FairShare Answers Every Clue:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                "Have we collected enough yet?"
              </p>
              <p className="text-slate-600">
                Top dashboard banner & progress bar immediately flags collection status, surplus, or deficit.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                "How much do I still owe?"
              </p>
              <p className="text-slate-600">
                Interactive participant selector shows personal answers: "You still owe ₹600", "You're settled", or "You should receive ₹300".
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                "Covering a friend's share"
              </p>
              <p className="text-slate-600">
                Payments explicitly support "Paid on behalf of" another member while tracking out-of-pocket cash vs pool obligation.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                "Who should pay whom?"
              </p>
              <p className="text-slate-600">
                Greedy debt settlement algorithm generates the minimal direct transfers to square up all balances.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Load the ₹6,000 Scenario Demo
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
