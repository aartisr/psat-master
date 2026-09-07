import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  EyeOff, 
  Calculator as CalcIcon, 
  FileText, 
  Bookmark, 
  HelpCircle, 
  X, 
  AlertTriangle,
  Highlighter,
  Scissors
} from 'lucide-react';

interface BluebookHeaderProps {
  sectionTitle: string;
  moduleIndex: number;
  totalModulesInSection: number;
  secondsRemaining: number;
  isMarkedForReview: boolean;
  onToggleMarkForReview: () => void;
  isEliminatorActive: boolean;
  onToggleEliminator: () => void;
  isHighlighterActive: boolean;
  onToggleHighlighter: () => void;
  onOpenCalculator: () => void;
  onOpenFormulaSheet: () => void;
  onOpenDirections: () => void;
  onExitTest: () => void;
}

export const BluebookHeader: React.FC<BluebookHeaderProps> = ({
  sectionTitle,
  moduleIndex,
  totalModulesInSection,
  secondsRemaining,
  isMarkedForReview,
  onToggleMarkForReview,
  isEliminatorActive,
  onToggleEliminator,
  isHighlighterActive,
  onToggleHighlighter,
  onOpenCalculator,
  onOpenFormulaSheet,
  onOpenDirections,
  onExitTest
}) => {
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = secondsRemaining <= 300; // <= 5 minutes
  const isCriticalTime = secondsRemaining <= 60; // <= 1 minute

  return (
    <>
      <header className="bg-slate-900 text-white select-none border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-md relative z-30">
        {/* Left: Section and Module Identifier */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">
              {sectionTitle}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              Module {moduleIndex} of {totalModulesInSection}
            </span>
          </div>

          <button
            onClick={onOpenDirections}
            className="hidden md:flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors border border-slate-700/60 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Directions</span>
          </button>
        </div>

        {/* Center: Official Bluebook-Style Timer */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner">
          <Clock className={`w-4 h-4 ${isCriticalTime ? 'text-rose-400 animate-pulse' : isLowTime ? 'text-amber-400' : 'text-slate-400'}`} />
          
          {!isTimerHidden ? (
            <span className={`font-mono text-sm sm:text-base font-bold tracking-wider ${
              isCriticalTime ? 'text-rose-400 animate-pulse' : isLowTime ? 'text-amber-300' : 'text-slate-100'
            }`}>
              {formattedTime}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium px-1">Timer Hidden</span>
          )}

          <button
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            title={isTimerHidden ? "Show Timer" : "Hide Timer"}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isTimerHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Test In-App Tools & Mark For Review */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mark for Review */}
          <button
            onClick={onToggleMarkForReview}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
              isMarkedForReview
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isMarkedForReview ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Mark for Review</span>
          </button>

          {/* Option Eliminator / Strikethrough Tool */}
          <button
            onClick={onToggleEliminator}
            title="Option Eliminator (Cross Out)"
            className={`p-1.5 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
              isEliminatorActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
          </button>

          {/* Text Highlighter */}
          <button
            onClick={onToggleHighlighter}
            title="Highlight Text / Annotate"
            className={`p-1.5 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
              isHighlighterActive
                ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Desmos Graphing Calculator */}
          <button
            onClick={onOpenCalculator}
            title="Graphing & Scientific Calculator"
            className="flex items-center gap-1 bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <CalcIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Calc</span>
          </button>

          {/* Math Reference Sheet */}
          <button
            onClick={onOpenFormulaSheet}
            title="Formulas Reference Sheet"
            className="flex items-center gap-1 bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Reference</span>
          </button>

          {/* Exit Exam Button */}
          <button
            onClick={() => setShowWarningModal(true)}
            className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 p-1.5 rounded-md transition-colors border border-transparent hover:border-rose-900/50 cursor-pointer"
            title="Exit Practice Exam"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Exit Test Confirmation Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Leave Active Practice Exam?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Exiting will end your current timed testing session. Are you sure you want to return to the practice tests catalog?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  onExitTest();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Exit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
