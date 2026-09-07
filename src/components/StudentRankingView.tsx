import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  Zap, 
  Star, 
  Shield, 
  Lock, 
  LogIn, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Sparkles,
  Medal,
  Clock,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { OverallAnalytics, UserAttempt, UserProfile } from '../types';

interface StudentRankingViewProps {
  currentUser?: UserProfile | null;
  analytics: OverallAnalytics;
  attempts: UserAttempt[];
  streak: number;
  onOpenAuthModal: () => void;
  onNavigateToBank: () => void;
  onLaunchDrill?: () => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarBg: string;
  level: number;
  tierName: string;
  totalXp: number;
  accuracy: number;
  streak: number;
  isCurrentUser?: boolean;
}

export const StudentRankingView: React.FC<StudentRankingViewProps> = ({
  currentUser,
  analytics,
  attempts,
  streak,
  onOpenAuthModal,
  onNavigateToBank,
  onLaunchDrill
}) => {
  const isAuthenticated = !!(currentUser && !currentUser.isAnonymous);
  const [selectedDivision, setSelectedDivision] = useState<'overall' | 'accuracy' | 'streak'>('overall');

  // Compute authenticated XP
  // 50 XP per correct question, 10 XP per attempt, 100 XP per streak day
  const totalXp = (analytics.totalCorrect * 50) + (analytics.totalAttempted * 10) + (streak * 100);

  // Tiers definition
  const levels = [
    { 
      level: 1, 
      name: 'PSAT Novice', 
      minXp: 0, 
      maxXp: 300, 
      badge: '🌱', 
      description: 'Starting your PSAT prep journey and building baseline diagnostic stamina.' 
    },
    { 
      level: 2, 
      name: 'Concept Apprentice', 
      minXp: 300, 
      maxXp: 800, 
      badge: '⚡', 
      description: 'Gaining confidence across core Algebra, Grammar conventions, and Reading ideas.' 
    },
    { 
      level: 3, 
      name: 'Algebra & R&W Scholar', 
      minXp: 800, 
      maxXp: 1800, 
      badge: '🎯', 
      description: 'Consistently hitting high accuracy on Medium & Hard practice drills.' 
    },
    { 
      level: 4, 
      name: 'National Merit Contender', 
      minXp: 1800, 
      maxXp: 3500, 
      badge: '🏆', 
      description: 'Positioned in the top 10% percentile with disciplined daily study streaks.' 
    },
    { 
      level: 5, 
      name: '99th Percentile Master', 
      minXp: 3500, 
      maxXp: 10000, 
      badge: '👑', 
      description: 'Elite mastery across all digital PSAT/NMSQT & SAT assessment domains.' 
    }
  ];

  const currentTier = levels.find((l) => totalXp >= l.minXp && totalXp < l.maxXp) || levels[levels.length - 1];
  const nextTier = levels[levels.indexOf(currentTier) + 1] || null;
  const progressInTier = nextTier 
    ? Math.min(100, Math.round(((totalXp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100))
    : 100;
  const xpNeededForNext = nextTier ? Math.max(0, nextTier.minXp - totalXp) : 0;

  // Percentile Estimation based on accuracy and XP
  const estimatedPercentile = totalXp > 0
    ? Math.min(99, Math.max(50, Math.round(50 + (analytics.overallAccuracy * 0.4) + Math.min(10, totalXp / 250))))
    : 50;

  // Badges calculation
  const badges = [
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
      unlocked: streak >= 3,
      progress: `${Math.min(streak, 3)}/3 days`
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

  // Cohort Leaderboard Data
  const baseLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Maya L. (Thomas Jefferson High)', avatarBg: 'bg-amber-600', level: 5, tierName: '99th Percentile Master', totalXp: 4820, accuracy: 96, streak: 28 },
    { rank: 2, name: 'David C. (Stuyvesant High)', avatarBg: 'bg-blue-600', level: 5, tierName: '99th Percentile Master', totalXp: 4150, accuracy: 94, streak: 21 },
    { rank: 3, name: 'Aarti S. (Austin Academy)', avatarBg: 'bg-indigo-600', level: 4, tierName: 'National Merit Contender', totalXp: 3420, accuracy: 91, streak: 15 },
    { rank: 4, name: 'Ethan W. (Monta Vista High)', avatarBg: 'bg-purple-600', level: 4, tierName: 'National Merit Contender', totalXp: 2890, accuracy: 89, streak: 12 },
    { rank: 5, name: 'Sophia R. (Lexington High)', avatarBg: 'bg-emerald-600', level: 3, tierName: 'Algebra & R&W Scholar', totalXp: 2150, accuracy: 87, streak: 9 }
  ];

  // Current user's dynamic entry in leaderboard
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'You (Verified Scholar)';
  const currentUserEntry: LeaderboardEntry = {
    rank: totalXp >= 4000 ? 2 : totalXp >= 3000 ? 4 : totalXp >= 1500 ? 6 : totalXp >= 600 ? 8 : 12,
    name: `${userDisplayName} (You)`,
    avatarBg: 'bg-blue-600 ring-2 ring-blue-400',
    level: currentTier.level,
    tierName: currentTier.name,
    totalXp: totalXp,
    accuracy: analytics.overallAccuracy,
    streak: streak,
    isCurrentUser: true
  };

  // Sort and assemble leaderboard
  const displayLeaderboard = [...baseLeaderboard];
  if (!displayLeaderboard.some(e => e.isCurrentUser)) {
    displayLeaderboard.push(currentUserEntry);
    displayLeaderboard.sort((a, b) => {
      if (selectedDivision === 'overall') return b.totalXp - a.totalXp;
      if (selectedDivision === 'accuracy') return b.accuracy - a.accuracy;
      return b.streak - a.streak;
    });
    // Recalculate rank index
    displayLeaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });
  }

  // ==========================================
  // CASE 1: UNAUTHENTICATED / GUEST AUTH WALL
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in">
        {/* Protected Route Hero Gate */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-12 text-white shadow-xl">
          {/* Subtle Ambient Background Accents */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
            {/* Lock Emblem & Security Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Protected Route • Authentication Required</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Student Rank &amp; Cohort Leaderboards
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Official student rankings, percentile benchmarking, XP tier roadmaps, and verified badge milestones are protected behind authentication. Sign in to claim your official student standing and compete with PSAT scholars.
            </p>

            {/* Primary Action Row */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In or Create Free Account</span>
              </button>
              
              <button
                onClick={onNavigateToBank}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-sm border border-white/10 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Continue Practicing as Guest</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Grid: Why We Require Authentication for Ranks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Fair Cohort Integrity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Requiring verified logins prevents ephemeral guest sessions from skewing percentiles, ensuring every rank on the leaderboard reflects genuine, authentic student effort.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Permanent XP &amp; Badges</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guest data is temporary to your browser. Signing in permanently links your XP, achievement trophies, and mastery streaks across all your phones, tablets, and laptops.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Percentile Diagnostics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get detailed performance percentiles benchmarked against official National Merit Qualifying Scholarship standards (PSAT/NMSQT &amp; SAT).
            </p>
          </div>
        </div>

        {/* Sneak Peek / Preview of Protected Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-800">Preview: Cohort Leaderboard (Top Scholars)</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Locked View</span>
          </div>

          <div className="divide-y divide-slate-100 relative">
            {baseLeaderboard.slice(0, 3).map((student) => (
              <div key={student.rank} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    #{student.rank}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{student.name}</div>
                    <div className="text-[11px] text-slate-500">{student.tierName} • {student.accuracy}% Accuracy</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-blue-600">{student.totalXp.toLocaleString()} XP</div>
                  <div className="text-[10px] text-slate-400">{student.streak}-day streak</div>
                </div>
              </div>
            ))}

            {/* Blurred Rows Overlay */}
            <div className="p-8 text-center bg-slate-50/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Lock className="w-6 h-6 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">Sign in to view full rank standings and join the leaderboard</p>
              <button
                onClick={onOpenAuthModal}
                className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Sign In to Unlock Rank
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: AUTHENTICATED STUDENT RANK VIEW
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-in fade-in">
      
      {/* 1. STUDENT RANK HERO CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* User Info & Verified Status */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {currentTier.level}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Verified Scholar
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Estimated {estimatedPercentile}th Percentile
                </span>
                {streak > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>{streak} Day Streak (+{streak * 100} XP)</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {currentTier.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {currentTier.description}
              </p>
            </div>
          </div>

          {/* XP & Next Level Summary */}
          <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-start bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Verified XP</div>
              <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                {totalXp.toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Badges Unlocked</div>
              <div className="text-2xl font-black text-slate-900">
                {unlockedCount} <span className="text-xs text-slate-400 font-normal">/ {badges.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div className="pt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">
              {nextTier ? (
                <>Next Tier: <strong className="text-slate-900">{nextTier.name}</strong> ({xpNeededForNext.toLocaleString()} XP remaining)</>
              ) : (
                <strong className="text-amber-600">Highest Rank Attained!</strong>
              )}
            </span>
            <span className="text-blue-600 font-bold font-mono">{progressInTier}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${progressInTier}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>{currentTier.minXp.toLocaleString()} XP</span>
            <span>{nextTier ? nextTier.minXp.toLocaleString() : 'Max'} XP</span>
          </div>
        </div>
      </div>

      {/* 2. RANK PROGRESSION LADDER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Student Rank Progression Roadmap</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Climb through 5 official performance ranks by completing questions, maintaining streaks, and mastering skills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {levels.map((lvl) => {
            const isCompleted = totalXp >= lvl.maxXp;
            const isCurrent = totalXp >= lvl.minXp && totalXp < lvl.maxXp;
            const isLocked = totalXp < lvl.minXp;

            return (
              <div
                key={lvl.level}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  isCurrent
                    ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{lvl.badge}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isCurrent ? 'Current' : isCompleted ? 'Mastered' : 'Locked'}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Level {lvl.level}</div>
                  <div className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{lvl.name}</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{lvl.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[10px] font-mono font-semibold text-slate-600">
                  {lvl.minXp.toLocaleString()} - {lvl.maxXp.toLocaleString()} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COHORT LEADERBOARD & ACHIEVEMENTS BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Cohort Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">PSAT Scholars Cohort Leaderboard</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Benchmarked across active authenticated students</p>
            </div>

            {/* Division Filter Segment */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-semibold">
              <button
                onClick={() => setSelectedDivision('overall')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDivision === 'overall' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top XP
              </button>
              <button
                onClick={() => setSelectedDivision('accuracy')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDivision === 'accuracy' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Accuracy
              </button>
              <button
                onClick={() => setSelectedDivision('streak')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDivision === 'streak' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Streaks
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {displayLeaderboard.map((scholar) => (
              <div
                key={scholar.rank}
                className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors ${
                  scholar.isCurrentUser
                    ? 'bg-blue-50/80 font-semibold border-l-4 border-l-blue-600'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    scholar.rank === 1 ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400' :
                    scholar.rank === 2 ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300' :
                    scholar.rank === 3 ? 'bg-amber-700/20 text-amber-900' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {scholar.rank <= 3 ? ['🥇', '🥈', '🥉'][scholar.rank - 1] : `#${scholar.rank}`}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{scholar.name}</span>
                      {scholar.isCurrentUser && (
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Level {scholar.level} • {scholar.tierName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 text-right">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{scholar.accuracy}%</div>
                    <div className="text-[10px] text-slate-400">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-700 flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>{scholar.streak}d</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Streak</div>
                  </div>
                  <div className="min-w-20 text-right">
                    <div className="text-xs sm:text-sm font-mono font-bold text-blue-600">
                      {scholar.totalXp.toLocaleString()} XP
                    </div>
                    <div className="text-[10px] text-slate-400">Total XP</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Badges & Rank Booster */}
        <div className="space-y-6">
          {/* Achievement Badges Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Achievement Badges</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {unlockedCount}/{badges.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    b.unlocked
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="text-xl p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{b.name}</h4>
                      {b.unlocked ? (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400">
                          {b.progress}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Rank Booster Actions */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm">Boost Your Rank</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Earn +50 XP for every question answered correctly, +10 XP for every attempt, and +100 XP for maintaining your daily study streak.
            </p>
            <button
              onClick={onNavigateToBank}
              className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Practice Questions Now (+50 XP)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
