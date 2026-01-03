/**
 * Multi-Select Component
 * For selecting multiple options (sectors, regions, event types, etc.)
 */

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  maxSelections?: number;
  className?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  label,
  helperText,
  maxSelections,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return; // Don't add if max reached
      }
      onChange([...selected, value]);
    }
  };

  const removeSelection = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== value));
  };

  const selectedLabels = selected.map(val => 
    options.find(opt => opt.value === val)?.label || val
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/[0.07] transition-colors flex items-center justify-between min-h-[48px]"
      >
        <div className="flex-1 flex flex-wrap gap-2">
          {selected.length === 0 ? (
            <span className="text-slate-500 font-light">{placeholder}</span>
          ) : (
            selectedLabels.map(label => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 rounded-md text-xs text-white"
              >
                {label}
                <button
                  onClick={(e) => removeSelection(
                    options.find(opt => opt.label === label)?.value || '',
                    e
                  )}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0F0F0F] border border-white/10 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E1463E] text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option.value);
                const isDisabled = maxSelections && !isSelected && selected.length >= maxSelections;

                return (
                  <div
                    key={option.value}
                    onClick={() => !isDisabled && toggleSelection(option.value)}
                    className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-white/10' : ''
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected ? 'border-[#E1463E] bg-[#E1463E]' : 'border-white/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-white font-light">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {maxSelections && (
            <div className="p-2 border-t border-white/10 text-xs text-slate-500 text-center">
              {selected.length} / {maxSelections} selected
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="mt-1.5 text-xs text-slate-500 font-light">
          {helperText}
        </p>
      )}
    </div>
  );
}

