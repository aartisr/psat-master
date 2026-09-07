import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Header, MainNavTab } from './components/Header';
import { GamificationBanner } from './components/GamificationBanner';
import { AdminPortal } from './components/AdminPortal';
import { DrillRunner } from './components/DrillRunner';
import { SmartDrillsHub } from './components/SmartDrillsHub';
import { MistakeNotebook } from './components/MistakeNotebook';
import { ConceptCheatSheets } from './components/ConceptCheatSheets';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QuestionBankView } from './components/QuestionBankView';
import { StudentRankingView } from './components/StudentRankingView';
import { PracticeTestsHub } from './components/PracticeTestsHub';
import { SupportFeedbackHub, SupportSubTab } from './components/SupportFeedbackHub';
import { Footer } from './components/Footer';
import { AppModals } from './components/AppModals';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SeoHead } from './components/SeoHead';
import { PracticeProvider, usePractice } from './context/PracticeContext';

const TAB_PATHS: Record<MainNavTab, string> = {
  bank: '/',
  practice_tests: '/practice-tests',
  smart_drills: '/smart-drills',
  mistakes: '/mistakes',
  cheats: '/cheat-sheets',
  analytics: '/analytics',
  rank: '/ranking',
  drill: '/drill',
  admin: '/admin',
  feedback: '/feedback'
};

const PATH_TO_TAB: Record<string, MainNavTab> = {
  '/': 'bank',
  '/questions': 'bank',
  '/practice-tests': 'practice_tests',
  '/tests': 'practice_tests',
  '/practice': 'practice_tests',
  '/smart-drills': 'smart_drills',
  '/mistakes': 'mistakes',
  '/cheat-sheets': 'cheats',
  '/analytics': 'analytics',
  '/ranking': 'rank',
  '/rank': 'rank',
  '/leaderboard': 'rank',
  '/drill': 'drill',
  '/admin': 'admin',
  '/feedback': 'feedback'
};

function getTabFromPath(pathname: string): MainNavTab {
  return PATH_TO_TAB[pathname] ?? 'bank';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
});

function PSATAppContent() {
  const [activeTab, setActiveTab] = useState<MainNavTab>(() => {
    if (typeof window === 'undefined') {
      return 'bank';
    }

    return getTabFromPath(window.location.pathname);
  });
  const [feedbackSubTab, setFeedbackSubTab] = useState<SupportSubTab>('contact');
  const [feedbackQuestionId, setFeedbackQuestionId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isPrepCardExpanded, setIsPrepCardExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('psat_prep_card_expanded') === 'true';
  });

  const togglePrepCard = () => {
    const nextState = !isPrepCardExpanded;
    setIsPrepCardExpanded(nextState);
    localStorage.setItem('psat_prep_card_expanded', String(nextState));
  };

  const {
    currentUser,
    isAdmin,
    isSyncing,
    isCloudQuotaExceeded,
    syncStatus,
    forceCloudSync,
    attempts,
    bookmarks,
    streak,
    analytics,
    activeMistakesCount,
    allQuestions,
    handleQuestionAttempt,
    handleToggleBookmark,
    handleLogout,
    handleAdminAddQuestion,
    handleAdminUpdateQuestion,
    handleAdminDeleteQuestion,
    handleAdminImportQuestions,
    setIsAuthModalOpen,
    setIsCalculatorOpen,
    setIsFormulaSheetOpen,
    setScratchpadData,
    setIsPdfExportOpen,
    setIsUploadOpen,
    setIsShortcutsOpen,
    setIsScoreSimulatorOpen,
    activeDrill,
    setActiveDrill,
    launchDailyDrill,
    launchReadingWritingDrill,
    launchWeaknessDrill,
    launchMissedDrill,
    launchTimedDrill,
    launchHardDrill,
    launchSkillDrill
  } = usePractice();

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToTab = (tab: MainNavTab) => {
    const nextPath = TAB_PATHS[tab] ?? '/';
    const currentPath = window.location.pathname;

    setActiveTab(tab);
    if (currentPath !== nextPath) {
      window.history.pushState({ tab }, '', nextPath);
    }
  };

  const handleOpenDrillTab = () => {
    navigateToTab('drill');
  };

  // Automatically switch to active drill view whenever an active drill session is initiated
  useEffect(() => {
    if (activeDrill && activeTab !== 'drill') {
      navigateToTab('drill');
    }
  }, [activeDrill]);

  const handleOpenFeedback = (tab: SupportSubTab = 'contact', questionId?: string) => {
    setFeedbackSubTab(tab);
    if (questionId) {
      setFeedbackQuestionId(questionId);
      setFeedbackSubTab('report');
    } else {
      setFeedbackQuestionId(null);
    }
    navigateToTab('feedback');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canonicalPath = TAB_PATHS[activeTab] ?? '/';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead activeTab={activeTab} canonicalPath={canonicalPath} />
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        streak={streak}
        bookmarkedCount={bookmarks.length}
        activeMistakesCount={activeMistakesCount}
        user={currentUser}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        onForceSync={forceCloudSync}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenQuickDrill={() => {
          launchDailyDrill();
          handleOpenDrillTab();
        }}
        onOpenPdfExport={() => setIsPdfExportOpen(true)}
        onOpenUpload={() => {
          if (isAdmin) {
            navigateToTab('admin');
          } else {
            setIsUploadOpen(true);
          }
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
        onOpenScratchpad={() => setScratchpadData({ isOpen: true })}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenScoreSimulator={() => setIsScoreSimulatorOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'bank' && (
          isPrepCardExpanded ? (
            <section className="mb-6 overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-6 text-white shadow-2xl shadow-blue-950/20 sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-end">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200/80">Digital PSAT/NMSQT and SAT prep</p>
                    <button
                      onClick={togglePrepCard}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition-all text-white cursor-pointer select-none border border-white/5 shadow-2xs"
                    >
                      <span>Hide Guide</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                    PSAT Master makes every question, skill, and missed item instantly searchable.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                    Study with a 2,900-question bank, adaptive smart drills, mistake review, analytics, calculator tools, formula sheets, and local-first persistence that keeps work available even when cloud quota is tight.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <a href={TAB_PATHS.smart_drills} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur transition hover:bg-white/12">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Adaptive</div>
                    <div className="mt-1 text-sm font-semibold text-white">Smart drills and weak-skill targeting</div>
                  </a>
                  <a href={TAB_PATHS.mistakes} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur transition hover:bg-white/12">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Review</div>
                    <div className="mt-1 text-sm font-semibold text-white">Mistake notebook and error analysis</div>
                  </a>
                  <a href={TAB_PATHS.analytics} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur transition hover:bg-white/12">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Progress</div>
                    <div className="mt-1 text-sm font-semibold text-white">Analytics, streaks, and mastery trends</div>
                  </a>
                </div>
              </div>
            </section>
          ) : (
            <section className="mb-6 overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-3 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 text-blue-300">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                    <span className="text-blue-300 font-extrabold uppercase tracking-wider text-[10px] mr-2 bg-blue-500/15 px-2 py-0.5 rounded-md">Digital PSAT &amp; SAT Prep</span>
                    Study with a 2,900-question practice bank, adaptive smart drills, mistakes notebook, and interactive tools.
                  </p>
                </div>
              </div>
              <button
                onClick={togglePrepCard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 text-xs font-bold transition-all text-white cursor-pointer select-none shadow-2xs shrink-0"
              >
                <span>Explore Prep Guide</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </section>
          )
        )}

        {/* Dynamic Cloud Offline / Quota Fallback Warning */}
        {isCloudQuotaExceeded && !isBannerDismissed && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between text-amber-900 shadow-sm animate-fade-in">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm">
                <span className="font-semibold">Local-First Storage Active</span> — The cloud database has reached its free-tier daily write limit. All your work (attempts, bookmarks, and custom questions) is safely saved locally on this device and will run with 100% functionality!
              </div>
            </div>
            <button 
              onClick={() => setIsBannerDismissed(true)}
              className="ml-4 text-amber-600 hover:text-amber-800 font-medium text-sm shrink-0 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Gamification Level & XP Progress Banner (Shown only when user is logged in to save real estate) */}
        {currentUser && !currentUser.isAnonymous && activeTab !== 'drill' && activeTab !== 'admin' && activeTab !== 'rank' && (
          <GamificationBanner
            analytics={analytics}
            attempts={attempts}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onNavigateToRank={() => navigateToTab('rank')}
          />
        )}

        {/* VIEW: ADMIN COMMAND CENTER */}
        {activeTab === 'admin' && (
          <AdminPortal
            user={currentUser}
            allQuestions={allQuestions}
            onAddQuestion={handleAdminAddQuestion}
            onUpdateQuestion={handleAdminUpdateQuestion}
            onDeleteQuestion={handleAdminDeleteQuestion}
            onImportQuestions={handleAdminImportQuestions}
            onOpenPdfUpload={() => setIsUploadOpen(true)}
            onClose={() => navigateToTab('bank')}
          />
        )}

        {/* VIEW 1: ACTIVE DRILL RUNNER */}
        {activeTab === 'drill' && (
          activeDrill ? (
            <DrillRunner
              questions={activeDrill.questions}
              title={activeDrill.title}
              mode={activeDrill.mode}
              onClose={() => {
                setActiveDrill(null);
                navigateToTab('bank');
              }}
              onQuestionAttempt={handleQuestionAttempt}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              onOpenScratchpad={(prompt) => setScratchpadData({ isOpen: true, prompt })}
              onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onLaunchSkillDrill={(skill, category) => {
                launchSkillDrill(skill, category);
              }}
            />
          ) : (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200/60 shadow-xs">
                <Zap className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Select a Practice Drill</h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Launch a targeted adaptive drill from the Smart Drills Hub or start today's 5-question sprint.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    launchDailyDrill();
                    handleOpenDrillTab();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Start Daily Sprint (5 Qs)
                </button>
                <button
                  onClick={() => navigateToTab('smart_drills')}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Open Smart Drills Hub
                </button>
              </div>
            </div>
          )
        )}

        {/* VIEW 1.5: OFFICIAL PRACTICE TESTS & BLUEBOOK SIMULATOR */}
        {activeTab === 'practice_tests' && (
          <PracticeTestsHub
            allQuestions={allQuestions}
            onLaunchMissedDrill={(ids) => {
              launchMissedDrill(ids);
              handleOpenDrillTab();
            }}
          />
        )}

        {/* VIEW 2: SMART ADAPTIVE DRILLS HUB */}
        {activeTab === 'smart_drills' && (
          <SmartDrillsHub
            analytics={analytics}
            allQuestions={allQuestions}
            attempts={attempts}
            onLaunchDailyDrill={() => {
              launchDailyDrill();
              handleOpenDrillTab();
            }}
            onLaunchReadingWritingDrill={() => {
              launchReadingWritingDrill();
              handleOpenDrillTab();
            }}
            onLaunchWeaknessDrill={() => {
              launchWeaknessDrill();
              handleOpenDrillTab();
            }}
            onLaunchMissedDrill={(ids) => {
              const validIds = Array.isArray(ids) ? ids : undefined;
              launchMissedDrill(validIds);
              handleOpenDrillTab();
            }}
            onLaunchTimedDrill={(test) => {
              const validTest = test === 'Reading and Writing' ? 'Reading and Writing' : 'Math';
              launchTimedDrill(validTest);
              handleOpenDrillTab();
            }}
            onLaunchHardDrill={(test) => {
              const validTest = test === 'Reading and Writing' ? 'Reading and Writing' : 'Math';
              launchHardDrill(validTest);
              handleOpenDrillTab();
            }}
            onLaunchSkillDrill={(skill, category) => {
              const validSkill = typeof skill === 'string' ? skill : 'Linear equations in two variables';
              launchSkillDrill(validSkill, category);
              handleOpenDrillTab();
            }}
          />
        )}

        {/* VIEW 3: MISTAKE DIAGNOSTIC NOTEBOOK */}
        {activeTab === 'mistakes' && (
          <MistakeNotebook
            attempts={attempts}
            allQuestions={allQuestions}
            bookmarks={bookmarks}
            currentUser={currentUser}
            onToggleBookmark={handleToggleBookmark}
            onQuestionAttempt={handleQuestionAttempt}
            onLaunchRedoMarathon={(ids) => {
              launchMissedDrill(ids);
              handleOpenDrillTab();
            }}
            onReportQuestionIssue={(qId) => handleOpenFeedback('report', qId)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 4: CONCEPT MASTERY CHEAT SHEETS */}
        {activeTab === 'cheats' && (
          <ConceptCheatSheets
            onLaunchSkillDrill={(skill, category) => {
              launchSkillDrill(skill, category);
              handleOpenDrillTab();
            }}
          />
        )}

        {/* VIEW 5: PERFORMANCE ANALYTICS & MASTERY */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
            allQuestions={allQuestions}
            currentUser={currentUser}
            onLaunchSkillDrill={(skill, category) => {
              launchSkillDrill(skill, category);
              handleOpenDrillTab();
            }}
            onLaunchWeaknessDrill={() => {
              launchWeaknessDrill();
              handleOpenDrillTab();
            }}
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 6: QUESTION BANK & EXPLORER */}
        {activeTab === 'bank' && (
          <QuestionBankView
            onReportQuestionIssue={(qId) => handleOpenFeedback('report', qId)}
          />
        )}

        {/* VIEW 7: PROTECTED STUDENT RANK & LEADERBOARD */}
        {activeTab === 'rank' && (
          <StudentRankingView
            currentUser={currentUser}
            analytics={analytics}
            attempts={attempts}
            streak={streak}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onNavigateToBank={() => navigateToTab('bank')}
            onLaunchDrill={() => {
              launchDailyDrill();
              handleOpenDrillTab();
            }}
          />
        )}

        {/* VIEW 8: FEEDBACK, BUG/ISSUE REPORTING & FEATURE REQUEST ROADMAP */}
        {activeTab === 'feedback' && (
          <SupportFeedbackHub
            currentUser={currentUser}
            allQuestions={allQuestions}
            initialTab={feedbackSubTab}
            initialQuestionId={feedbackQuestionId}
            onClose={() => navigateToTab('bank')}
            onClearInitialQuestion={() => setFeedbackQuestionId(null)}
          />
        )}
      </main>

      {/* Subtle Author & Attribution Footer with direct support triggers */}
      <Footer onOpenFeedback={handleOpenFeedback} />

      {/* Global Student Tools & Modals */}
      <AppModals />
      <OfflineIndicator />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PracticeProvider>
        <PSATAppContent />
      </PracticeProvider>
    </QueryClientProvider>
  );
}

export default App;
