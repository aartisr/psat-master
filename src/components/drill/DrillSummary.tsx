import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Zap, 
  Clock, 
  Bookmark, 
  BookmarkCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  BookOpen, 
  Target, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Lightbulb,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Question } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { QuestionPrompt } from '../question/QuestionPrompt';
import { QuestionOptions } from '../question/QuestionOptions';
import { QuestionGridIn } from '../question/QuestionGridIn';
import { QuestionRationale } from '../question/QuestionRationale';
import { DrillReviewModal, DrillAnswerEntry } from './DrillReviewModal';
import { evaluateAnswer, getStandardCorrectAnswer, getResolvedCorrectOption } from '../../utils/answerEvaluator';

export interface DrillSummaryProps {
  title: string;
  total: number;
  correctCount: number;
  totalTimeSeconds: number;
  questions: Question[];
  answers: Record<string, DrillAnswerEntry>;
  bookmarks?: string[];
  onToggleBookmark?: (id: string) => void;
  onRestart: () => void;
  onReturnToBank: () => void;
  onRetryMissed?: (missedQuestions: Question[]) => void;
  onLaunchSkillDrill?: (skill: string, category?: 'Math' | 'Reading and Writing') => void;
  onOpenScratchpad?: (prompt: string) => void;
  onOpenFormulaSheet?: () => void;
  onOpenCalculator?: () => void;
}

export const DrillSummary: React.FC<DrillSummaryProps> = React.memo(({
  title,
  total,
  correctCount,
  totalTimeSeconds,
  questions,
  answers,
  bookmarks = [],
  onToggleBookmark,
  onRestart,
  onReturnToBank,
  onRetryMissed,
  onLaunchSkillDrill,
  onOpenScratchpad,
  onOpenFormulaSheet,
  onOpenCalculator
}) => {
  const missedQuestions = useMemo(
    () => questions.filter((q) => !answers[q.id]?.isCorrect),
    [questions, answers]
  );
  const correctQuestions = useMemo(
    () => questions.filter((q) => answers[q.id]?.isCorrect),
    [questions, answers]
  );

  const missedCount = missedQuestions.length;
  const accuracyPercent = Math.round((correctCount / (total || 1)) * 100);
  const avgTime = Math.round(totalTimeSeconds / (total || 1));

  // Default active tab to 'missed' if there are missed questions, otherwise 'all'
  const [filterTab, setFilterTab] = useState<'all' | 'missed' | 'correct'>(
    missedCount > 0 ? 'missed' : 'all'
  );

  // Track expanded question explanations (default: missed questions expanded)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    missedQuestions.forEach((q) => {
      initial[q.id] = true;
    });
    return initial;
  });

  // Modal walkthrough state
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [walkthroughInitialIndex, setWalkthroughInitialIndex] = useState(0);

  // Bookmark all missed feedback
  const [bookmarkedAllToast, setBookmarkedAllToast] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    questions.forEach((q) => {
      all[q.id] = true;
    });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const handleBookmarkAllMissed = () => {
    if (!onToggleBookmark) return;
    missedQuestions.forEach((q) => {
      if (!bookmarks.includes(q.id)) {
        onToggleBookmark(q.id);
      }
    });
    setBookmarkedAllToast(true);
    setTimeout(() => setBookmarkedAllToast(false), 3000);
  };

  const displayedQuestions = useMemo(() => {
    if (filterTab === 'missed') return missedQuestions;
    if (filterTab === 'correct') return correctQuestions;
    return questions;
  }, [filterTab, missedQuestions, correctQuestions, questions]);

  const handleOpenWalkthroughForIndex = (qIndexInDisplayed: number) => {
    const targetQ = displayedQuestions[qIndexInDisplayed];
    if (!targetQ) return;
    const indexInQuestions = questions.findIndex((q) => q.id === targetQ.id);
    setWalkthroughInitialIndex(indexInQuestions >= 0 ? indexInQuestions : 0);
    setIsWalkthroughOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <Card variant="default" padding="xl" className="space-y-6 text-center border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
          {accuracyPercent >= 80 ? (
            <Trophy className="w-8 h-8 text-amber-500 fill-amber-100" />
          ) : (
            <Target className="w-8 h-8 text-indigo-600" />
          )}
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sprint Session Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            {accuracyPercent === 100
              ? 'Flawless performance! You mastered every single concept in this sprint.'
              : missedCount > 0
              ? `You answered ${correctCount} of ${total} correctly. Review the ${missedCount} missed question${missedCount > 1 ? 's' : ''} and explanations below to solidify your understanding.`
              : 'Great work completing this practice sprint! Review your performance metrics below.'}
          </p>
        </div>

        {/* Score & Metrics Bento Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {correctCount}<span className="text-base sm:text-lg text-slate-400 font-bold">/{total}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Questions Correct</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-0.5 ${
              accuracyPercent >= 80 ? 'text-emerald-600' : accuracyPercent >= 60 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {accuracyPercent}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Concept Mastery</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Pace</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-0.5">
              {avgTime}s
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Per Question</div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {missedCount > 0 && onRetryMissed && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onRetryMissed(missedQuestions)}
              leftIcon={<RotateCcw className="w-4 h-4 text-rose-600" />}
              className="border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-800"
            >
              Re-drill Missed ({missedCount})
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={onRestart}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Retry Full Sprint
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onReturnToBank}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Return to Question Bank
          </Button>
        </div>
      </Card>

      {/* Missed Questions Highlight & Rapid Action Callout */}
      {missedCount > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-950 text-white border border-rose-900 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Targeted Learning Area
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  {missedCount} question{missedCount > 1 ? 's' : ''} to review
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Detailed Answers &amp; Step-by-Step Explanations
              </h3>
              <p className="text-xs sm:text-sm text-rose-200/80 max-w-xl leading-relaxed">
                Reviewing questions you got wrong is the most effective way to eliminate knowledge gaps. Explore full solution paths, common traps, and time-saving shortcuts below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setWalkthroughInitialIndex(0);
                  setIsWalkthroughOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Step-by-Step Walkthrough</span>
              </button>

              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={handleBookmarkAllMissed}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-bold text-xs sm:text-sm rounded-xl border border-rose-700/60 transition-all cursor-pointer"
                  title="Bookmark all missed questions for later review in Mistake Notebook"
                >
                  {bookmarkedAllToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Saved to Notebook!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Bookmark All Missed</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Review Section */}
      <div className="space-y-4">
        {/* Navigation / Filter Tabs & Expand/Collapse Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
            {missedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab('missed')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  filterTab === 'missed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Missed Only ({missedCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>All Questions ({total})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('correct')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterTab === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Correct ({correctCount})</span>
            </button>
          </div>

          {/* Expand/Collapse All */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {displayedQuestions.map((question, displayedIdx) => {
            const indexInTotal = questions.findIndex((q) => q.id === question.id);
            const entry = answers[question.id];
            const isCorr = entry?.isCorrect ?? false;
            const userAnswer = entry?.userAnswer || '';
            const isExpanded = !!expandedIds[question.id];
            const isBookmarked = bookmarks.includes(question.id);

            return (
              <div
                key={question.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden bg-white shadow-xs ${
                  isCorr
                    ? 'border-slate-200 hover:border-emerald-300'
                    : 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-100'
                }`}
              >
                {/* Question Summary Banner / Toggle Bar */}
                <div
                  onClick={() => toggleExpand(question.id)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    isCorr ? 'bg-slate-50/70 hover:bg-slate-100/70' : 'bg-rose-50/50 hover:bg-rose-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isCorr
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {indexInTotal + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          isCorr ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isCorr ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isCorr ? 'Correct' : 'Missed'}
                        </span>
                        <span className="font-extrabold text-sm text-slate-800">{question.skill}</span>
                        <span className="text-[11px] text-slate-500 font-medium">({question.domain})</span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">{question.assessment} · {question.difficulty}</span>
                        {entry && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" /> {entry.timeSpent}s
                          </span>
                        )}
                        {entry?.hintsUsed ? (
                          <span className="flex items-center gap-1 font-semibold text-amber-700">
                            <Lightbulb className="w-3 h-3 text-amber-500" /> {entry.hintsUsed} hint(s)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Answer Contrast & Toggle Icon */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Your answer:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        isCorr ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 line-through'
                      }`}>
                        {userAnswer || '—'}
                      </span>
                      {!isCorr && (
                        <>
                          <span className="text-slate-400 font-medium ml-1">Correct:</span>
                          <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                            {getStandardCorrectAnswer(question)}
                          </span>
                        </>
                      )}
                    </div>

                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(question.id);
                        }}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'
                        }`}
                        title={isBookmarked ? 'Bookmarked' : 'Bookmark this question'}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <div className="p-1 rounded-lg text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Question Body & Rationale */}
                {isExpanded && (
                  <div className="p-5 sm:p-7 border-t border-slate-100 space-y-6 animate-in fade-in-50 duration-200">
                    {/* Full Question Prompt */}
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Question Prompt:
                      </div>
                      <QuestionPrompt question={question} />
                    </div>

                    {/* Answer Options & Comparison */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Answer Options &amp; Solution Map:
                      </div>

                      {question.type === 'multiple_choice' && question.options ? (
                        <QuestionOptions
                          options={question.options}
                          selectedOption={userAnswer}
                          onSelectOption={() => {}}
                          eliminatedOptions={{}}
                          onToggleEliminate={() => {}}
                          isSubmitted={true}
                          correctAnswer={question.correctAnswer}
                        />
                      ) : (
                        <QuestionGridIn
                          value={userAnswer}
                          onChange={() => {}}
                          isSubmitted={true}
                          isCorrect={isCorr}
                          correctAnswer={question.correctAnswer}
                          acceptedAnswers={question.acceptedAnswers}
                        />
                      )}
                    </div>

                    {/* Step-by-Step Official Explanation & AI Deep Breakdown */}
                    <div className="pt-2">
                      <QuestionRationale
                        question={question}
                        isSubmitted={true}
                      />
                    </div>

                    {/* Card Bottom Toolbar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {onLaunchSkillDrill && (
                          <button
                            type="button"
                            onClick={() => onLaunchSkillDrill(question.skill, question.test)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Practice More "{question.skill}" Questions</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenWalkthroughForIndex(displayedIdx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View in Fullscreen Walkthrough</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Step-by-Step Walkthrough Modal */}
      <DrillReviewModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        questions={questions}
        answers={answers}
        bookmarks={bookmarks}
        onToggleBookmark={onToggleBookmark || (() => {})}
        initialQuestionIndex={walkthroughInitialIndex}
        title={title}
        onOpenScratchpad={onOpenScratchpad}
        onOpenFormulaSheet={onOpenFormulaSheet}
        onOpenCalculator={onOpenCalculator}
        onRetryMissed={onRetryMissed ? () => onRetryMissed(missedQuestions) : undefined}
      />
    </div>
  );
});

DrillSummary.displayName = 'DrillSummary';
