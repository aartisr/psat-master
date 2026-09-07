import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface QuestionGridInProps {
  value: string;
  onChange: (val: string) => void;
  isSubmitted: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  acceptedAnswers?: string[];
}

export const QuestionGridIn: React.FC<QuestionGridInProps> = React.memo(({
  value,
  onChange,
  isSubmitted,
  isCorrect,
  correctAnswer,
  acceptedAnswers = []
}) => {
  // Compute decimal evaluation preview if student types a fraction like 7/8
  let decimalPreview: string | null = null;
  if (value.includes('/') && !value.endsWith('/')) {
    const [num, den] = value.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      decimalPreview = (num / den).toFixed(4).replace(/\.?0+$/, '');
    }
  }

  return (
    <div className="pt-2 max-w-sm space-y-2">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Student-Produced Response (Grid-In)
      </label>

      <div className="relative">
        <input
          type="text"
          disabled={isSubmitted}
          value={value}
          onChange={(e) => {
            // Allow numbers, negative sign, decimal point, and slash for fractions
            const cleaned = e.target.value.replace(/[^0-9./-]/g, '');
            onChange(cleaned);
          }}
          placeholder="e.g. 4.5 or 9/2"
          className={`w-full px-4 py-3 rounded-xl border font-mono text-base sm:text-lg font-bold tracking-wider outline-none transition-all ${
            isSubmitted
              ? isCorrect
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500'
                : 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400'
              : 'bg-white border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500'
          }`}
        />

        {isSubmitted && (
          <div className="absolute right-3.5 top-3.5">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 fill-rose-100" />
            )}
          </div>
        )}
      </div>

      {/* Real-time fraction-to-decimal helper */}
      {decimalPreview && !isSubmitted && (
        <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5 px-1">
          <span>Decimal equivalent:</span>
          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
            {decimalPreview}
          </span>
        </div>
      )}

      {isSubmitted && !isCorrect && (
        <div className="text-xs font-medium text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 space-y-1">
          <div>
            Correct Answer:{' '}
            <span className="font-mono font-bold text-rose-900">{correctAnswer}</span>
          </div>
          {acceptedAnswers.length > 0 && (
            <div className="text-slate-500 text-[11px]">
              Also accepted: {acceptedAnswers.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuestionGridIn.displayName = 'QuestionGridIn';
