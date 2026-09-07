import React, { useState } from 'react';
import { 
  Award, 
  Clock, 
  Layers, 
  Play, 
  Sparkles, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Calendar,
  RotateCcw,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { PracticeTestDefinition, PracticeTestResult, PracticeTestType } from '../../types';
import { PRACTICE_TESTS_CATALOG } from '../../data/practiceTestsCatalog';

interface PracticeTestsCatalogViewProps {
  onStartTest: (test: PracticeTestDefinition) => void;
  pastResults: PracticeTestResult[];
  onViewResult: (result: PracticeTestResult) => void;
}

export const PracticeTestsCatalogView: React.FC<PracticeTestsCatalogViewProps> = ({
  onStartTest,
  pastResults = [],
  onViewResult
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showAdaptiveGuide, setShowAdaptiveGuide] = useState<boolean>(false);

  const filteredTests = PRACTICE_TESTS_CATALOG.filter((test) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'psat') return test.type === 'PSAT/NMSQT' || test.type === 'PSAT 10';
    if (activeTab === 'sat') return test.type === 'SAT';
    if (activeTab === 'psat89') return test.type === 'PSAT 8/9';
    return true;
  });

  const getLatestResultForTest = (testId: string) => {
    return pastResults.find((r) => r.testId === testId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Official College Board &bull; Bluebook™ Exam Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Full-Length Adaptive Practice Exams
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
            Experience the real digital testing environment with authentic 2-stage multistage adaptive testing (MST), built-in Desmos graphing calculator, timed intermission, and official scaled scoring with NMSC Selection Index calculations.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 relative z-10">
          <button
            onClick={() => setShowAdaptiveGuide(!showAdaptiveGuide)}
            className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-4 flex items-start gap-3 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">2-Stage Adaptive Engine</h4>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Routing into Upper or Lower Stage Module 2 based on Module 1. <span className="text-blue-400 font-semibold underline">Click to see guide</span>
              </p>
            </div>
          </button>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Exact Official Timing</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                32m RW / 35m Math per module + 10m scheduled intermission with countdown.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Scaled Scores &amp; NMSC SI</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Official 320–1520 / 400–1600 composite scale with National Merit percentiles.
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Visual Multistage Adaptive Guide */}
        {showAdaptiveGuide && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-4 animate-in fade-in duration-200 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                How College Board Multistage Adaptive Testing (MST) Works
              </h3>
              <button
                onClick={() => setShowAdaptiveGuide(false)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Close Guide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase">
                  Module 1: Routing Stage
                </span>
                <p className="text-slate-300">
                  Every test begins with <strong>Module 1</strong> containing a balanced mix of Easy, Medium, and Hard questions across all skills. Your overall score on Module 1 determines your adaptive path.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] uppercase">
                  Module 2: Upper vs. Lower Stage
                </span>
                <p className="text-slate-300">
                  • <strong>Module 2 Upper (Hard Stage)</strong>: Unlocked by answering ≥ 65% of Module 1 correctly. Qualifies for maximum scaled scores (up to 1520 / 1600).<br />
                  • <strong>Module 2 Lower (Standard Stage)</strong>: Focuses on core mastery with capped upper scoring.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Practice Tests ({PRACTICE_TESTS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('psat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'psat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            PSAT/NMSQT &bull; PSAT 10
          </button>
          <button
            onClick={() => setActiveTab('sat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Digital SAT
          </button>
          <button
            onClick={() => setActiveTab('psat89')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'psat89'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            PSAT 8/9
          </button>
        </div>

        {pastResults.length > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            <strong className="text-slate-900 font-bold">{pastResults.length}</strong> Completed Test{pastResults.length > 1 ? 's' : ''} on record
          </span>
        )}
      </div>

      {/* Test Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => {
          const latestResult = getLatestResultForTest(test.id);

          return (
            <div
              key={test.id}
              className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-3.5">
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                    {test.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    test.badge === 'High-Scorer Challenge'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : test.badge === 'Foundational Diagnostic'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {test.badge}
                  </span>
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                    {test.description}
                  </p>
                </div>

                {/* Test Structure Details */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>{test.totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>{test.totalMinutes} Mins</span>
                  </div>
                </div>

                {/* Past Attempt Badge if available */}
                {latestResult && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Latest Score</span>
                      <span className="font-mono text-base font-extrabold text-blue-700">
                        {latestResult.compositeScore}
                        <span className="text-xs text-slate-400 font-normal"> / {latestResult.maxCompositeScore}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewResult(latestResult)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      View Report
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onStartTest(test)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{latestResult ? 'Retake Timed Exam' : 'Start Timed Exam'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Past Completed Exams History */}
      {pastResults.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Your Exam Score History</h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {pastResults.map((res) => (
              <div
                key={res.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 p-2 rounded-2xl transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{res.testTitle}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{new Date(res.completedAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>{Math.round(res.totalTimeSpentSeconds / 60)} min duration</span>
                    {res.selectionIndex && (
                      <>
                        <span>&bull;</span>
                        <span className="font-bold text-amber-600">NMSC SI: {res.selectionIndex}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-mono text-xl font-extrabold text-blue-700 block">
                      {res.compositeScore}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{res.percentile}th Percentile</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewResult(res)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
