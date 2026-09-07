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
      {/* Quick Hero Banner (Professional Polish Theme) */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[11px] uppercase tracking-wider border border-blue-400/30">
              College Board Question Bank • 2,900+ Items
            </span>
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Official PSAT/NMSQT &amp; SAT Standards
            </span>
            {(!currentUser || currentUser.isAnonymous) && (
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Instant Free Guest Practice
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Interactive Practice &amp; Skill Bank
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Target specific domains, search by College Board Question ID, practice with 3-step Socratic hints, and master Desmos graphing calculator shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Button
            variant="primary"
            size="md"
            onClick={launchDailyDrill}
            leftIcon={<Zap className="w-4 h-4 fill-white" />}
            className="shadow-md text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-3 px-5"
          >
            Launch Daily Sprint (5 Qs)
          </Button>
        </div>
      </div>

      {/* 1-Click Quick Practice Launchpad Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Popular Quick-Start Filters
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Click any chip to jump straight into targeted practice
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, test: 'Math', domain: 'Algebra', difficulty: 'all', query: '' })}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-800 text-xs font-bold border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📐 Math: Algebra &amp; Equations</span>
          </button>
          <button
            onClick={() => setFilters({ ...filters, test: 'Math', domain: 'Advanced Math', difficulty: 'all', query: '' })}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-800 text-xs font-bold border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📈 Math: Quadratics &amp; Functions</span>
          </button>
          <button
            onClick={() => setFilters({ ...filters, test: 'Reading and Writing', domain: 'Standard English Conventions', difficulty: 'all', query: '' })}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>✍️ R&amp;W: Grammar &amp; Boundaries</span>
          </button>
          <button
            onClick={() => setFilters({ ...filters, test: 'Reading and Writing', domain: 'Information and Ideas', difficulty: 'all', query: '' })}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs font-bold border border-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>💡 R&amp;W: Passage Ideas &amp; Claims</span>
          </button>
          <button
            onClick={() => setFilters({ ...filters, test: 'all', difficulty: 'Hard', query: '' })}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-800 text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔥 Hard Challenge Items</span>
          </button>
          <button
            onClick={() => setFilters({ query: '', assessment: 'all', test: 'all', domain: 'all', skill: 'all', difficulty: 'all', status: 'all', sortBy: 'relevance' })}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer ml-auto"
          >
            Reset Filters
          </button>
        </div>
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
        <div className="space-y-4" id="practice-questions-container">
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
                  setFilters((prev) => ({ ...prev, query: targetQ.id }));
                  setTimeout(() => {
                    const container = document.getElementById('practice-questions-container');
                    if (container) {
                      const yOffset = -90; // perfectly accounts for sticky header height
                      const y = container.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 60);
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
              setTimeout(() => {
                const container = document.getElementById('practice-questions-container');
                if (container) {
                  const yOffset = -90; // perfectly accounts for sticky header height
                  const y = container.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 60);
            }}
          />
        </div>
      )}
    </div>
  );
});

QuestionBankView.displayName = 'QuestionBankView';
