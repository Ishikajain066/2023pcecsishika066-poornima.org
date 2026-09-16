import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${maxWidthClass} overflow-hidden transform transition-all animate-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
