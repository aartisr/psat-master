import React from 'react';
import { 
  AlertCircle, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Lightbulb, 
  ArrowRight,
  Flame,
  BookmarkCheck,
  Zap,
  Target,
  LogIn,
  ShieldAlert
} from 'lucide-react';
import { Question, UserAttempt, UserProfile } from '../types';
import { QuestionCard } from './QuestionCard';

interface MistakeNotebookProps {
  attempts: UserAttempt[];
  allQuestions: Question[];
  bookmarks: string[];
  currentUser?: UserProfile | null;
  onToggleBookmark: (id: string) => void;
  onQuestionAttempt: (questionId: string, isCorrect: boolean, timeSpent: number, hintsUsed: number) => void;
  onLaunchRedoMarathon: (questionIds: string[]) => void;
  onReportQuestionIssue?: (questionId: string) => void;
  onOpenAuthModal?: () => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  attempts,
  allQuestions,
  bookmarks,
  currentUser,
  onToggleBookmark,
  onQuestionAttempt,
  onLaunchRedoMarathon,
  onReportQuestionIssue,
  onOpenAuthModal
}) => {
  // Find questions with at least one incorrect attempt
  const missedQuestionIds: string[] = Array.from(
    new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.questionId))
  );

  // Separate into still un-mastered (last attempt was incorrect) vs redeemed (last attempt was correct)
  const lastAttemptByQuestion: Record<string, UserAttempt> = {};
  attempts.forEach((a) => {
    lastAttemptByQuestion[a.questionId] = a;
  });

  const activeMistakes = missedQuestionIds
    .filter((id: string) => lastAttemptByQuestion[id] && !lastAttemptByQuestion[id].isCorrect)
    .map((id: string) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));

  const resolvedMistakes = missedQuestionIds
    .filter((id: string) => lastAttemptByQuestion[id] && lastAttemptByQuestion[id].isCorrect)
    .map((id: string) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));

  const isGuest = !currentUser || currentUser.isAnonymous;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-rose-500/20 rounded-full text-xs font-extrabold uppercase tracking-wider text-rose-300 border border-rose-400/30 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Error Diagnostic Notebook
            </span>
            <span className="text-xs text-slate-300 font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              {activeMistakes.length} Active • {resolvedMistakes.length} Mastered
            </span>
            {isGuest && (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-extrabold uppercase">
                Guest Mode
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">Mistake Elimination Log</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Targeted error analysis and re-drilling missed questions until 100% mastery is achieved.
          </p>
        </div>

        {activeMistakes.length > 0 && (
          <button
            onClick={() => onLaunchRedoMarathon(activeMistakes.map((q) => q.id))}
            className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 shrink-0 relative z-10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Launch Redo Marathon ({activeMistakes.length})</span>
          </button>
        )}
      </div>

      {/* Socratic Error Diagnostic Matrix */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            The 4 Types of SAT Exam Errors
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">1. Misread Prompt</span>
            <p className="text-slate-500 text-[11px] leading-snug">Solving for x when prompt asked for 2x + 1, or ignoring "EXCEPT" / "NOT".</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">2. Conceptual Gap</span>
            <p className="text-slate-500 text-[11px] leading-snug">Unfamiliarity with a formula, punctuation rule, or vocabulary word.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">3. Careless Computation</span>
            <p className="text-slate-500 text-[11px] leading-snug">Dropped negative sign, exponent error, or wrong fraction reduction.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">4. Time Constraint</span>
            <p className="text-slate-500 text-[11px] leading-snug">Rushing through options with under 30 seconds remaining on module clock.</p>
          </div>
        </div>
      </div>

      {/* Guest Mode Functional Clarity Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/80 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-amber-950 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] ring-1 ring-amber-900/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5 border border-amber-200 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-amber-950">
                  Guest Session Mistake Log
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-200/90 text-amber-900 rounded-md border border-amber-300">
                  Temporary Session
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-amber-900/80 max-w-2xl leading-relaxed">
                You can freely practice and re-drill any questions you miss during this active session. However, <strong>long-term error diagnosis</strong>, <strong>multi-week mistake tracking</strong>, and <strong>cross-device notebook sync</strong> require a free student account.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm shadow-amber-600/25 transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Save Mistakes</span>
            </button>
          )}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Questions Needing Redo
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">
            {activeMistakes.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Review rationales & retry</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Redeemed & Mastered
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {resolvedMistakes.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Originally missed, now correct!</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Error Recovery Rate
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700">
            {missedQuestionIds.length > 0
              ? Math.round((resolvedMistakes.length / missedQuestionIds.length) * 100)
              : 100}
            %
          </div>
          <p className="text-xs text-slate-500 mt-1">Target 100% before test day</p>
        </div>
      </div>

      {/* Active Mistakes List */}
      {activeMistakes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Active Mistakes!</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            You have no pending incorrect questions. Keep practicing from the Question Bank or launch a Daily Drill to challenge yourself!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-600" />
              Pending Questions to Master ({activeMistakes.length})
            </h2>
          </div>

          <div className="space-y-6">
            {activeMistakes.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isBookmarked={bookmarks.includes(question.id)}
                onToggleBookmark={onToggleBookmark}
                onAttemptSubmitted={(isCorrect, timeSpent, hintsUsed) =>
                  onQuestionAttempt(question.id, isCorrect, timeSpent, hintsUsed)
                }
                onReportIssue={onReportQuestionIssue}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
