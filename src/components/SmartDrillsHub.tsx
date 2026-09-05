import React from 'react';
import { 
  Zap, 
  Target, 
  RotateCcw, 
  Clock, 
  Sparkles, 
  Flame, 
  Award, 
  ArrowRight,
  BookOpen,
  Layers,
  BarChart3
} from 'lucide-react';
import { OverallAnalytics, Question, UserAttempt } from '../types';

interface SmartDrillsHubProps {
  analytics: OverallAnalytics;
  allQuestions: Question[];
  attempts: UserAttempt[];
  onLaunchDailyDrill: () => void;
  onLaunchWeaknessDrill: () => void;
  onLaunchMissedDrill: () => void;
  onLaunchTimedDrill: (test: 'Math' | 'Reading and Writing') => void;
  onLaunchHardDrill: (domain?: string) => void;
  onLaunchSkillDrill: (skill: string) => void;
}

export const SmartDrillsHub: React.FC<SmartDrillsHubProps> = ({
  analytics,
  allQuestions,
  attempts,
  onLaunchDailyDrill,
  onLaunchWeaknessDrill,
  onLaunchMissedDrill,
  onLaunchTimedDrill,
  onLaunchHardDrill,
  onLaunchSkillDrill
}) => {
  const missedCount = Array.from(
    new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.questionId))
  ).length;

  const hardQuestionsCount = allQuestions.filter((q) => q.difficulty === 'Hard').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 rounded-md text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
              Adaptive Practice Engine
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">
              <Flame className="w-3.5 h-3.5 fill-amber-300" /> {analytics.currentStreak} Day Streak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Smart Adaptive Drills</h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Targeted high-efficiency sprints engineered to simulate the College Board Digital PSAT/SAT environment.
          </p>
        </div>

        {/* Featured Daily Sprint Action */}
        <button
          onClick={onLaunchDailyDrill}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-white" />
          <span>Launch Today's Daily Sprint (5 Qs)</span>
        </button>
      </div>

      {/* Grid of Adaptive Drill Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Daily Sprint */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Adaptive Daily Sprint</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              5 balanced questions spanning Math & Reading to maintain your daily streak and sharpen problem-solving reflexes.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span>⏱️ ~5 mins</span>
              <span>·</span>
              <span>5 Questions</span>
            </div>
          </div>
          <button
            onClick={onLaunchDailyDrill}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Start Daily Sprint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Weak Spot Remediation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Weak Spot Destroyer</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically identifies your lowest-accuracy skills and creates a custom 5-question remediation drill.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold">
              <span>{analytics.weakestSkills.length} Priority Focus Areas</span>
            </div>
          </div>
          <button
            onClick={onLaunchWeaknessDrill}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Target Weak Spots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Error Notebook Redo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Missed Question Marathon</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Re-attempt questions you previously missed to achieve 100% mastery and eliminate exam traps.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-rose-600 font-bold">
              <span>{missedCount} Missed Questions Logged</span>
            </div>
          </div>
          <button
            onClick={onLaunchMissedDrill}
            disabled={missedCount === 0}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Redo Missed ({missedCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Timed Exam Pacing Simulation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Bluebook Speed Simulation</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict 70s/problem digital pacing countdown to train speed, elimination instinct, and eliminate time anxiety.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span>Official Digital SAT Clock</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onLaunchTimedDrill('Math')}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Math Speed
            </button>
            <button
              onClick={() => onLaunchTimedDrill('Reading and Writing')}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Reading Speed
            </button>
          </div>
        </div>

        {/* 5. Hard Math Masterclass */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Hard Math Masterclass</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tackle the toughest PSAT Math problems (Level 3 Hard) designed for students aiming for 700+ scaled scores.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-700 font-semibold">
              <span>{hardQuestionsCount} Hard Questions in Bank</span>
            </div>
          </div>
          <button
            onClick={() => onLaunchHardDrill()}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Start Hard Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6. Reading & Writing Booster */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Reading & Writing Sprint</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Punctuation, rhetoric, logical transitions, and vocabulary-in-context passages for high-speed mastery.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span>Grammar & Evidence</span>
            </div>
          </div>
          <button
            onClick={() => onLaunchSkillDrill('Punctuation and Sentence Structure')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Start R&W Sprint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
