import React, { useState, useEffect } from 'react';
import { PracticeTestDefinition, PracticeTestResult, Question } from '../types';
import { PracticeTestsCatalogView } from './practice-tests/PracticeTestsCatalogView';
import { PracticeTestRunner } from './practice-tests/PracticeTestRunner';
import { BluebookScoreReportView } from './practice-tests/BluebookScoreReportView';

const STORAGE_KEY = 'psat_practice_test_results_v1';

interface PracticeTestsHubProps {
  allQuestions: Question[];
  onLaunchMissedDrill: (missedQuestionIds: string[]) => void;
  activeTestToLaunch?: PracticeTestDefinition | null;
  onClearActiveLaunch?: () => void;
}

export const PracticeTestsHub: React.FC<PracticeTestsHubProps> = ({
  allQuestions,
  onLaunchMissedDrill,
  activeTestToLaunch,
  onClearActiveLaunch
}) => {
  const [activeTest, setActiveTest] = useState<PracticeTestDefinition | null>(activeTestToLaunch || null);
  const [viewingResult, setViewingResult] = useState<PracticeTestResult | null>(null);
  const [pastResults, setPastResults] = useState<PracticeTestResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Watch for external launch trigger
  useEffect(() => {
    if (activeTestToLaunch) {
      setActiveTest(activeTestToLaunch);
      setViewingResult(null);
      if (onClearActiveLaunch) onClearActiveLaunch();
    }
  }, [activeTestToLaunch, onClearActiveLaunch]);

  const handleSaveResult = (result: PracticeTestResult) => {
    setPastResults((prev) => {
      const updated = [result, ...prev.filter((r) => r.id !== result.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save practice test result locally', e);
      }
      return updated;
    });
  };

  const handleStartTest = (test: PracticeTestDefinition) => {
    setViewingResult(null);
    setActiveTest(test);
  };

  const handleExitTest = () => {
    setActiveTest(null);
    setViewingResult(null);
  };

  // 1. If currently in an active exam session
  if (activeTest) {
    return (
      <PracticeTestRunner
        testDefinition={activeTest}
        allQuestions={allQuestions}
        onExitTest={handleExitTest}
        onSaveResult={handleSaveResult}
        onLaunchMissedDrill={(missedIds) => {
          handleExitTest();
          onLaunchMissedDrill(missedIds);
        }}
      />
    );
  }

  // 2. If viewing a past score report
  if (viewingResult) {
    return (
      <BluebookScoreReportView
        result={viewingResult}
        onLaunchMissedDrill={(missedIds) => {
          setViewingResult(null);
          onLaunchMissedDrill(missedIds);
        }}
        onReturnToCatalog={() => setViewingResult(null)}
      />
    );
  }

  // 3. Default Catalog View
  return (
    <PracticeTestsCatalogView
      onStartTest={handleStartTest}
      pastResults={pastResults}
      onViewResult={(res) => setViewingResult(res)}
    />
  );
};
