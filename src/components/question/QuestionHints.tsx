import React, { useState } from 'react';
import { Lightbulb, Sparkles, ChevronDown, ChevronUp, Bot, Loader2 } from 'lucide-react';
import { Question, QuestionHint } from '../../types';
import { formatMathText } from '../common/MathRenderer';

export interface QuestionHintsProps {
  question: Question;
  revealedHintLevel: number;
  onRevealNextHint: () => void;
}

export const QuestionHints: React.FC<QuestionHintsProps> = React.memo(({
  question,
  revealedHintLevel,
  onRevealNextHint
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiHint, setAiHint] = useState<{ title: string; text: string } | null>(null);

  const hints = question.hints || [];
  const maxHints = hints.length;
  const hasMoreHints = revealedHintLevel < maxHints;

  const handleFetchAiHint = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          prompt: question.prompt,
          skill: question.skill,
          domain: question.domain,
          difficulty: question.difficulty,
          level: revealedHintLevel + 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiHint({
          title: data.title || 'AI Socratic Coaching Hint',
          text: data.hint || data.text
        });
      } else {
        throw new Error('AI Hint endpoint unavailable');
      }
    } catch {
      // Fallback to static hint if AI call is offline
      if (hasMoreHints) {
        onRevealNextHint();
      } else {
        setAiHint({
          title: 'Socratic Concept Guide',
          text: `Focus on the core standard for ${question.skill}. Identify known variables and translate the prompt constraints step-by-step.`
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (hints.length === 0 && !aiHint) return null;

  return (
    <div className="border-t border-slate-100 pt-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
        >
          <Lightbulb className="w-4 h-4 fill-amber-400 text-amber-600" />
          <span>Socratic Hints ({revealedHintLevel}/{maxHints} Revealed)</span>
          {isDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          {hasMoreHints && (
            <button
              type="button"
              onClick={() => {
                onRevealNextHint();
                setIsDrawerOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              Reveal Hint {revealedHintLevel + 1}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(true);
              handleFetchAiHint();
            }}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Ask AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Expanded Hints Drawer */}
      {isDrawerOpen && (
        <div className="mt-3 space-y-2.5 animate-in fade-in-50 duration-150">
          {hints.slice(0, revealedHintLevel).map((hint: QuestionHint, idx: number) => (
            <div
              key={idx}
              className="p-3 sm:p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-amber-950 space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5 text-amber-900 text-xs uppercase tracking-wider">
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span>{hint.title}</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-sans pl-5.5">
                {formatMathText(hint.hint)}
              </p>
            </div>
          ))}

          {/* AI Generated Hint Card */}
          {aiHint && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-indigo-950 space-y-1.5 shadow-2xs">
              <div className="font-bold flex items-center gap-1.5 text-indigo-900 text-xs uppercase tracking-wider">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>{aiHint.title}</span>
              </div>
              <p className="text-slate-800 leading-relaxed pl-5.5">
                {formatMathText(aiHint.text)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuestionHints.displayName = 'QuestionHints';
