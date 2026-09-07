import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Clock, 
  ArrowRight, 
  Play, 
  Pause, 
  CheckCircle2, 
  Calculator, 
  FileText 
} from 'lucide-react';
import { SCHEDULED_BREAK_TIME_SECONDS } from '../../utils/practiceTestEngine';

interface BluebookBreakScreenProps {
  onResumeNextSection: () => void;
}

export const BluebookBreakScreen: React.FC<BluebookBreakScreenProps> = ({
  onResumeNextSection
}) => {
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number>(SCHEDULED_BREAK_TIME_SECONDS);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setBreakSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const minutes = Math.floor(breakSecondsLeft / 60);
  const seconds = breakSecondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-300">
      {/* Icon badge */}
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-xs">
        <Coffee className="w-8 h-8" />
      </div>

      {/* Header */}
      <div className="space-y-2 max-w-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Section 1 Complete
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          10-Minute Scheduled Intermission
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Great job completing Reading &amp; Writing! Take a moment to rest your eyes, stretch, and prepare for the Math section.
        </p>
      </div>

      {/* Break Timer Display */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Break Time Remaining</span>
        </div>

        <div className="font-mono text-4xl sm:text-5xl font-black text-blue-400 tracking-wider">
          {formattedTime}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-slate-700"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Timer' : 'Pause Timer'}</span>
          </button>
        </div>
      </div>

      {/* Next Section Preview Checklist */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 w-full max-w-md text-left shadow-2xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Up Next: Section 2 (Math)</h4>
        <ul className="space-y-2.5 text-xs text-slate-700">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>2 Modules &bull; 22 Questions each (35 min / module)</span>
          </li>
          <li className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Desmos Graphing Calculator is accessible on all questions</span>
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Official Math Reference Formulas sheet is available in-app</span>
          </li>
        </ul>
      </div>

      {/* Resume CTA */}
      <div>
        <button
          type="button"
          onClick={onResumeNextSection}
          className="flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span>Resume Test: Start Math Section</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
