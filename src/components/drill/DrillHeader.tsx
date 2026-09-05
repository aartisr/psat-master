import React from 'react';
import { ArrowLeft, Flame, Zap } from 'lucide-react';
import { Button } from '../common/Button';

export interface DrillHeaderProps {
  title: string;
  currentIndex: number;
  total: number;
  comboStreak: number;
  onClose: () => void;
}

export const DrillHeader: React.FC<DrillHeaderProps> = React.memo(({
  title,
  currentIndex,
  total,
  comboStreak,
  onClose
}) => {
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="xs"
            onClick={onClose}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Exit Drill
          </Button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h2>
            <div className="text-xs text-slate-500 font-medium">
              Question {currentIndex + 1} of {total}
            </div>
          </div>
        </div>

        {comboStreak >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs animate-bounce">
            <Flame className="w-4 h-4 fill-white" />
            <span>{comboStreak}x Combo Streak!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-600">
          <span>Pacing Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
});

DrillHeader.displayName = 'DrillHeader';
