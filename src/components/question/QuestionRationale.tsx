import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Zap, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';
import { Question } from '../../types';
import { formatMathText } from '../common/MathRenderer';

export interface QuestionRationaleProps {
  question: Question;
  isSubmitted: boolean;
}

export const QuestionRationale: React.FC<QuestionRationaleProps> = React.memo(({
  question,
  isSubmitted
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isSubmitted);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiBreakdown, setAiBreakdown] = useState<{
    stepByStep: string;
    coreRule: string;
    commonTrap: string;
    timeSavingTip: string;
  } | null>(null);

  const handleFetchAiBreakdown = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          prompt: question.prompt,
          correctAnswer: question.correctAnswer,
          rationale: question.rationale,
          skill: question.skill,
          domain: question.domain
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiBreakdown(data);
      } else {
        throw new Error('AI Breakdown offline');
      }
    } catch {
      setAiBreakdown({
        stepByStep: question.rationale,
        coreRule: `Key Concept: Master the standard relationship for ${question.skill}.`,
        commonTrap: 'Common mistake: Rushing the algebraic substitution or sign changes.',
        timeSavingTip: 'Fast test-day strategy: Plug in test options directly or inspect extreme values.'
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Step-by-Step Official Rationale</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            handleFetchAiBreakdown();
          }}
          disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          {aiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>AI Deep Breakdown</span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3.5 animate-in fade-in-50 duration-200">
          {/* Main Official Explanation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Correct Answer:
              </span>
              <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-xs">
                {question.correctAnswer}
              </span>
            </div>
            <p className="whitespace-pre-line text-slate-700 font-normal">
              {formatMathText(question.rationale)}
            </p>
          </div>

          {/* AI Deep Analytical Breakdown */}
          {aiBreakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in zoom-in-98 duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Core Rule & Foundation</span>
                </div>
                <p className="leading-relaxed text-slate-800">{formatMathText(aiBreakdown.coreRule)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Common Trap to Avoid</span>
                </div>
                <p className="leading-relaxed text-slate-800">{formatMathText(aiBreakdown.commonTrap)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1 md:col-span-2">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Time-Saving Test-Day Shortcut</span>
                </div>
                <p className="leading-relaxed text-slate-800">{formatMathText(aiBreakdown.timeSavingTip)}</p>
              </div>
            </div>
          )}

          {/* Concepts Tags */}
          {question.concepts && question.concepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Tested Concepts:
              </span>
              {question.concepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuestionRationale.displayName = 'QuestionRationale';
