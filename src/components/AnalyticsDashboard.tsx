import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  FileText, 
  Zap, 
  ArrowRight,
  Target,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { OverallAnalytics, Question, TopicProficiency, UserProfile } from '../types';

interface AnalyticsDashboardProps {
  analytics: OverallAnalytics;
  allQuestions: Question[];
  currentUser?: UserProfile | null;
  onLaunchSkillDrill: (skill: string) => void;
  onLaunchWeaknessDrill: () => void;
  onOpenPdfExport: () => void;
  onOpenAuthModal?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  allQuestions,
  currentUser,
  onLaunchSkillDrill,
  onLaunchWeaknessDrill,
  onOpenPdfExport,
  onOpenAuthModal
}) => {
  const estScaledScore = analytics.totalAttempted > 0
    ? Math.min(720, Math.round(300 + (analytics.overallAccuracy / 100) * 420))
    : 450;

  const isGuest = !currentUser || currentUser.isAnonymous;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner with Geometric Structure */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-800 rounded-md text-xs font-semibold uppercase tracking-wider text-slate-300 border border-slate-700">
              Proficiency Analytics
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">
              <Flame className="w-3.5 h-3.5 fill-amber-300" /> {analytics.currentStreak} Day Streak
            </span>
            {isGuest && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-[10px] font-extrabold uppercase">
                Guest Preview
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PSAT Performance Analytics</h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Real-time skill mastery tracking, diagnostic error analysis, and College Board benchmark predictions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onLaunchWeaknessDrill}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Target Weak Spots</span>
          </button>

          <button
            onClick={onOpenPdfExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Export Progress PDF</span>
          </button>
        </div>
      </div>

      {/* Guest Mode Functional Clarity Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/80 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-amber-950 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] ring-1 ring-amber-900/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5 border border-amber-200 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-amber-950">
                  Guest Practice Mode — Real-time Analytics Preview
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-200/90 text-amber-900 rounded-md border border-amber-300">
                  Saving &amp; Tracking Disabled
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-amber-900/80 max-w-2xl leading-relaxed">
                You have <strong>full, unrestricted access</strong> to practice all PSAT questions, use the calculator and whiteboard, and run all adaptive drills without an account. However, <strong>long-term mastery tracking</strong>, <strong>persistent historical scaled scores</strong>, and <strong>cross-device synchronization</strong> require a free student account.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm shadow-amber-600/25 transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Save &amp; Track Progress</span>
            </button>
          )}
        </div>
      )}

      {/* 4 High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.overallAccuracy}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics.totalCorrect} of {analytics.totalAttempted} questions correct
          </div>
        </div>

        {/* Projected PSAT Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Est. Math Scaled</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700">
            {estScaledScore} <span className="text-sm font-medium text-slate-400">/ 720</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Based on official PSAT 8/9 scoring curve
          </div>
        </div>

        {/* Questions Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Attempts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.totalAttempted}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {Object.keys(analytics.skillProficiency).length} unique skills
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Time Invested</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {Math.round(analytics.timeSpentTotalSeconds / 60)} <span className="text-sm font-medium text-slate-400">min</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg {analytics.totalAttempted > 0 ? Math.round(analytics.timeSpentTotalSeconds / analytics.totalAttempted) : 0}s per problem
          </div>
        </div>
      </div>

      {/* Main Breakdown: Domain Progress & Weak Spots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Proficiency (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Domain Proficiency & Mastery Index
            </h2>
            <span className="text-xs text-slate-400 font-medium">Weighted by volume & accuracy</span>
          </div>

          <div className="space-y-4">
            {Object.keys(analytics.domainProficiency).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No attempts recorded yet. Start practicing questions to see domain mastery curves!
              </div>
            ) : (
              (Object.entries(analytics.domainProficiency) as [string, TopicProficiency][]).map(([domain, stats]) => (
                <div key={domain} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 text-sm">{domain}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{stats.correct}/{stats.attempted} correct ({stats.accuracyPercent}%)</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide ${
                          stats.accuracyPercent >= 80
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : stats.accuracyPercent >= 60
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {stats.accuracyPercent >= 80 ? 'Mastered' : stats.accuracyPercent >= 60 ? 'Developing' : 'Needs Work'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.accuracyPercent >= 80
                          ? 'bg-emerald-500'
                          : stats.accuracyPercent >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(stats.accuracyPercent, 5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Weak Spots & Action Items (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900">Priority Focus Areas</h2>
          </div>

          <div className="space-y-3">
            {analytics.weakestSkills.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Take a few practice questions or launch a Daily Drill to automatically identify concepts needing review.
              </p>
            ) : (
              analytics.weakestSkills.map((sk) => (
                <div key={sk.skill} className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-rose-950 leading-tight">{sk.skill}</h4>
                      <p className="text-[11px] text-rose-700">{sk.domain} · {sk.accuracy}% accuracy</p>
                    </div>
                    <button
                      onClick={() => onLaunchSkillDrill(sk.skill)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-2xs"
                    >
                      Drill Skill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Drill Action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onLaunchWeaknessDrill}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>Launch Remediation Drill (5 Questions)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Granular Skills Table with Direct Drill Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Granular Skill Performance Breakdown</h2>
            <p className="text-xs text-slate-500">Click any skill to launch a dedicated targeted drill</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Skill / Standard</th>
                <th className="py-3 px-3">Attempts</th>
                <th className="py-3 px-3">Accuracy</th>
                <th className="py-3 px-3">Avg Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {Object.keys(analytics.skillProficiency).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No individual skill attempts yet.
                  </td>
                </tr>
              ) : (
                (Object.entries(analytics.skillProficiency) as [string, TopicProficiency][]).map(([skill, stats]) => (
                  <tr key={skill} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">{skill}</td>
                    <td className="py-3 px-3 font-mono">{stats.attempted}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{stats.accuracyPercent}%</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{stats.averageTimeSeconds}s</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          stats.accuracyPercent >= 80
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : stats.accuracyPercent >= 60
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {stats.accuracyPercent >= 80 ? 'Mastered' : stats.accuracyPercent >= 60 ? 'Review' : 'Remediate'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onLaunchSkillDrill(skill)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                      >
                        Practice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
