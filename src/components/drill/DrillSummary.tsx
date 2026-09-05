import React from 'react';
import { Trophy, CheckCircle2, XCircle, RotateCcw, ArrowRight, Zap, Clock } from 'lucide-react';
import { Question } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

export interface DrillSummaryProps {
  title: string;
  total: number;
  correctCount: number;
  totalTimeSeconds: number;
  questions: Question[];
  answers: Record<string, { isCorrect: boolean; timeSpent: number; hintsUsed: number }>;
  onRestart: () => void;
  onReturnToBank: () => void;
}

export const DrillSummary: React.FC<DrillSummaryProps> = React.memo(({
  title,
  total,
  correctCount,
  totalTimeSeconds,
  questions,
  answers,
  onRestart,
  onReturnToBank
}) => {
  const accuracyPercent = Math.round((correctCount / (total || 1)) * 100);
  const avgTime = Math.round(totalTimeSeconds / (total || 1));

  return (
    <Card variant="default" padding="xl" className="max-w-2xl mx-auto space-y-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
        <Trophy className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Sprint Session Completed
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Solid work! Review your accuracy breakdown and timing metrics below.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {correctCount}/{total}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Questions Correct</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</div>
          <div className={`text-2xl font-extrabold mt-1 ${accuracyPercent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {accuracyPercent}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Concept Mastery</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Pace</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {avgTime}s
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Per Question</div>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="space-y-2 text-left pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Question by Question Breakdown
        </h4>
        <div className="space-y-2">
          {questions.map((q, idx) => {
            const entry = answers[q.id];
            const isCorr = entry?.isCorrect;
            return (
              <div
                key={q.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[11px] text-slate-700 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{q.skill}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {entry ? `${entry.timeSpent}s` : '-'}
                  </span>
                  {isCorr ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <Button
          variant="secondary"
          size="md"
          onClick={onRestart}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Retry Drill
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
  );
});

DrillSummary.displayName = 'DrillSummary';
