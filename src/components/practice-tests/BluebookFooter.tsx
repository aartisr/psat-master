import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Bookmark, 
  CheckCircle2, 
  Circle,
  X,
  ListOrdered
} from 'lucide-react';
import { PracticeTestAnswerRecord } from '../../types';

interface BluebookFooterProps {
  currentIndex: number;
  totalQuestions: number;
  questionIds: string[];
  answers: Record<string, PracticeTestAnswerRecord>;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToReviewPage: () => void;
}

export const BluebookFooter: React.FC<BluebookFooterProps> = ({
  currentIndex,
  totalQuestions,
  questionIds,
  answers,
  onSelectIndex,
  onPrev,
  onNext,
  onGoToReviewPage
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  let answeredCount = 0;
  let markedCount = 0;

  questionIds.forEach((id) => {
    const rec = answers[id];
    if (rec?.userAnswer && rec.userAnswer.trim().length > 0) answeredCount++;
    if (rec?.markedForReview) markedCount++;
  });

  const unansweredCount = totalQuestions - answeredCount;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white px-3 sm:px-6 py-3 flex items-center justify-between shadow-lg relative z-20 select-none">
        {/* Left: Question Navigator Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Grid className="w-4 h-4 text-blue-400" />
            <span>
              Question <span className="text-blue-400 font-mono font-bold">{currentIndex + 1}</span> of {totalQuestions}
            </span>
          </button>

          {/* Answered summary indicator */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="text-emerald-400 font-bold">{answeredCount} Answered</span>
            <span>&bull;</span>
            <span className={unansweredCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {unansweredCount} Unanswered
            </span>
            {markedCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                  <Bookmark className="w-3 h-3 fill-amber-400 text-amber-400" /> {markedCount}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Back, Review, Next Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={onPrev}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            type="button"
            onClick={onGoToReviewPage}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-4 h-4 text-slate-400" />
            <span>Review Module</span>
          </button>

          <button
            type="button"
            onClick={isLastQuestion ? onGoToReviewPage : onNext}
            className={`flex items-center gap-1 px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ${
              isLastQuestion
                ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/30'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>{isLastQuestion ? 'Review Module' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Popover Question Grid Drawer */}
      {isNavOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-2xs p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Question Navigator</h3>
              </div>
              <button
                onClick={() => setIsNavOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-400"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-slate-600"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Marked for Review</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 max-h-64 overflow-y-auto p-1">
              {questionIds.map((id, idx) => {
                const rec = answers[id];
                const isAnswered = !!(rec?.userAnswer && rec.userAnswer.trim().length > 0);
                const isMarked = !!rec?.markedForReview;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={id}
                    onClick={() => {
                      onSelectIndex(idx);
                      setIsNavOpen(false);
                    }}
                    className={`relative flex flex-col items-center justify-center h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 font-mono text-white'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1">
                        <Bookmark className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsNavOpen(false);
                  onGoToReviewPage();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Go to Full Module Review Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
