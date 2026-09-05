import { UserAttempt, DrillSession, OverallAnalytics, TopicProficiency, Question } from '../types';

const ATTEMPTS_KEY = 'psat_user_attempts_v1';
const BOOKMARKS_KEY = 'psat_user_bookmarks_v1';
const DRILLS_KEY = 'psat_drill_sessions_v1';
const STREAK_KEY = 'psat_user_streak_v1';
const CUSTOM_QUESTIONS_KEY = 'psat_custom_questions_v1';

export function getStoredCustomQuestions(): Question[] {
  try {
    const data = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomQuestions(questions: Question[]) {
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed to save custom questions', e);
  }
}

export function getStoredAttempts(): UserAttempt[] {
  try {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load attempts', e);
    return [];
  }
}

export function saveAttempt(attempt: Omit<UserAttempt, 'id' | 'timestamp'>): UserAttempt {
  const attempts = getStoredAttempts();
  const newAttempt: UserAttempt = {
    ...attempt,
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  };

  attempts.push(newAttempt);
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    updateDailyStreak();
  } catch (e) {
    console.error('Failed to save attempt', e);
  }

  return newAttempt;
}

export function getBookmarks(): string[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleBookmark(questionId: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(questionId);
  let isBookmarked = false;

  if (index >= 0) {
    bookmarks.splice(index, 1);
    isBookmarked = false;
  } else {
    bookmarks.push(questionId);
    isBookmarked = true;
  }

  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to toggle bookmark', e);
  }

  return isBookmarked;
}

export function getDrillSessions(): DrillSession[] {
  try {
    const data = localStorage.getItem(DRILLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveDrillSession(session: DrillSession) {
  const sessions = getDrillSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }

  try {
    localStorage.setItem(DRILLS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save drill session', e);
  }
}

export function getStreakInfo(): { currentStreak: number; longestStreak: number; lastActiveDate: string } {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { currentStreak: 1, longestStreak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
  } catch (e) {
    return { currentStreak: 1, longestStreak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
  }
}

function updateDailyStreak() {
  const today = new Date().toISOString().split('T')[0];
  const info = getStreakInfo();

  if (info.lastActiveDate === today) {
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newCurrent = 1;
  if (info.lastActiveDate === yesterday) {
    newCurrent = info.currentStreak + 1;
  }

  const updated = {
    currentStreak: newCurrent,
    longestStreak: Math.max(info.longestStreak, newCurrent),
    lastActiveDate: today
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
}

export function calculateAnalytics(attempts: UserAttempt[], totalQuestionsCount: number): OverallAnalytics {
  const streak = getStreakInfo();

  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const timeSpentTotalSeconds = attempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0);

  // Group by Domain
  const domainStats: Record<string, { attempted: number; correct: number; totalTime: number }> = {};
  const skillStats: Record<string, { attempted: number; correct: number; totalTime: number; domain: string }> = {};
  const difficultyStats: Record<string, { attempted: number; correct: number; totalTime: number }> = {};

  attempts.forEach((a) => {
    // Domain
    if (!domainStats[a.domain]) domainStats[a.domain] = { attempted: 0, correct: 0, totalTime: 0 };
    domainStats[a.domain].attempted += 1;
    if (a.isCorrect) domainStats[a.domain].correct += 1;
    domainStats[a.domain].totalTime += a.timeSpentSeconds || 0;

    // Skill
    if (!skillStats[a.skill]) skillStats[a.skill] = { attempted: 0, correct: 0, totalTime: 0, domain: a.domain };
    skillStats[a.skill].attempted += 1;
    if (a.isCorrect) skillStats[a.skill].correct += 1;
    skillStats[a.skill].totalTime += a.timeSpentSeconds || 0;

    // Difficulty
    if (!difficultyStats[a.difficulty]) difficultyStats[a.difficulty] = { attempted: 0, correct: 0, totalTime: 0 };
    difficultyStats[a.difficulty].attempted += 1;
    if (a.isCorrect) difficultyStats[a.difficulty].correct += 1;
    difficultyStats[a.difficulty].totalTime += a.timeSpentSeconds || 0;
  });

  const domainProficiency: Record<string, TopicProficiency> = {};
  Object.keys(domainStats).forEach((k) => {
    const s = domainStats[k];
    const acc = Math.round((s.correct / s.attempted) * 100);
    // Mastery weights accuracy and volume
    const volumeWeight = Math.min(s.attempted / 5, 1);
    const mastery = Math.round(acc * (0.6 + 0.4 * volumeWeight));
    domainProficiency[k] = {
      attempted: s.attempted,
      correct: s.correct,
      accuracyPercent: acc,
      masteryPercent: mastery,
      averageTimeSeconds: Math.round(s.totalTime / s.attempted)
    };
  });

  const skillProficiency: Record<string, TopicProficiency> = {};
  const skillsList: { skill: string; domain: string; accuracy: number; count: number }[] = [];

  Object.keys(skillStats).forEach((k) => {
    const s = skillStats[k];
    const acc = Math.round((s.correct / s.attempted) * 100);
    const volumeWeight = Math.min(s.attempted / 3, 1);
    const mastery = Math.round(acc * (0.5 + 0.5 * volumeWeight));
    skillProficiency[k] = {
      attempted: s.attempted,
      correct: s.correct,
      accuracyPercent: acc,
      masteryPercent: mastery,
      averageTimeSeconds: Math.round(s.totalTime / s.attempted)
    };
    skillsList.push({
      skill: k,
      domain: s.domain,
      accuracy: acc,
      count: s.attempted
    });
  });

  const difficultyProficiency: Record<string, TopicProficiency> = {};
  Object.keys(difficultyStats).forEach((k) => {
    const s = difficultyStats[k];
    const acc = Math.round((s.correct / s.attempted) * 100);
    difficultyProficiency[k] = {
      attempted: s.attempted,
      correct: s.correct,
      accuracyPercent: acc,
      masteryPercent: acc,
      averageTimeSeconds: Math.round(s.totalTime / s.attempted)
    };
  });

  const weakestSkills = [...skillsList].sort((a, b) => a.accuracy - b.accuracy || b.count - a.count).slice(0, 4);
  const strongestSkills = [...skillsList].sort((a, b) => b.accuracy - a.accuracy || b.count - a.count).slice(0, 4);

  // Daily activity for the past 7 days
  const dailyMap: Record<string, { count: number; correct: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    dailyMap[d] = { count: 0, correct: 0 };
  }

  attempts.forEach((a) => {
    const d = new Date(a.timestamp).toISOString().split('T')[0];
    if (dailyMap[d]) {
      dailyMap[d].count += 1;
      if (a.isCorrect) dailyMap[d].correct += 1;
    }
  });

  const dailyActivity = Object.keys(dailyMap).map((date) => ({
    date,
    count: dailyMap[date].count,
    correct: dailyMap[date].correct
  }));

  return {
    totalQuestions: totalQuestionsCount,
    totalAttempted,
    totalCorrect,
    overallAccuracy,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    timeSpentTotalSeconds,
    domainProficiency,
    skillProficiency,
    difficultyProficiency,
    weakestSkills,
    strongestSkills,
    dailyActivity
  };
}
