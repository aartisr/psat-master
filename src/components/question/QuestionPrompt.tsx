import React from 'react';
import { Trash2 } from 'lucide-react';
import { Question } from '../../types';
import { CoordinateGraph } from '../CoordinateGraph';
import { DataTable } from '../DataTable';
import { formatMathText, MathText } from '../common/MathRenderer';
import { isValidTable, extractTableData } from '../../utils/tableParser';

export { formatMathText, MathText };

export interface QuestionPromptProps {
  question: Question;
  onRemoveImage?: () => void;
  onRemoveGraph?: () => void;
}

export const QuestionPrompt: React.FC<QuestionPromptProps> = React.memo(({ 
  question,
  onRemoveImage,
  onRemoveGraph
}) => {
  // Determine effective table structure
  const effectiveTable = (question.tableData && isValidTable(question.tableData))
    ? question.tableData
    : extractTableData(question.prompt);

  return (
    <div className="space-y-4 text-slate-800">
      {/* Stimulus / Reading Passage */}
      {question.stimulus && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed border-l-4 border-l-indigo-500 font-serif">
          <p className="whitespace-pre-line">{question.stimulus}</p>
        </div>
      )}

      {/* Embedded Data Table */}
      {effectiveTable && (
        <div className="my-3 overflow-x-auto flex justify-center sm:justify-start">
          <DataTable data={effectiveTable} table={effectiveTable} />
        </div>
      )}

      {/* Embedded Coordinate Graph (Rendered when structured vector graph configuration is available) */}
      {question.graphConfig && (
        <div className="my-4 flex flex-col items-center">
          {onRemoveGraph && (
            <div className="w-full max-w-md flex justify-end mb-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveGraph();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                title="Remove generated coordinate graph"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Graph</span>
              </button>
            </div>
          )}
          <CoordinateGraph config={question.graphConfig} />
        </div>
      )}

      {/* Embedded Visual Figure/Diagram from original PDF (Only shown if no dynamic SVG coordinate graph is rendered) */}
      {question.imageUrl && !question.graphConfig && (
        <div className="my-4 flex flex-col items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs select-none max-w-full overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-slate-500 font-mono font-medium tracking-wide uppercase flex items-center gap-1.5">
              <span>🖼️</span> Original Reference Figure
            </span>
            {onRemoveImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-3xs"
                title="Remove misattached figure from this question"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Figure</span>
              </button>
            )}
          </div>
          <img
            src={question.imageUrl}
            alt="Question Diagram"
            className="max-h-[280px] w-auto object-contain rounded-lg border border-slate-100"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Question Prompt */}
      <div className="text-sm sm:text-base font-medium leading-relaxed text-slate-900">
        <div>{formatMathText(question.prompt)}</div>
      </div>
    </div>
  );
});

QuestionPrompt.displayName = 'QuestionPrompt';
