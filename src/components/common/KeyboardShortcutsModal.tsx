import React from 'react';
import { X, Keyboard, Sparkles, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyCombo: string[];
  description: string;
  category: 'Answering' | 'Tools' | 'Navigation';
}

const SHORTCUTS: ShortcutItem[] = [
  { keyCombo: ['1', '2', '3', '4'], description: 'Select Multiple Choice options A, B, C, D', category: 'Answering' },
  { keyCombo: ['A', 'B', 'C', 'D'], description: 'Direct letter selection for options', category: 'Answering' },
  { keyCombo: ['Enter'], description: 'Submit current answer', category: 'Answering' },
  { keyCombo: ['H'], description: 'Reveal next Socratic hint step-by-step', category: 'Answering' },
  { keyCombo: ['B'], description: 'Toggle bookmark on current question', category: 'Answering' },
  { keyCombo: ['C'], description: 'Open / close Scientific Calculator', category: 'Tools' },
  { keyCombo: ['F'], description: 'Open / close Math Formula Reference Sheet', category: 'Tools' },
  { keyCombo: ['S'], description: 'Open / close Digital Scratchpad canvas', category: 'Tools' },
  { keyCombo: ['?'], description: 'Open this Keyboard Shortcuts cheat-sheet', category: 'Tools' },
  { keyCombo: ['N', '→'], description: 'Navigate to Next question in drill', category: 'Navigation' },
  { keyCombo: ['P', '←'], description: 'Navigate to Previous question in drill', category: 'Navigation' },
  { keyCombo: ['Esc'], description: 'Close any active popup, drawer or modal', category: 'Navigation' }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/90 rounded-2xl shadow-inner">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Power-User Keyboard Shortcuts
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 rounded-md border border-indigo-400/30">
                  Speed Run
                </span>
              </h2>
              <p className="text-xs text-slate-300">Blaze through Digital PSAT questions with zero mouse friction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {(['Answering', 'Tools', 'Navigation'] as const).map((category) => {
            const items = SHORTCUTS.filter((s) => s.category === category);
            return (
              <div key={category} className="space-y-2.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>{category} Shortcuts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {items.map((shortcut, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <span className="text-xs font-medium text-slate-700 leading-snug">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {shortcut.keyCombo.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 min-w-[24px] text-center text-xs font-mono font-bold bg-white text-slate-900 border border-slate-300 rounded-lg shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-slate-300 rounded shadow-2xs">?</kbd> anytime to open this menu
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
