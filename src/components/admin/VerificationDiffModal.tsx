import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Check, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  Eye,
  FileText,
  ZoomIn,
  ZoomOut,
  Wand2
} from 'lucide-react';
import { Question, QuestionTable } from '../../types';
import { QuestionCard } from '../QuestionCard';
import { auditQuestion, repairQuestion } from '../../utils/questionAuditor';
import { isValidTable } from '../../utils/tableParser';

interface VerificationDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedQuestions: { question: Question; pageNum?: number; pageText?: string }[];
  fullPageImages?: Record<number, string>;
  rawSourceText?: string;
  onConfirmAll: (finalQuestions: Question[]) => void;
}

export const VerificationDiffModal: React.FC<VerificationDiffModalProps> = ({
  isOpen,
  onClose,
  parsedQuestions,
  fullPageImages = {},
  rawSourceText = '',
  onConfirmAll
}) => {
  const [questions, setQuestions] = useState<Question[]>(() =>
    parsedQuestions.map((p) => repairQuestion(p.question, p.pageText || rawSourceText))
  );
  const [activeVisibleIndex, setActiveVisibleIndex] = useState(0);
  const [filterLowFidelity, setFilterLowFidelity] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editTableHeaders, setEditTableHeaders] = useState('');
  const [editTableRows, setEditTableRows] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Synchronize internal state whenever new parsed questions arrive
  useEffect(() => {
    if (parsedQuestions && parsedQuestions.length > 0) {
      setQuestions(parsedQuestions.map((p) => repairQuestion(p.question, p.pageText || rawSourceText)));
      setActiveVisibleIndex(0);
    }
  }, [parsedQuestions, rawSourceText]);

  if (!isOpen || questions.length === 0) return null;

  // Compute fidelity audit for all questions
  const audits = questions.map((q) => auditQuestion(q, rawSourceText));
  const lowFidelityIndices = questions
    .map((q, idx) => (audits[idx]?.fidelityScore < 100 ? idx : -1))
    .filter((idx) => idx !== -1);
  
  const lowFidelityCount = lowFidelityIndices.length;

  const visibleIndices = filterLowFidelity
    ? lowFidelityIndices
    : questions.map((_, i) => i);

  // Bounds check active visible index
  const safeActiveIndex = Math.min(
    activeVisibleIndex,
    Math.max(0, visibleIndices.length - 1)
  );

  const currentQuestionIndex = visibleIndices[safeActiveIndex] ?? 0;
  const currentQ = questions[currentQuestionIndex] || questions[0];
  const currentPageNum = parsedQuestions[currentQuestionIndex]?.pageNum || (currentQuestionIndex + 1);
  
  // Safe image formatting (handles both raw base64 and data:image/jpeg;base64)
  const rawImage = fullPageImages[currentPageNum] || (currentQ as any)?.imageUrl || fullPageImages[1] || null;
  const originalPageImg = rawImage
    ? rawImage.startsWith('data:')
      ? rawImage
      : `data:image/jpeg;base64,${rawImage}`
    : null;

  const audit = audits[currentQuestionIndex] || auditQuestion(currentQ, rawSourceText);

  const handleStartEdit = () => {
    if (!currentQ) return;
    setEditPrompt(currentQ.prompt);
    setEditAnswer(currentQ.correctAnswer);
    if (currentQ.tableData && isValidTable(currentQ.tableData)) {
      setEditTableHeaders(currentQ.tableData.headers.join(' | '));
      setEditTableRows(currentQ.tableData.rows.map((r) => r.join(' | ')).join('\n'));
    } else {
      setEditTableHeaders('');
      setEditTableRows('');
    }
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (!currentQ) return;
    const updated = [...questions];
    let newTableData: QuestionTable | undefined = currentQ.tableData;

    if (editTableHeaders.trim()) {
      const headers = editTableHeaders.split('|').map((s) => s.trim()).filter(Boolean);
      const rows = editTableRows
        .split('\n')
        .map((line) => line.split('|').map((c) => c.trim()).filter(Boolean))
        .filter((r) => r.length > 0);

      if (headers.length > 0 && rows.length > 0) {
        newTableData = {
          headers,
          rows: rows.map((r) => r.map((c) => (!isNaN(Number(c)) && c !== '' ? Number(c) : c)))
        };
      } else {
        newTableData = undefined;
      }
    } else if (!editTableHeaders.trim() && !editTableRows.trim()) {
      newTableData = undefined;
    }

    updated[currentQuestionIndex] = {
      ...currentQ,
      prompt: editPrompt.trim(),
      correctAnswer: editAnswer.trim(),
      tableData: newTableData
    };
    setQuestions(updated);
    setEditing(false);
  };

  const handleAutoRepairCurrent = () => {
    if (!currentQ) return;
    const pageText = parsedQuestions[currentQuestionIndex]?.pageText || rawSourceText;
    const repaired = repairQuestion(currentQ, pageText);
    const updated = [...questions];
    updated[currentQuestionIndex] = repaired;
    setQuestions(updated);
  };

  const handleDelete = () => {
    const updated = questions.filter((_, idx) => idx !== currentQuestionIndex);
    setQuestions(updated);
    if (safeActiveIndex >= visibleIndices.length - 1) {
      setActiveVisibleIndex(Math.max(0, safeActiveIndex - 1));
    }
  };

  const handleCommit = () => {
    onConfirmAll(questions);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-auto max-h-[88vh] h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Pre-Import 100% Fidelity Inspector
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Compare side-by-side with original document page before committing to the live bank.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterLowFidelity((prev) => !prev);
                setActiveVisibleIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                filterLowFidelity
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : lowFidelityCount > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle filter to focus strictly on questions with <100% fidelity"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filterLowFidelity ? 'text-white' : lowFidelityCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>
                {filterLowFidelity
                  ? `Showing <100% Fidelity Only (${lowFidelityCount})`
                  : lowFidelityCount > 0
                  ? `Review <100% Fidelity (${lowFidelityCount})`
                  : `All 100% Fidelity (${questions.length})`}
              </span>
            </button>

            <button
              onClick={handleDelete}
              className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Exclude
            </button>
            <button
              onClick={handleCommit}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirm & Save All ({questions.length})
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden bg-slate-100/70">
          
          {/* Left Column: Original Source Page (High Contrast Neutral Canvas) */}
          <div className="bg-white rounded-xl border border-slate-300 flex flex-col overflow-hidden shadow-sm">
            <div className="p-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Original Document (Page {currentPageNum})
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button 
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-slate-500">{Math.round(zoomLevel * 100)}%</span>
                <button 
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start bg-slate-50">
              {originalPageImg ? (
                <div 
                  className="w-full h-full flex items-center justify-center overflow-auto transition-transform"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                  <img
                    src={originalPageImg}
                    alt={`Original Page ${currentPageNum}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-slate-300 bg-white"
                  />
                </div>
              ) : rawSourceText.trim() ? (
                <div className="w-full h-full flex flex-col space-y-3 bg-white p-4 rounded-xl border border-slate-200 overflow-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Original Input Transcript / Snippet
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Text Ingestion Mode
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {rawSourceText}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs p-6 max-w-sm space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-slate-800">Original Document View</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When importing via <strong>Upload PDF File</strong>, a lossless 2.0x page bitmap is automatically captured and displayed here. For direct text extractions, the original text transcript is compared side-by-side.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Parsed Interactive Component */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Interactive Rendered Output
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    audit.fidelityScore === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {audit.fidelityScore}% Fidelity
                </span>
                {!editing ? (
                  <button
                    onClick={handleStartEdit}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Edit Field"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-white">
              {filterLowFidelity && visibleIndices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-extrabold text-base text-slate-800">100% Fidelity Achieved!</p>
                  <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                    All {questions.length} question(s) in this batch passed layout, schema, and answer formatting rules with 100% fidelity.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterLowFidelity(false)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Show All Questions ({questions.length})
                  </button>
                </div>
              ) : editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Question Prompt (Markdown / LaTeX)
                    </label>
                    <textarea
                      rows={5}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Table Column Headers (pipe separated, e.g. "x | g(x)")
                    </label>
                    <input
                      type="text"
                      placeholder="x | g(x)"
                      value={editTableHeaders}
                      onChange={(e) => setEditTableHeaders(e.target.value)}
                      className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Table Rows (one row per line, pipe separated e.g. "1 | 54")
                    </label>
                    <textarea
                      rows={4}
                      placeholder={"1 | 54\n2 | 51\n3 | 48\n4 | 45"}
                      value={editTableRows}
                      onChange={(e) => setEditTableRows(e.target.value)}
                      className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="text"
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {audit.issues.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Fidelity Auditor Notice ({audit.issues.length} item{audit.issues.length > 1 ? 's' : ''})
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoRepairCurrent}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] shadow-3xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Auto-Repair Table & Formatting
                        </button>
                      </div>
                      <div className="space-y-1">
                        {audit.issues.map((iss, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{iss.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentQ && (
                    <QuestionCard
                      question={currentQ}
                      questionNumber={currentQuestionIndex + 1}
                      totalQuestions={questions.length}
                      showRationale={true}
                      onAnswer={() => {}}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <button
            disabled={safeActiveIndex === 0}
            onClick={() => {
              setEditing(false);
              setActiveVisibleIndex((prev) => Math.max(0, prev - 1));
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
            {visibleIndices.map((origIdx, posIdx) => {
              const isLowFidelity = (audits[origIdx]?.fidelityScore ?? 100) < 100;
              return (
                <button
                  key={origIdx}
                  onClick={() => {
                    setEditing(false);
                    setActiveVisibleIndex(posIdx);
                  }}
                  className={`relative w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                    safeActiveIndex === posIdx
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                      : isLowFidelity
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title={`Question ${origIdx + 1} (${audits[origIdx]?.fidelityScore ?? 100}% Fidelity)`}
                >
                  {origIdx + 1}
                  {isLowFidelity && safeActiveIndex !== posIdx && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            disabled={safeActiveIndex === visibleIndices.length - 1 || visibleIndices.length === 0}
            onClick={() => {
              setEditing(false);
              setActiveVisibleIndex((prev) => Math.min(visibleIndices.length - 1, prev + 1));
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
