import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { MathText } from '../common/MathRenderer';
import { DataTable } from '../DataTable';
import { CoordinateGraph } from '../CoordinateGraph';
import { isValidTable, extractTableData } from '../../utils/tableParser';
import { Scissors, Check, HelpCircle, AlertCircle } from 'lucide-react';

interface BluebookQuestionPaneProps {
  question: Question;
  questionNumber: number;
  totalQuestionsInModule: number;
  userAnswer: string;
  onSelectAnswer: (answer: string) => void;
  eliminatedOptions: string[];
  onToggleEliminatedOption: (optionKey: string) => void;
  isEliminatorActive: boolean;
  isHighlighterActive: boolean;
  annotationNote?: string;
  onSaveAnnotation?: (note: string) => void;
}

export const BluebookQuestionPane: React.FC<BluebookQuestionPaneProps> = ({
  question,
  questionNumber,
  totalQuestionsInModule,
  userAnswer,
  onSelectAnswer,
  eliminatedOptions = [],
  onToggleEliminatedOption,
  isEliminatorActive,
  isHighlighterActive,
  annotationNote,
  onSaveAnnotation
}) => {
  const isReadingWriting = question.test === 'Reading and Writing';
  const isFreeResponse = question.type === 'free_response';
  const [sprText, setSprText] = useState(userAnswer || '');
  const [activeNote, setActiveNote] = useState(annotationNote || '');
  const [showAnnotationInput, setShowAnnotationInput] = useState(!!annotationNote);

  // Sync state if question changes
  useEffect(() => {
    setSprText(userAnswer || '');
    setActiveNote(annotationNote || '');
    setShowAnnotationInput(!!annotationNote);
  }, [question.id, userAnswer, annotationNote]);

  const handleSprChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits, slash, decimal point, minus
    if (/^[0-9./-]*$/.test(val) && val.length <= 7) {
      setSprText(val);
      onSelectAnswer(val);
    }
  };

  const effectiveTable = (question.tableData && isValidTable(question.tableData))
    ? question.tableData
    : extractTableData(question.prompt);

  const options = question.options || [];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
      {/* Question Number Badge and Domain Tag */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
            {questionNumber}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {question.domain} &bull; {question.skill}
          </span>
        </div>

        {isEliminatorActive && (
          <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-medium">
            <Scissors className="w-3.5 h-3.5" />
            <span>Eliminator Mode On (Click red slash to strike choice)</span>
          </div>
        )}
      </div>

      {/* DUAL SPLIT PANE FOR READING & WRITING */}
      {isReadingWriting ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Passage / Stimulus */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Passage
              </span>
              <button
                onClick={() => setShowAnnotationInput(!showAnnotationInput)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {showAnnotationInput ? 'Hide Notes' : '+ Add Passage Note'}
              </button>
            </div>

            {/* Passage Text */}
            <div className={`prose prose-slate max-w-none text-slate-800 text-sm sm:text-[15px] leading-relaxed select-text font-serif ${isHighlighterActive ? 'bg-amber-50/50 p-2 rounded-lg' : ''}`}>
              <MathText text={question.stimulus || question.prompt} />
            </div>

            {/* Note box */}
            {showAnnotationInput && (
              <div className="pt-2">
                <textarea
                  value={activeNote}
                  onChange={(e) => {
                    setActiveNote(e.target.value);
                    if (onSaveAnnotation) onSaveAnnotation(e.target.value);
                  }}
                  placeholder="Type your notes or analysis for this passage..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-amber-300 bg-amber-50/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Right Column: Question Prompt & Options */}
          <div className="lg:col-span-6 space-y-5">
            {/* Question prompt if stimulus exists */}
            {question.stimulus && (
              <div className="text-slate-900 text-sm sm:text-base font-medium leading-relaxed">
                <MathText text={question.prompt} />
              </div>
            )}

            {/* Embedded Table if any */}
            {effectiveTable && (
              <div className="my-3 overflow-x-auto flex justify-start">
                <DataTable data={effectiveTable} table={effectiveTable} />
              </div>
            )}

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {options.map((opt) => {
                const isSelected = userAnswer === opt.label;
                const isEliminated = eliminatedOptions.includes(opt.label);

                return (
                  <div
                    key={opt.label}
                    className="relative flex items-center gap-2 group"
                  >
                    <button
                      type="button"
                      disabled={isEliminated}
                      onClick={() => onSelectAnswer(opt.label)}
                      className={`flex-1 text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isEliminated
                          ? 'opacity-35 bg-slate-100 border-slate-200 line-through text-slate-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/90 border-blue-600 text-slate-900 shadow-xs ring-2 ring-blue-600/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <div className="text-xs sm:text-sm font-normal text-slate-800 pt-0.5 leading-relaxed">
                        <MathText text={opt.text} />
                      </div>
                    </button>

                    {/* Option Eliminator Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleEliminatedOption(opt.label)}
                      title={isEliminated ? "Restore Choice" : "Eliminate Choice"}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isEliminated
                          ? 'bg-rose-50 text-rose-600 border-rose-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border-slate-200'
                      }`}
                    >
                      <span className="font-mono text-xs">{opt.label}</span>
                      <span className="text-rose-500 font-bold ml-0.5">/</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE CENTERED PANE FOR MATH */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Question Prompt */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="text-slate-900 text-sm sm:text-base font-medium leading-relaxed">
              <MathText text={question.prompt} />
            </div>

            {/* Coordinate Graph */}
            {question.graphConfig && (
              <div className="my-4 flex justify-center">
                <CoordinateGraph config={question.graphConfig} width={340} height={260} />
              </div>
            )}

            {/* Table */}
            {effectiveTable && (
              <div className="my-3 overflow-x-auto flex justify-center">
                <DataTable data={effectiveTable} table={effectiveTable} />
              </div>
            )}
          </div>

          {/* Student-Produced Response (SPR) Free Response vs Multiple Choice */}
          {isFreeResponse ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span>Student-Produced Response (SPR)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your exact answer as a fraction (e.g., <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">3/4</code>), decimal (e.g., <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">0.75</code>), or integer.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={sprText}
                  onChange={handleSprChange}
                  placeholder="Enter answer"
                  className="w-48 px-4 py-3 bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/20 rounded-xl font-mono text-base font-bold text-slate-900 tracking-wider shadow-xs outline-none"
                />
                {sprText.trim() && (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Answer Recorded
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((opt) => {
                const isSelected = userAnswer === opt.label;
                const isEliminated = eliminatedOptions.includes(opt.label);

                return (
                  <div
                    key={opt.label}
                    className="relative flex items-center gap-2 group"
                  >
                    <button
                      type="button"
                      disabled={isEliminated}
                      onClick={() => onSelectAnswer(opt.label)}
                      className={`flex-1 text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isEliminated
                          ? 'opacity-35 bg-slate-100 border-slate-200 line-through text-slate-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/90 border-blue-600 text-slate-900 shadow-xs ring-2 ring-blue-600/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <div className="text-xs sm:text-sm font-normal text-slate-800 pt-0.5 leading-relaxed">
                        <MathText text={opt.text} />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleEliminatedOption(opt.label)}
                      title={isEliminated ? "Restore Choice" : "Eliminate Choice"}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isEliminated
                          ? 'bg-rose-50 text-rose-600 border-rose-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border-slate-200'
                      }`}
                    >
                      <span className="font-mono text-xs">{opt.label}</span>
                      <span className="text-rose-500 font-bold ml-0.5">/</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
