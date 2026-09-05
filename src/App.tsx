import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, MainNavTab } from './components/Header';
import { GamificationBanner } from './components/GamificationBanner';
import { AdminPortal } from './components/AdminPortal';
import { DrillRunner } from './components/DrillRunner';
import { SmartDrillsHub } from './components/SmartDrillsHub';
import { MistakeNotebook } from './components/MistakeNotebook';
import { ConceptCheatSheets } from './components/ConceptCheatSheets';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QuestionBankView } from './components/QuestionBankView';
import { SupportFeedbackHub, SupportSubTab } from './components/SupportFeedbackHub';
import { Footer } from './components/Footer';
import { AppModals } from './components/AppModals';
import { PracticeProvider, usePractice } from './context/PracticeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
});

function PSATAppContent() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('bank');
  const [feedbackSubTab, setFeedbackSubTab] = useState<SupportSubTab>('contact');
  const [feedbackQuestionId, setFeedbackQuestionId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

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
    launchWeaknessDrill,
    launchMissedDrill,
    launchTimedDrill,
    launchHardDrill,
    launchSkillDrill
  } = usePractice();

  const handleOpenDrillTab = () => {
    setActiveTab('drill');
  };

  const handleOpenFeedback = (tab: SupportSubTab = 'contact', questionId?: string) => {
    setFeedbackSubTab(tab);
    if (questionId) {
      setFeedbackQuestionId(questionId);
      setFeedbackSubTab('report');
    } else {
      setFeedbackQuestionId(null);
    }
    setActiveTab('feedback');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
            setActiveTab('admin');
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

        {/* Gamification Level & XP Progress Banner (Shown on Dashboard views) */}
        {activeTab !== 'drill' && activeTab !== 'admin' && (
          <GamificationBanner
            analytics={analytics}
            attempts={attempts}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
            onClose={() => setActiveTab('bank')}
          />
        )}

        {/* VIEW 1: ACTIVE DRILL RUNNER */}
        {activeTab === 'drill' && activeDrill && (
          <DrillRunner
            questions={activeDrill.questions}
            title={activeDrill.title}
            mode={activeDrill.mode}
            onClose={() => {
              setActiveDrill(null);
              setActiveTab('bank');
            }}
            onQuestionAttempt={handleQuestionAttempt}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onOpenScratchpad={(prompt) => setScratchpadData({ isOpen: true, prompt })}
            onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
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
            onLaunchWeaknessDrill={() => {
              launchWeaknessDrill();
              handleOpenDrillTab();
            }}
            onLaunchMissedDrill={(ids) => {
              launchMissedDrill(ids);
              handleOpenDrillTab();
            }}
            onLaunchTimedDrill={(test) => {
              launchTimedDrill(test);
              handleOpenDrillTab();
            }}
            onLaunchHardDrill={() => {
              launchHardDrill();
              handleOpenDrillTab();
            }}
            onLaunchSkillDrill={(skill) => {
              launchSkillDrill(skill);
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
            onLaunchSkillDrill={(skill) => {
              launchSkillDrill(skill);
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
            onLaunchSkillDrill={(skill) => {
              launchSkillDrill(skill);
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

        {/* VIEW 7: FEEDBACK, BUG/ISSUE REPORTING & FEATURE REQUEST ROADMAP */}
        {activeTab === 'feedback' && (
          <SupportFeedbackHub
            currentUser={currentUser}
            allQuestions={allQuestions}
            initialTab={feedbackSubTab}
            initialQuestionId={feedbackQuestionId}
            onClose={() => setActiveTab('bank')}
            onClearInitialQuestion={() => setFeedbackQuestionId(null)}
          />
        )}
      </main>

      {/* Subtle Author & Attribution Footer with direct support triggers */}
      <Footer onOpenFeedback={handleOpenFeedback} />

      {/* Global Student Tools & Modals */}
      <AppModals />
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
