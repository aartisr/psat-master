import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowRight, 
  RotateCcw, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Share2, 
  Download,
  Zap,
  BookOpen,
  Filter
} from 'lucide-react';
import { PracticeTestResult, Question, PracticeTestAnswerRecord } from '../../types';
import { MathText } from '../common/MathRenderer';

interface BluebookScoreReportViewProps {
  result: PracticeTestResult;
  onLaunchMissedDrill: (missedQuestionIds: string[]) => void;
  onReturnToCatalog: () => void;
}

export const BluebookScoreReportView: React.FC<BluebookScoreReportViewProps> = ({
  result,
  onLaunchMissedDrill,
  onReturnToCatalog
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'incorrect' | 'correct' | 'marked'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const missedIds: string[] = [];
  const correctIds: string[] = [];
  const markedIds: string[] = [];

  Object.entries(result.answers as Record<string, PracticeTestAnswerRecord>).forEach(([id, rec]) => {
    const isCorrect = typeof rec.isCorrect === 'object' ? (rec.isCorrect as any).isCorrect : !!rec.isCorrect;
    if (!isCorrect) missedIds.push(id);
    else correctIds.push(id);
    if (rec.markedForReview) markedIds.push(id);
  });

  const totalTimeMinutes = Math.round(result.totalTimeSpentSeconds / 60);

  // Filter questions for the question-by-question review table
  const allResultQuestionIds = Object.keys(result.questions);
  const filteredQuestionIds = allResultQuestionIds.filter((id) => {
    const rec = (result.answers as Record<string, PracticeTestAnswerRecord>)[id];
    const isCorrect = rec ? (typeof rec.isCorrect === 'object' ? (rec.isCorrect as any).isCorrect : !!rec.isCorrect) : false;
    if (activeFilter === 'incorrect') return !isCorrect;
    if (activeFilter === 'correct') return isCorrect;
    if (activeFilter === 'marked') return !!rec?.markedForReview;
    return true;
  });

  // National Merit tier assessment
  const getSelectionIndexTier = (si: number) => {
    if (si >= 218) return { label: 'Top Semifinalist Qualifying Tier', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (si >= 208) return { label: 'Competitive Commended / Semifinalist Range', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (si >= 195) return { label: 'Strong College Ready Tier', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    return { label: 'Developing Readiness Tier', color: 'text-slate-700 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Composite Score & NMSC Selection Index */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Official Score Report &bull; {result.testTitle}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Exam Performance Diagnostic</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Completed on {new Date(result.completedAt).toLocaleDateString()} &bull; Total Time: {totalTimeMinutes} minutes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToCatalog}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Back to Tests Hub
            </button>
            {missedIds.length > 0 && (
              <button
                onClick={() => onLaunchMissedDrill(missedIds)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Practice Missed Qs ({missedIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 relative z-10">
          {/* Total Composite Score */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Composite Score</span>
            <div className="flex items-baseline justify-center gap-1.5 pt-1">
              <span className="font-mono text-4xl sm:text-5xl font-black text-blue-400">{result.compositeScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ {result.maxCompositeScore}</span>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold">
                {result.percentile}th National Percentile
              </span>
            </div>
          </div>

          {/* Reading & Writing Section Score */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reading &amp; Writing</span>
            <div className="flex items-baseline justify-center gap-1.5 pt-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">{result.rwSection.scaledScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ {result.testType === 'SAT' ? '800' : '760'}</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-300">
              <span>{result.rwSection.rawScore} / {result.rwSection.maxRawScore} Raw Correct</span>
              <span className="mx-1">&bull;</span>
              <span className={result.rwSection.module2Stage === 'hard' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {result.rwSection.module2Stage === 'hard' ? 'Upper Stage' : 'Lower Stage'}
              </span>
            </div>
          </div>

          {/* Math Section Score */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Math</span>
            <div className="flex items-baseline justify-center gap-1.5 pt-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">{result.mathSection.scaledScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ {result.testType === 'SAT' ? '800' : '760'}</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-300">
              <span>{result.mathSection.rawScore} / {result.mathSection.maxRawScore} Raw Correct</span>
              <span className="mx-1">&bull;</span>
              <span className={result.mathSection.module2Stage === 'hard' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {result.mathSection.module2Stage === 'hard' ? 'Upper Stage' : 'Lower Stage'}
              </span>
            </div>
          </div>
        </div>

        {/* NMSC Selection Index Banner if PSAT */}
        {result.selectionIndex !== undefined && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">NMSC Selection Index</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-black text-amber-400">{result.selectionIndex}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 228</span>
                </div>
              </div>
            </div>

            <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold ${getSelectionIndexTier(result.selectionIndex).color}`}>
              {getSelectionIndexTier(result.selectionIndex).label}
            </div>
          </div>
        )}
      </div>

      {/* Domain Proficiency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reading and Writing Domains */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Reading &amp; Writing Domains</h3>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {Math.round((result.rwSection.rawScore / result.rwSection.maxRawScore) * 100)}% Overall
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(result.rwSection.domainBreakdown as Record<string, { total: number; correct: number; accuracy: number }>).map(([domain, stat]) => (
              <div key={domain} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span className="truncate pr-2">{domain}</span>
                  <span className="font-mono font-bold text-slate-900">{stat.correct} / {stat.total} ({stat.accuracy}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stat.accuracy >= 80 ? 'bg-emerald-500' : stat.accuracy >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Math Domains */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Math Domains</h3>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {Math.round((result.mathSection.rawScore / result.mathSection.maxRawScore) * 100)}% Overall
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(result.mathSection.domainBreakdown as Record<string, { total: number; correct: number; accuracy: number }>).map(([domain, stat]) => (
              <div key={domain} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span className="truncate pr-2">{domain}</span>
                  <span className="font-mono font-bold text-slate-900">{stat.correct} / {stat.total} ({stat.accuracy}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stat.accuracy >= 80 ? 'bg-emerald-500' : stat.accuracy >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question-by-Question Diagnostic Review */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Question-by-Question Diagnostic Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect step-by-step rationales, your submitted answers, and correct solutions for each test question.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({allResultQuestionIds.length})
            </button>
            <button
              onClick={() => setActiveFilter('incorrect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'incorrect' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Missed ({missedIds.length})
            </button>
            <button
              onClick={() => setActiveFilter('correct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'correct' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Correct ({correctIds.length})
            </button>
            {markedIds.length > 0 && (
              <button
                onClick={() => setActiveFilter('marked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'marked' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Marked ({markedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Question Review List */}
        <div className="space-y-4">
          {filteredQuestionIds.map((id, index) => {
            const q = result.questions[id];
            const ans = result.answers[id];
            const ansIsCorrect = ans ? (typeof ans.isCorrect === 'object' ? (ans.isCorrect as any).isCorrect : !!ans.isCorrect) : false;
            const isExpanded = expandedQuestionId === id;
            if (!q) return null;

            return (
              <div
                key={id}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  ansIsCorrect ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedQuestionId(isExpanded ? null : id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                      ansIsCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{q.domain}</span>
                        <span className="text-[11px] text-slate-400">&bull;</span>
                        <span className="text-[11px] font-semibold text-slate-500 truncate">{q.skill}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {q.prompt.replace(/<[^>]*>?/gm, '').substring(0, 80)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-bold block ${ansIsCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {ansIsCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Your ans: {ans?.userAnswer || 'Blank'} | Correct: {q.correctAnswer}
                      </span>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200/80 bg-slate-50/50 space-y-4 text-xs sm:text-sm">
                    {/* Stimulus / Passage if any */}
                    {q.stimulus && (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 font-serif leading-relaxed">
                        <MathText text={q.stimulus} />
                      </div>
                    )}

                    {/* Full Prompt */}
                    <div className="text-slate-900 font-medium leading-relaxed">
                      <MathText text={q.prompt} />
                    </div>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt) => {
                          const isUserChoice = ans?.userAnswer === opt.label;
                          const isCorrectChoice = q.correctAnswer === opt.label;

                          return (
                            <div
                              key={opt.label}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                                isCorrectChoice
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                  : isUserChoice
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 line-through'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isCorrectChoice ? 'bg-emerald-600 text-white' : isUserChoice ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {opt.label}
                              </span>
                              <div className="pt-0.5">
                                <MathText text={opt.text} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Official College Board Explanation &amp; Rationale</span>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <MathText text={q.rationale} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
