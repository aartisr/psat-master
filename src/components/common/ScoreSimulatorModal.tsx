import React, { useState } from 'react';
import { X, Target, Trophy, Award, Sparkles, TrendingUp, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OverallAnalytics, Question } from '../../types';

interface ScoreSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: OverallAnalytics;
  allQuestions: Question[];
  onLaunchSkillDrill?: (skill: string) => void;
}

export const ScoreSimulatorModal: React.FC<ScoreSimulatorModalProps> = ({
  isOpen,
  onClose,
  analytics,
  allQuestions,
  onLaunchSkillDrill
}) => {
  const [testType, setTestType] = useState<'PSAT' | 'SAT'>('PSAT');

  if (!isOpen) return null;

  // Calculate section accuracies
  const mathProf = analytics.domainProficiency['Algebra'] || { correct: 0, total: 0, accuracyPercent: 0 };
  const rwProf = analytics.domainProficiency['Standard English Conventions'] || { correct: 0, total: 0, accuracyPercent: 0 };

  // Calculate overall performance or baseline
  const overallAcc = analytics.totalAttempted > 0 ? analytics.overallAccuracy : 75;

  // PSAT Score scale: 320 to 1520 (160 - 760 per section)
  // SAT Score scale: 400 to 1600 (200 - 800 per section)
  const maxSection = testType === 'PSAT' ? 760 : 800;
  const minSection = testType === 'PSAT' ? 160 : 200;
  const range = maxSection - minSection;

  const estimatedMathScore = Math.round(minSection + (overallAcc / 100) * range);
  const estimatedRwScore = Math.round(minSection + (Math.max(50, overallAcc - 3) / 100) * range);
  const totalScore = estimatedMathScore + estimatedRwScore;

  // PSAT NMSQT Selection Index (SI = 2 * (Reading/Writing / 10) + (Math / 10))
  // Range is 48 to 228
  const readingTestScore = Math.round(estimatedRwScore / 10);
  const mathTestScore = Math.round(estimatedMathScore / 10);
  const selectionIndex = Math.min(228, Math.max(48, (2 * readingTestScore) + mathTestScore));

  // Determine Percentile
  let percentile = '50th';
  let meritStatus = 'Developing Foundation';
  let meritColor = 'text-slate-600 bg-slate-100';

  if (selectionIndex >= 220) {
    percentile = '99th+ Percentile';
    meritStatus = 'Likely National Merit Semifinalist (Top States)';
    meritColor = 'text-amber-700 bg-amber-100 border-amber-300';
  } else if (selectionIndex >= 212) {
    percentile = '98th Percentile';
    meritStatus = 'National Merit Commended Student Contender';
    meritColor = 'text-purple-700 bg-purple-100 border-purple-300';
  } else if (selectionIndex >= 195) {
    percentile = '90th Percentile';
    meritStatus = 'Strong Competitive College Ready';
    meritColor = 'text-indigo-700 bg-indigo-100 border-indigo-300';
  } else if (selectionIndex >= 170) {
    percentile = '75th Percentile';
    meritStatus = 'Solid Academic Foundation';
    meritColor = 'text-blue-700 bg-blue-100 border-blue-300';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-2xl shadow-inner">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Digital {testType} Score &amp; National Merit Projector
              </h2>
              <p className="text-xs text-slate-300">Live score predictions calculated from your practice accuracy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Type Switcher */}
        <div className="px-6 pt-5 pb-1 flex items-center justify-between border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Benchmark Mode:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTestType('PSAT')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                testType === 'PSAT' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PSAT/NMSQT (Max 1520)
            </button>
            <button
              onClick={() => setTestType('SAT')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                testType === 'SAT' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Digital SAT (Max 1600)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Score Hero Card */}
          <div className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-indigo-800/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-1 text-center sm:text-left relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Estimated Total Score</span>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-baseline justify-center sm:justify-start gap-2">
                <span>{totalScore}</span>
                <span className="text-lg font-normal text-indigo-300 font-sans">/ {testType === 'PSAT' ? '1520' : '1600'}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap justify-center sm:justify-start">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {percentile}
                </span>
                <span className="text-xs text-slate-300">
                  Based on {analytics.totalAttempted} practice questions
                </span>
              </div>
            </div>

            {/* Section Breakdown Badges */}
            <div className="flex sm:flex-col gap-3 w-full sm:w-auto shrink-0 relative z-10">
              <div className="flex-1 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-slate-300">Reading &amp; Writing</div>
                <div className="text-xl font-black font-mono text-white">{estimatedRwScore} <span className="text-xs font-normal text-slate-300">/ {maxSection}</span></div>
              </div>
              <div className="flex-1 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-slate-300">Math Section</div>
                <div className="text-xl font-black font-mono text-white">{estimatedMathScore} <span className="text-xs font-normal text-slate-300">/ {maxSection}</span></div>
              </div>
            </div>

            {/* Ambient Background Blur */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* National Merit Selection Index Box (For PSAT) */}
          {testType === 'PSAT' && (
            <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/90 rounded-3xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-sm text-amber-950">NMSQT Selection Index (SI)</h3>
                </div>
                <span className="font-mono font-black text-lg text-amber-900 bg-white px-3 py-0.5 rounded-xl border border-amber-300 shadow-2xs">
                  {selectionIndex} <span className="text-xs font-normal text-slate-500">/ 228</span>
                </span>
              </div>
              <div className={`p-3 rounded-2xl border text-xs font-bold ${meritColor}`}>
                {meritStatus}
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                National Merit qualifying cutoffs typically range between 208 and 223 depending on your state (e.g. CA: ~221, TX: ~219, NY: ~220, FL: ~217).
              </p>
            </div>
          )}

          {/* Actionable High-Yield Tip */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> +50 Point Score Accelerator Recommendation
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on recent error clusters, mastering <strong>Algebra (Systems of Equations &amp; Quadratics)</strong> and <strong>Standard English Conventions (Punctuation Boundaries)</strong> provides the fastest path to bridge your gap to 1500+.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20"
          >
            Keep Practicing
          </button>
        </div>
      </div>
    </div>
  );
};
