import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Wrench, 
  Table, 
  ImageOff, 
  FileCode,
  X
} from 'lucide-react';
import { Question } from '../../types';
import { BankAuditReport, auditQuestionBank } from '../../utils/questionAuditor';
import { extractTableData } from '../../utils/tableParser';

interface ContentAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onUpdateQuestion: (updated: Question) => void;
}

export const ContentAuditorModal: React.FC<ContentAuditorModalProps> = ({
  isOpen,
  onClose,
  questions,
  onUpdateQuestion
}) => {
  const [report, setReport] = useState<BankAuditReport>(() => auditQuestionBank(questions));
  const [filterType, setFilterType] = useState<'all' | 'issues' | 'perfect'>('issues');
  const [fixingId, setFixingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setReport(auditQuestionBank(questions));
  };

  const handleAutoFixTable = (q: Question) => {
    setFixingId(q.id);
    const extracted = extractTableData(q.prompt);
    if (extracted) {
      const fixed = { ...q, tableData: extracted };
      onUpdateQuestion(fixed);
    }
    setTimeout(() => {
      setReport(auditQuestionBank(questions));
      setFixingId(null);
    }, 400);
  };

  const handleRemoveUnneededImage = (q: Question) => {
    setFixingId(q.id);
    const fixed = { ...q };
    delete fixed.imageUrl;
    onUpdateQuestion(fixed);
    setTimeout(() => {
      setReport(auditQuestionBank(questions));
      setFixingId(null);
    }, 400);
  };

  const displayedResults = report.results.filter((r) => {
    if (filterType === 'issues') return r.issues.length > 0;
    if (filterType === 'perfect') return r.issues.length === 0;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Automated 100% Fidelity Auditor
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {report.averageFidelityScore}% Overall Score
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Deep mathematical, LaTeX, table integrity, and visual fidelity scanner.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Re-run Audit"
            >
              <RefreshCw className="w-4 h-4" />
              Re-scan
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perfect Questions</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              {report.perfectQuestions} / {report.totalQuestions}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">LaTeX Delimiters</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <FileCode className="w-5 h-5 text-indigo-500" />
              {report.summary.latexErrors === 0 ? '100% Balanced' : `${report.summary.latexErrors} Discrepancies`}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Table Integrity</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Table className="w-5 h-5 text-indigo-500" />
              {report.summary.tableMismatches === 0 ? '100% Extracted' : `${report.summary.tableMismatches} Needs Review`}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answer Key Match</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              {report.summary.answerKeyValid} / {report.totalQuestions} Valid
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('issues')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'issues'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Needs Attention ({report.results.filter((r) => r.issues.length > 0).length})
            </button>
            <button
              onClick={() => setFilterType('perfect')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'perfect'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              100% Perfect ({report.perfectQuestions})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({report.totalQuestions})
            </button>
          </div>
        </div>

        {/* Audit Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {displayedResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Zero Discrepancies Found!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All filtered questions pass LaTeX bracket balancing, table extraction tests, and answer validation.
              </p>
            </div>
          ) : (
            displayedResults.map(({ questionId, question, fidelityScore, issues }) => (
              <div
                key={questionId}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                        ID: {questionId}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {question.domain} • {question.skill}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          fidelityScore === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : fidelityScore >= 80
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fidelityScore}% Score
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 mt-1">
                      {question.prompt}
                    </p>
                  </div>
                </div>

                {/* Issues List */}
                {issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                          issue.type === 'error'
                            ? 'bg-rose-50 border border-rose-200 text-rose-900'
                            : issue.type === 'warning'
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : 'bg-blue-50 border border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {issue.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>

                        {/* Quick Action Fix Buttons */}
                        {issue.category === 'table' && (
                          <button
                            disabled={fixingId === questionId}
                            onClick={() => handleAutoFixTable(question)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-500 text-indigo-700 rounded-md font-semibold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Wrench className="w-3 h-3" />
                            Auto-Recover Table
                          </button>
                        )}

                        {issue.category === 'visual' && question.imageUrl && (
                          <button
                            disabled={fixingId === questionId}
                            onClick={() => handleRemoveUnneededImage(question)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-rose-500 text-rose-700 rounded-md font-semibold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <ImageOff className="w-3 h-3" />
                            Prune Figure
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            {report.perfectQuestions} of {report.totalQuestions} questions verified 100% mathematically and structurally sound.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
