import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Participant } from '../../types';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, participantId?: string) => void;
  existingParticipants: Participant[];
  editingParticipant?: Participant | null;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingParticipants,
  editingParticipant,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingParticipant) {
      setName(editingParticipant.name);
    } else {
      setName('');
    }
    setError(null);
  }, [editingParticipant, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter a participant name.');
      return;
    }

    // Check for duplicate name (case-insensitive) excluding self if editing
    const isDuplicate = existingParticipants.some(
      (p) =>
        p.name.toLowerCase() === trimmed.toLowerCase() &&
        p.id !== editingParticipant?.id
    );

    if (isDuplicate) {
      setError(`A participant named "${trimmed}" already exists.`);
      return;
    }

    setError(null);
    onSave(trimmed, editingParticipant?.id);
    setName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingParticipant ? 'Edit Participant' : 'Add Participant'}
      subtitle="Adding a participant will automatically adjust the equal share for everyone"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="participant-name" className="block text-sm font-medium text-slate-700 mb-1">
            Participant Name <span className="text-red-500">*</span>
          </label>
          <input
            id="participant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {editingParticipant ? 'Save Changes' : 'Add to Pool'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
