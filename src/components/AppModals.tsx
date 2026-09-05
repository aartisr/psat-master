import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { AuthModal } from './AuthModal';
import { ScientificCalculator } from './ScientificCalculator';
import { MathFormulaSheet } from './MathFormulaSheet';
import { ScratchpadModal } from './ScratchpadModal';
import { PdfExportModal } from './PdfExportModal';
import { PdfUploadModal } from './PdfUploadModal';
import { KeyboardShortcutsModal } from './common/KeyboardShortcutsModal';
import { ScoreSimulatorModal } from './common/ScoreSimulatorModal';

export const AppModals: React.FC = React.memo(() => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    isCalculatorOpen,
    setIsCalculatorOpen,
    isFormulaSheetOpen,
    setIsFormulaSheetOpen,
    scratchpadData,
    setScratchpadData,
    isPdfExportOpen,
    setIsPdfExportOpen,
    isUploadOpen,
    setIsUploadOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isScoreSimulatorOpen,
    setIsScoreSimulatorOpen,
    currentUser,
    analytics,
    allQuestions,
    launchSkillDrill,
    handleAdminImportQuestions
  } = usePractice();

  return (
    <>
      {/* Authentication Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {}}
      />

      {/* Floating Scientific Calculator */}
      <ScientificCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* PSAT / SAT Math Formula Reference Sheet */}
      <MathFormulaSheet
        isOpen={isFormulaSheetOpen}
        onClose={() => setIsFormulaSheetOpen(false)}
      />

      {/* Digital Scratchpad / Canvas */}
      <ScratchpadModal
        isOpen={scratchpadData.isOpen}
        questionPrompt={scratchpadData.prompt}
        onClose={() => setScratchpadData({ isOpen: false })}
      />

      {/* PDF Student Report & Question Set Exporter */}
      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        analytics={analytics}
        allQuestions={allQuestions}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* PDF / OCR Upload Dialog */}
      <PdfUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUser={currentUser}
        onQuestionsImported={(qs) => handleAdminImportQuestions(qs, 'PDF / Text Importer')}
      />

      {/* Keyboard Shortcuts Guide */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Target Score & National Merit Simulator */}
      <ScoreSimulatorModal
        isOpen={isScoreSimulatorOpen}
        onClose={() => setIsScoreSimulatorOpen(false)}
        analytics={analytics}
        allQuestions={allQuestions}
        onLaunchSkillDrill={launchSkillDrill}
      />
    </>
  );
});

AppModals.displayName = 'AppModals';
