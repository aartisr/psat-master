import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Bookmark, 
  AlertCircle, 
  ArrowRight, 
  ChevronLeft,
  Lock,
  ListOrdered
} from 'lucide-react';
import { Question, PracticeTestAnswerRecord } from '../../types';

interface BluebookModuleReviewProps {
  moduleTitle: string;
  moduleIndex: number;
  totalModules: number;
  questionIds: string[];
  questionLookup: Record<string, Question>;
  answers: Record<string, PracticeTestAnswerRecord>;
  onSelectQuestion: (index: number) => void;
  onReturnToCurrentQuestion: () => void;
  onSubmitModule: () => void;
  isFinalModule: boolean;
}

export const BluebookModuleReview: React.FC<BluebookModuleReviewProps> = ({
  moduleTitle,
  moduleIndex,
  totalModules,
  questionIds,
  questionLookup,
  answers,
  onSelectQuestion,
  onReturnToCurrentQuestion,
  onSubmitModule,
  isFinalModule
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  let answeredCount = 0;
  let markedCount = 0;

  questionIds.forEach((id) => {
    const rec = answers[id];
    if (rec?.userAnswer && rec.userAnswer.trim().length > 0) answeredCount++;
    if (rec?.markedForReview) markedCount++;
  });

  const totalQuestions = questionIds.length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto space-y-6">
      {/* Header section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
          <ListOrdered className="w-4 h-4" />
          <span>{moduleTitle}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Module Review & Summary</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Review your answers below before finalizing this module. You can click any question card to jump directly to it.
          <strong className="text-amber-300 font-semibold block sm:inline sm:ml-1">
            Once you submit, this module is sealed and you cannot return.
          </strong>
        </p>

        {/* Status Metrics */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
            <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-400">{answeredCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Answered</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
            <span className={`block font-mono text-xl sm:text-2xl font-bold ${unansweredCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {unansweredCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Unanswered</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
            <span className="block font-mono text-xl sm:text-2xl font-bold text-amber-300">{markedCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Marked for Review</span>
          </div>
        </div>
      </div>

      {/* Unanswered Alert Warning */}
      {unansweredCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <p className="font-bold">You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.</p>
            <p className="text-amber-800 text-xs mt-0.5">
              There is no guessing penalty on the Digital SAT and PSAT. We recommend providing an answer for every question before submitting.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Question Cards Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Questions in this Module</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {questionIds.map((id, idx) => {
            const rec = answers[id];
            const isAnswered = !!(rec?.userAnswer && rec.userAnswer.trim().length > 0);
            const isMarked = !!rec?.markedForReview;
            const q = questionLookup[id];

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between h-24 ${
                  isAnswered
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400 shadow-3xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {isMarked && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                      <Bookmark className="w-3 h-3 fill-amber-500" />
                      Review
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-medium text-slate-500 truncate max-w-[100px]">
                    {q?.skill || q?.domain || 'Question'}
                  </span>
                  <span className={`text-xs font-bold ${isAnswered ? 'text-blue-700' : 'text-slate-400'}`}>
                    {isAnswered ? 'Answered' : 'Empty'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Submission Actions */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <button
          type="button"
          onClick={onReturnToCurrentQuestion}
          className="flex items-center gap-1.5 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Questions</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>{isFinalModule ? 'Finish Practice Exam & View Score' : 'Submit Module & Proceed'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {isFinalModule ? 'Submit Entire Practice Exam?' : 'Submit and Seal Module?'}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {isFinalModule
                  ? 'Your answers will be graded immediately, and your official scaled score, percentile, and domain report will be computed.'
                  : 'Once you submit this module, your answers are locked and you will proceed to the next stage of the exam. You will not be able to return.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onSubmitModule();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
