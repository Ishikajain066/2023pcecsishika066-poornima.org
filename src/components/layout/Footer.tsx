import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span>FairShare Pool Manager</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Built for fair team contributions
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Local storage persistence • Zero external tracking</span>
        </div>
      </div>
    </footer>
  );
};
