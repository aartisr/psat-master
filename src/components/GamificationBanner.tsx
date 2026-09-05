import React, { useState } from 'react';
import { Trophy, Award, Flame, Zap, Star, Shield, ChevronRight, CheckCircle2, X, ShieldAlert, LogIn } from 'lucide-react';
import { OverallAnalytics, UserAttempt, UserProfile } from '../types';

interface GamificationBannerProps {
  analytics: OverallAnalytics;
  attempts: UserAttempt[];
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: string;
}

export const GamificationBanner: React.FC<GamificationBannerProps> = ({
  analytics,
  attempts,
  currentUser,
  onOpenAuthModal
}) => {
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const isGuest = !currentUser || currentUser.isAnonymous;

  // Compute XP
  // 50 XP per correct question, 10 XP per attempt, 100 XP per streak day
  const totalXp = (analytics.totalCorrect * 50) + (analytics.totalAttempted * 10) + (analytics.currentStreak * 100);

  // Determine Level Tier
  const levels = [
    { level: 1, name: 'PSAT Novice', minXp: 0, maxXp: 300, color: 'text-slate-700 bg-slate-100' },
    { level: 2, name: 'Concept Apprentice', minXp: 300, maxXp: 800, color: 'text-blue-700 bg-blue-100' },
    { level: 3, name: 'Algebra & R&W Scholar', minXp: 800, maxXp: 1800, color: 'text-indigo-700 bg-indigo-100' },
    { level: 4, name: 'National Merit Contender', minXp: 1800, maxXp: 3500, color: 'text-purple-700 bg-purple-100' },
    { level: 5, name: '99th Percentile Master', minXp: 3500, maxXp: 10000, color: 'text-amber-700 bg-amber-100' }
  ];

  const currentTier = levels.find((l) => totalXp >= l.minXp && totalXp < l.maxXp) || levels[levels.length - 1];
  const nextTier = levels[levels.indexOf(currentTier) + 1] || currentTier;
  const progressInTier = Math.min(
    100,
    Math.round(((totalXp - currentTier.minXp) / (currentTier.maxXp - currentTier.minXp)) * 100)
  );

  // Compute Badges
  const badges: Badge[] = [
    {
      id: 'first_blood',
      name: 'First Blood',
      desc: 'Complete your first PSAT practice question',
      icon: '🎯',
      unlocked: attempts.length >= 1,
      progress: `${Math.min(attempts.length, 1)}/1`
    },
    {
      id: 'streak_3',
      name: 'Consistent Scholar',
      desc: 'Maintain a 3-day practice streak',
      icon: '🔥',
      unlocked: analytics.currentStreak >= 3,
      progress: `${Math.min(analytics.currentStreak, 3)}/3 days`
    },
    {
      id: 'speed_demon',
      name: 'Lightning Solver',
      desc: 'Solve 3 questions correctly in under 40 seconds each',
      icon: '⚡',
      unlocked: attempts.filter((a) => a.isCorrect && a.timeSpentSeconds <= 40).length >= 3,
      progress: `${Math.min(attempts.filter((a) => a.isCorrect && a.timeSpentSeconds <= 40).length, 3)}/3`
    },
    {
      id: 'math_ace',
      name: 'Algebra Ace',
      desc: 'Solve 5 Math Algebra questions correctly',
      icon: '📐',
      unlocked: attempts.filter((a) => a.isCorrect && a.domain === 'Algebra').length >= 5,
      progress: `${Math.min(attempts.filter((a) => a.isCorrect && a.domain === 'Algebra').length, 5)}/5`
    },
    {
      id: 'grammar_guru',
      name: 'Grammar Virtuoso',
      desc: 'Master Standard English Conventions with 80%+ accuracy',
      icon: '✍️',
      unlocked: (analytics.domainProficiency['Standard English Conventions']?.accuracyPercent || 0) >= 80,
      progress: `${analytics.domainProficiency['Standard English Conventions']?.accuracyPercent || 0}%/80%`
    },
    {
      id: 'century_club',
      name: 'Century Club',
      desc: 'Accumulate 1,000 Total XP',
      icon: '👑',
      unlocked: totalXp >= 1000,
      progress: `${Math.min(totalXp, 1000)}/1000 XP`
    }
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <>
      {/* XP Mini Bar / Rank Widget */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-1 ring-slate-900/5">
        {/* Left: Level & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-indigo-500/25 shrink-0 ring-2 ring-white">
            {currentTier.level}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Student Rank</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-50/90 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-2xs">
                {totalXp.toLocaleString()} XP
              </span>
              {isGuest && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                  Guest Session
                </span>
              )}
            </div>
            <div className="text-base font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              <span>{currentTier.name}</span>
              {isGuest && onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Save &amp; Track
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Progress to next level */}
        <div className="flex-1 w-full max-w-xs space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span className="text-slate-500">Next: <strong className="text-slate-800">{nextTier.name}</strong></span>
            <span className="text-indigo-600 font-extrabold">{progressInTier}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: `${progressInTier}%` }}
            />
          </div>
        </div>

        {/* Right: Badges Trigger */}
        <button
          onClick={() => setShowBadgesModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200/80 rounded-2xl text-xs font-bold transition-all shrink-0 shadow-2xs hover:shadow-xs hover:border-slate-300 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Badges ({unlockedCount}/{badges.length})</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Badges Modal */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base">Achievement Badges</h3>
                  <p className="text-xs text-slate-400">Unlock mastery milestones as you prepare</p>
                </div>
              </div>
              <button
                onClick={() => setShowBadgesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest Session Notice */}
            {isGuest && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-3 text-amber-950">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Guest Session:</strong> Badges unlocked now are active for this browser session. Sign in to permanently track your badges and streaks across devices.
                  </span>
                </div>
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setShowBadgesModal(false);
                      onOpenAuthModal();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Save Progress
                  </button>
                )}
              </div>
            )}

            {/* Badges Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    b.unlocked
                      ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="text-2xl p-2 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{b.name}</h4>
                      {b.unlocked && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{b.desc}</p>
                    <div className="text-[10px] font-mono text-slate-400 font-bold mt-1.5">
                      Progress: {b.progress}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowBadgesModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
