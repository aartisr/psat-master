import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lightbulb, 
  Calculator, 
  FileText, 
  PenTool, 
  Sparkles,
  Zap,
  RotateCcw,
  Target
} from 'lucide-react';
import { Question } from '../../types';
import { QuestionPrompt } from '../question/QuestionPrompt';
import { QuestionOptions } from '../question/QuestionOptions';
import { QuestionGridIn } from '../question/QuestionGridIn';
import { QuestionRationale } from '../question/QuestionRationale';
import { formatMathText } from '../common/MathRenderer';
import { getStandardCorrectAnswer, evaluateAnswer } from '../../utils/answerEvaluator';

export interface DrillAnswerEntry {
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  userAnswer?: string;
}

export interface DrillReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  answers: Record<string, DrillAnswerEntry>;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  initialQuestionIndex?: number;
  title?: string;
  onOpenScratchpad?: (prompt: string) => void;
  onOpenFormulaSheet?: () => void;
  onOpenCalculator?: () => void;
  onRetryMissed?: () => void;
}

export const DrillReviewModal: React.FC<DrillReviewModalProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  bookmarks,
  onToggleBookmark,
  initialQuestionIndex = 0,
  title = 'Sprint Review',
  onOpenScratchpad,
  onOpenFormulaSheet,
  onOpenCalculator,
  onRetryMissed
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialQuestionIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialQuestionIndex), Math.max(0, questions.length - 1)));
    }
  }, [isOpen, initialQuestionIndex, questions.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'j') {
        setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, questions.length, onClose]);

  if (!isOpen || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const entry = answers[currentQuestion.id];
  const isCorrect = entry?.isCorrect ?? false;
  const isBookmarked = bookmarks.includes(currentQuestion.id);
  const userAnswer = entry?.userAnswer || '';
  const missedCount = questions.filter((q) => !answers[q.id]?.isCorrect).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-review-modal-title"
      >
        {/* Top Header Bar */}
        <div className="px-5 sm:px-7 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Interactive Step-by-Step Review
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
              <h3 id="drill-review-modal-title" className="text-base sm:text-lg font-extrabold text-white truncate max-w-md">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Test Day Tool Shortcuts */}
            {onOpenCalculator && (
              <button
                type="button"
                onClick={onOpenCalculator}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                title="Open Scientific Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>Calc</span>
              </button>
            )}

            {onOpenFormulaSheet && (
              <button
                type="button"
                onClick={onOpenFormulaSheet}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                title="Open Reference Formula Sheet"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Formulas</span>
              </button>
            )}

            {onOpenScratchpad && (
              <button
                type="button"
                onClick={() => onOpenScratchpad(currentQuestion.prompt)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                title="Open Scratchpad"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                <span>Canvas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700 ml-1"
              aria-label="Close Review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Selector Strip / Progress Dots */}
        <div className="px-5 sm:px-7 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Jump:
            </span>
            {questions.map((q, idx) => {
              const qAns = answers[q.id];
              const qCorr = qAns?.isCorrect;
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`min-w-7 h-7 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                      : qCorr
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                  }`}
                  title={`Question ${idx + 1} (${qCorr ? 'Correct' : 'Missed'}): ${q.skill}`}
                >
                  <span>{idx + 1}</span>
                  {qCorr ? (
                    <span className="text-[10px]">✓</span>
                  ) : (
                    <span className="text-[10px]">✕</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBookmark(currentQuestion.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Saved in Notebook</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bookmark Question</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Question & Explanation Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Status Diagnostic Card */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isCorrect
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base">
                    {isCorrect ? 'Answered Correctly' : 'Missed on First Attempt'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/80 border border-slate-200/80">
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-700">{currentQuestion.test} · {currentQuestion.skill}</span>
                  {entry && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" /> {entry.timeSpent}s spent
                    </span>
                  )}
                  {entry?.hintsUsed ? (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-700 font-semibold">
                      <Lightbulb className="w-3 h-3 text-amber-500" /> {entry.hintsUsed} hint(s) used
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Answer Comparison Pill */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium shadow-2xs">
                <span className="text-slate-500 mr-1.5">Your Response:</span>
                <span className={`font-mono font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700 line-through'}`}>
                  {userAnswer || '(None)'}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xs flex items-center gap-1">
                <span>Correct:</span>
                <span className="font-mono font-extrabold">{getStandardCorrectAnswer(currentQuestion)}</span>
              </div>
            </div>
          </div>

          {/* Question Prompt with Math / Tables / Graph */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pb-2 border-b border-slate-100">
              <span>{currentQuestion.assessment} · {currentQuestion.domain}</span>
              <span className="font-mono text-[11px] text-slate-400">ID: {currentQuestion.id}</span>
            </div>

            <QuestionPrompt question={currentQuestion} />

            {/* Options Display with Solution Highlights */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Answer Options &amp; Breakdown:
                </div>
                <QuestionOptions
                  options={currentQuestion.options}
                  selectedOption={userAnswer}
                  onSelectOption={() => {}}
                  eliminatedOptions={{}}
                  onToggleEliminate={() => {}}
                  isSubmitted={true}
                  correctAnswer={currentQuestion.correctAnswer}
                />
              </div>
            ) : (
              <div className="pt-2">
                <QuestionGridIn
                  value={userAnswer}
                  onChange={() => {}}
                  isSubmitted={true}
                  isCorrect={isCorrect}
                  correctAnswer={currentQuestion.correctAnswer}
                  acceptedAnswers={currentQuestion.acceptedAnswers}
                />
              </div>
            )}
          </div>

          {/* Step-by-Step Official Explanation & AI Breakdown */}
          <div className="bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-3">
            <QuestionRationale
              question={currentQuestion}
              isSubmitted={true}
            />
          </div>
        </div>

        {/* Bottom Navigation Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {onRetryMissed && missedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetryMissed();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Re-drill {missedCount} Missed</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (currentIndex === questions.length - 1) {
                  onClose();
                } else {
                  setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
                }
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish Review' : 'Next Question'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
