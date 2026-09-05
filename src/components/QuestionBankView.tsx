import React, { useMemo } from 'react';
import { Sparkles, Zap, Search, HelpCircle } from 'lucide-react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import { FilterBar } from './FilterBar';
import { Pagination } from './common/Pagination';
import { EmptyState } from './common/EmptyState';
import { Button } from './common/Button';
import { usePractice } from '../context/PracticeContext';
import { findRelatedQuestions } from '../data/questions';

interface QuestionBankViewProps {
  onReportQuestionIssue?: (questionId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = React.memo(({ onReportQuestionIssue }) => {
  const {
    allQuestions,
    filteredQuestions,
    searchTimeMs,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    bookmarks,
    handleToggleBookmark,
    handleQuestionAttempt,
    launchDailyDrill,
    launchFilteredDrill,
    setScratchpadData,
    setIsFormulaSheetOpen,
    setIsCalculatorOpen,
    currentUser
  } = usePractice();

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Quick Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/30 to-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ring-1 ring-slate-900/5">
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-2xs">
              College Board Standard
            </span>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> PSAT 8/9, 10 &amp; NMSQT
            </span>
            {(!currentUser || currentUser.isAnonymous) && (
              <span className="text-xs text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Free Guest Practice · No Sign-in Needed
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Interactive Practice &amp; Mastery Bank
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Targeted concept mastery featuring 3-tiered Socratic hints, exact coordinate graphing, desmos shortcuts, and deep analytical explanations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Button
            variant="gradient"
            size="md"
            onClick={launchDailyDrill}
            leftIcon={<Zap className="w-4 h-4 fill-white" />}
            className="shadow-md shadow-indigo-500/20"
          >
            Launch Daily Sprint (5 Qs)
          </Button>
        </div>

        {/* Subtle decorative ambient glow behind banner */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Granular Multi-Filter & Search Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        totalMatches={filteredQuestions.length}
        totalQuestions={allQuestions.length}
        searchTimeMs={searchTimeMs}
        onLaunchFilteredDrill={launchFilteredDrill}
      />

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<Search className="w-7 h-7 text-slate-400" />}
          title="No questions matched your filter criteria"
          description="Try broadening your search query, clearing domain filters, or switching difficulty levels."
          actionLabel="Reset All Filters"
          onAction={() =>
            setFilters({
              query: '',
              assessment: 'all',
              test: 'all',
              domain: 'all',
              skill: 'all',
              difficulty: 'all',
              status: 'all',
              sortBy: 'relevance'
            })
          }
        />
      ) : (
        <div className="space-y-4">
          {paginatedQuestions.map((q: Question) => {
            const related = findRelatedQuestions(q, allQuestions, 3);
            return (
              <QuestionCard
                key={q.id}
                question={q}
                isBookmarked={bookmarks.includes(q.id)}
                onToggleBookmark={handleToggleBookmark}
                onAttemptSubmitted={(isCorrect, timeSpent, hintsUsed) =>
                  handleQuestionAttempt(q.id, isCorrect, timeSpent, hintsUsed)
                }
                relatedQuestions={related}
                onSelectQuestion={(targetQ) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setFilters((prev) => ({ ...prev, query: targetQ.id }));
                }}
                showRelated={true}
                onOpenScratchpad={(prompt) => setScratchpadData({ isOpen: true, prompt })}
                onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onReportIssue={onReportQuestionIssue}
              />
            );
          })}

          {/* Light Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQuestions.length}
            pageSize={pageSize}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
});

QuestionBankView.displayName = 'QuestionBankView';
