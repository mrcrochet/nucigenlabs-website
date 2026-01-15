/**
 * PersonalizationModal Component
 * 
 * Modal for customizing Discover experience
 * Similar to Perplexity's "Make it yours" modal
 */

import { X } from 'lucide-react';
import { useState } from 'react';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interests: string[]) => void;
}

const availableInterests = [
  'Tech & Science',
  'Finance',
  'Arts & Culture',
  'Sports',
  'Entertainment',
  'Politics',
  'Business',
  'Health',
  'World News',
];

export default function PersonalizationModal({ isOpen, onClose, onSave }: PersonalizationModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tech & Science', 'Finance', 'Arts & Culture']);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = () => {
    onSave(selectedInterests);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-2xl font-light text-white mb-2">Make it yours</h2>
            <p className="text-sm text-slate-400 font-light">
              Select topics and interests to customize your Discover experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {availableInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                    isSelected
                      ? 'bg-[#E1463E] text-white border border-[#E1463E]'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors font-light"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#E1463E] text-white rounded-lg text-sm font-light hover:bg-[#E1463E]/90 transition-colors"
          >
            Save Interests
          </button>
        </div>
      </div>
    </div>
  );
}
