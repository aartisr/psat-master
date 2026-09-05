import React from 'react';
import { CheckCircle2, XCircle, Strikethrough } from 'lucide-react';
import { QuestionOption } from '../../types';
import { formatMathText } from '../common/MathRenderer';

export interface QuestionOptionsProps {
  options: QuestionOption[];
  selectedOption: string;
  onSelectOption: (label: string) => void;
  eliminatedOptions: Record<string, boolean>;
  onToggleEliminate: (label: string) => void;
  isSubmitted: boolean;
  correctAnswer: string;
}

export const QuestionOptions: React.FC<QuestionOptionsProps> = React.memo(({
  options,
  selectedOption,
  onSelectOption,
  eliminatedOptions,
  onToggleEliminate,
  isSubmitted,
  correctAnswer
}) => {
  return (
    <div className="space-y-2.5 pt-2">
      {options.map((option) => {
        const isSelected = selectedOption === option.label;
        const isCorrectOption = option.label === correctAnswer;
        const isEliminated = !!eliminatedOptions[option.label];

        let containerStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white';
        let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
        let textStyle = 'text-slate-800';

        if (isEliminated && !isSubmitted) {
          containerStyle = 'border-slate-200 bg-slate-50/60 opacity-45';
          badgeStyle = 'bg-slate-200 text-slate-400 border-slate-300 line-through';
          textStyle = 'text-slate-400 line-through';
        } else if (isSubmitted) {
          if (isCorrectOption) {
            containerStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500';
            badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
            textStyle = 'text-emerald-900';
          } else if (isSelected && !isCorrectOption) {
            containerStyle = 'border-rose-400 bg-rose-50/70 text-rose-950 ring-1 ring-rose-400';
            badgeStyle = 'bg-rose-600 text-white border-rose-600';
            textStyle = 'text-rose-900';
          } else {
            containerStyle = 'border-slate-200 bg-white opacity-60';
          }
        } else if (isSelected) {
          containerStyle = 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500 shadow-xs';
          badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
          textStyle = 'text-indigo-950 font-medium';
        }

        return (
          <div
            key={option.label}
            className={`group relative flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-150 select-none ${containerStyle}`}
          >
            {/* Clickable Area for Selecting Answer */}
            <button
              type="button"
              disabled={isSubmitted || isEliminated}
              onClick={() => onSelectOption(option.label)}
              className="flex items-start gap-3 flex-1 text-left cursor-pointer disabled:cursor-default"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border shrink-0 transition-transform ${
                  isSelected && !isSubmitted ? 'scale-105' : ''
                } ${badgeStyle}`}
              >
                {option.label}
              </div>

              <div className={`text-xs sm:text-sm pt-1 leading-relaxed flex-1 ${textStyle}`}>
                {formatMathText(option.text)}
              </div>
            </button>

            {/* Status Icons on Submit */}
            {isSubmitted && (
              <div className="pt-1.5 shrink-0">
                {isCorrectOption ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                ) : isSelected ? (
                  <XCircle className="w-5 h-5 text-rose-600 fill-rose-100" />
                ) : null}
              </div>
            )}

            {/* Strike-through / Elimination Toggle */}
            {!isSubmitted && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEliminate(option.label);
                }}
                className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                  isEliminated
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                }`}
                title={isEliminated ? 'Restore option' : 'Cross out option (Eliminate)'}
                aria-label={`Eliminate option ${option.label}`}
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});

QuestionOptions.displayName = 'QuestionOptions';
