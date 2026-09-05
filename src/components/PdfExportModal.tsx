import React, { useState } from 'react';
import { X, FileText, Download, Check, ShieldAlert, LogIn } from 'lucide-react';
import { OverallAnalytics, Question, UserProfile } from '../types';
import { generatePSATProgressPDF, ReportOptions } from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: OverallAnalytics;
  allQuestions: Question[];
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  analytics,
  allQuestions,
  currentUser,
  onOpenAuthModal
}) => {
  const isGuest = !currentUser || currentUser.isAnonymous;
  const [studentName, setStudentName] = useState(currentUser?.displayName || (isGuest ? 'Guest Student' : 'Alex Morgan'));
  const [assessmentTarget, setAssessmentTarget] = useState('PSAT 8/9 & PSAT 10');
  const [includeSkillBreakdown, setIncludeSkillBreakdown] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      const options: ReportOptions = {
        studentName,
        assessmentTarget,
        includeSkillBreakdown,
        includeRecommendations
      };
      generatePSATProgressPDF(analytics, allQuestions, options);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 600);
    } catch (e) {
      console.error(e);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Export Progress Report as PDF</h3>
              <p className="text-xs text-slate-500">Official College Board format diagnostic summary</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Session Banner */}
        {isGuest && (
          <div className="p-4 bg-amber-50/90 border-b border-amber-200/80 flex items-start justify-between gap-3 text-amber-950">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Guest Session Report</p>
                <p className="text-amber-800/90 text-[11px] leading-relaxed">
                  This PDF captures practice data from your current session. Sign in to generate official tracked reports with verified candidate records.
                </p>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        )}

        {/* Body Form */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Student / Candidate Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter student name..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Target Assessment
            </label>
            <select
              value={assessmentTarget}
              onChange={(e) => setAssessmentTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PSAT 8/9">PSAT 8/9</option>
              <option value="PSAT 10">PSAT 10</option>
              <option value="PSAT/NMSQT">PSAT/NMSQT</option>
              <option value="SAT">SAT</option>
              <option value="PSAT 8/9 & PSAT 10">PSAT 8/9 & PSAT 10 Combined</option>
            </select>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
            <span className="font-bold text-indigo-950 text-xs uppercase tracking-wide block">
              Report Inclusions:
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeSkillBreakdown}
                onChange={(e) => setIncludeSkillBreakdown(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include granular Skill & Standard Accuracy Table</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include Actionable Targeted Drill Recommendations</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Progress PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
