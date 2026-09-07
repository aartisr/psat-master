import React, { useState, useEffect, useRef } from 'react';
import { 
  PracticeTestDefinition, 
  PracticeTestResult, 
  Question, 
  PracticeTestAnswerRecord 
} from '../../types';
import { 
  InstantiatedPracticeTest, 
  instantiatePracticeTest 
} from '../../data/practiceTestsCatalog';
import { 
  RW_MODULE_TIME_LIMIT_MINUTES, 
  MATH_MODULE_TIME_LIMIT_MINUTES, 
  RW_ROUTING_THRESHOLD_CORRECT, 
  MATH_ROUTING_THRESHOLD_CORRECT, 
  compileTestResult 
} from '../../utils/practiceTestEngine';
import { evaluateAnswer } from '../../utils/answerEvaluator';
import { BluebookHeader } from './BluebookHeader';
import { BluebookQuestionPane } from './BluebookQuestionPane';
import { BluebookFooter } from './BluebookFooter';
import { BluebookModuleReview } from './BluebookModuleReview';
import { BluebookBreakScreen } from './BluebookBreakScreen';
import { BluebookScoreReportView } from './BluebookScoreReportView';
import { MathFormulaSheet } from '../MathFormulaSheet';
import { ScientificCalculator } from '../ScientificCalculator';
import { HelpCircle, X } from 'lucide-react';

export type ExamStep = 
  | 'rw_m1'
  | 'rw_m1_review'
  | 'rw_m2'
  | 'rw_m2_review'
  | 'break'
  | 'math_m1'
  | 'math_m1_review'
  | 'math_m2'
  | 'math_m2_review'
  | 'completed';

interface PracticeTestRunnerProps {
  testDefinition: PracticeTestDefinition;
  allQuestions: Question[];
  onExitTest: () => void;
  onSaveResult: (result: PracticeTestResult) => void;
  onLaunchMissedDrill: (missedQuestionIds: string[]) => void;
}

export const PracticeTestRunner: React.FC<PracticeTestRunnerProps> = ({
  testDefinition,
  allQuestions,
  onExitTest,
  onSaveResult,
  onLaunchMissedDrill
}) => {
  // 1. Initialize question pools
  const [instantiatedTest] = useState<InstantiatedPracticeTest>(() => 
    instantiatePracticeTest(testDefinition, allQuestions)
  );

  // 2. Active Test State Machine
  const [examStep, setExamStep] = useState<ExamStep>('rw_m1');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [rwStage, setRwStage] = useState<'easy' | 'hard'>('hard');
  const [mathStage, setMathStage] = useState<'easy' | 'hard'>('hard');

  // Answers & UI state
  const [answers, setAnswers] = useState<Record<string, PracticeTestAnswerRecord>>({});
  const [eliminatedOptionsMap, setEliminatedOptionsMap] = useState<Record<string, string[]>>({});
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, string>>({});
  
  // Timing & In-App Modals
  const [secondsRemaining, setSecondsRemaining] = useState<number>(RW_MODULE_TIME_LIMIT_MINUTES * 60);
  const [totalElapsedTimeSeconds, setTotalElapsedTimeSeconds] = useState<number>(0);
  const [isEliminatorActive, setIsEliminatorActive] = useState<boolean>(false);
  const [isHighlighterActive, setIsHighlighterActive] = useState<boolean>(false);
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState<boolean>(false);

  // Final compiled result
  const [completedResult, setCompletedResult] = useState<PracticeTestResult | null>(null);

  // 3. Resolve active module question array based on current step
  let currentQuestions: Question[] = [];
  let sectionTitle = 'Section 1: Reading & Writing';
  let moduleNumber = 1;
  let isReviewStep = false;
  let isFinalModule = false;

  if (examStep === 'rw_m1' || examStep === 'rw_m1_review') {
    currentQuestions = instantiatedTest.rwModule1Questions;
    sectionTitle = 'Reading and Writing';
    moduleNumber = 1;
    isReviewStep = examStep === 'rw_m1_review';
  } else if (examStep === 'rw_m2' || examStep === 'rw_m2_review') {
    currentQuestions = rwStage === 'hard' 
      ? instantiatedTest.rwModule2HardQuestions 
      : instantiatedTest.rwModule2EasyQuestions;
    sectionTitle = 'Reading and Writing';
    moduleNumber = 2;
    isReviewStep = examStep === 'rw_m2_review';
  } else if (examStep === 'math_m1' || examStep === 'math_m1_review') {
    currentQuestions = instantiatedTest.mathModule1Questions;
    sectionTitle = 'Math';
    moduleNumber = 1;
    isReviewStep = examStep === 'math_m1_review';
  } else if (examStep === 'math_m2' || examStep === 'math_m2_review') {
    currentQuestions = mathStage === 'hard'
      ? instantiatedTest.mathModule2HardQuestions
      : instantiatedTest.mathModule2EasyQuestions;
    sectionTitle = 'Math';
    moduleNumber = 2;
    isReviewStep = examStep === 'math_m2_review';
    isFinalModule = true;
  }

  const currentQuestion = currentQuestions[currentQuestionIndex] || currentQuestions[0];
  const currentQuestionIds = currentQuestions.map((q) => q.id);

  // 4. Timer Countdown Effect
  useEffect(() => {
    if (examStep === 'break' || examStep === 'completed' || isReviewStep) return;

    const timer = setInterval(() => {
      setTotalElapsedTimeSeconds((prev) => prev + 1);
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-transition to module review when time expires
          if (examStep === 'rw_m1') setExamStep('rw_m1_review');
          else if (examStep === 'rw_m2') setExamStep('rw_m2_review');
          else if (examStep === 'math_m1') setExamStep('math_m1_review');
          else if (examStep === 'math_m2') setExamStep('math_m2_review');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStep, isReviewStep]);

  // Answer selection handler
  const handleSelectAnswer = (ans: string) => {
    if (!currentQuestion) return;
    const isCorrect = evaluateAnswer(currentQuestion, ans);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        userAnswer: ans,
        isCorrect,
        timeSpentSeconds: (prev[currentQuestion.id]?.timeSpentSeconds || 0) + 1,
        markedForReview: prev[currentQuestion.id]?.markedForReview || false,
        eliminatedOptions: eliminatedOptionsMap[currentQuestion.id] || []
      }
    }));
  };

  // Toggle Bookmark / Mark for review
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id] || {
        questionId: currentQuestion.id,
        userAnswer: '',
        isCorrect: false,
        timeSpentSeconds: 0,
        markedForReview: false
      };
      return {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          markedForReview: !existing.markedForReview
        }
      };
    });
  };

  // Toggle option elimination
  const handleToggleEliminatedOption = (optionKey: string) => {
    if (!currentQuestion) return;
    setEliminatedOptionsMap((prev) => {
      const currentList = prev[currentQuestion.id] || [];
      const updated = currentList.includes(optionKey)
        ? currentList.filter((k) => k !== optionKey)
        : [...currentList, optionKey];
      return { ...prev, [currentQuestion.id]: updated };
    });
  };

  // 5. Module Transition & Adaptive Routing
  const handleSubmitActiveModule = () => {
    if (examStep === 'rw_m1' || examStep === 'rw_m1_review') {
      // Evaluate RW Module 1 score to determine Module 2 branch
      let m1Correct = 0;
      instantiatedTest.rwModule1Questions.forEach((q) => {
        if (answers[q.id]?.isCorrect) m1Correct++;
      });
      const determinedRwStage = m1Correct >= RW_ROUTING_THRESHOLD_CORRECT ? 'hard' : 'easy';
      setRwStage(determinedRwStage);
      setSecondsRemaining(RW_MODULE_TIME_LIMIT_MINUTES * 60);
      setCurrentQuestionIndex(0);
      setExamStep('rw_m2');
    } else if (examStep === 'rw_m2' || examStep === 'rw_m2_review') {
      // Transition to 10-minute scheduled break
      setCurrentQuestionIndex(0);
      setExamStep('break');
    } else if (examStep === 'math_m1' || examStep === 'math_m1_review') {
      // Evaluate Math Module 1 score to determine Module 2 branch
      let m1Correct = 0;
      instantiatedTest.mathModule1Questions.forEach((q) => {
        if (answers[q.id]?.isCorrect) m1Correct++;
      });
      const determinedMathStage = m1Correct >= MATH_ROUTING_THRESHOLD_CORRECT ? 'hard' : 'easy';
      setMathStage(determinedMathStage);
      setSecondsRemaining(MATH_MODULE_TIME_LIMIT_MINUTES * 60);
      setCurrentQuestionIndex(0);
      setExamStep('math_m2');
    } else if (examStep === 'math_m2' || examStep === 'math_m2_review') {
      // Final exam completion -> compile score
      const rwM2Ids = (rwStage === 'hard'
        ? instantiatedTest.rwModule2HardQuestions
        : instantiatedTest.rwModule2EasyQuestions
      ).map((q) => q.id);

      const mathM2Ids = (mathStage === 'hard'
        ? instantiatedTest.mathModule2HardQuestions
        : instantiatedTest.mathModule2EasyQuestions
      ).map((q) => q.id);

      const result = compileTestResult(
        testDefinition,
        answers,
        instantiatedTest.allQuestionsMap,
        totalElapsedTimeSeconds,
        rwStage,
        mathStage,
        instantiatedTest.rwModule1Questions.map((q) => q.id),
        rwM2Ids,
        instantiatedTest.mathModule1Questions.map((q) => q.id),
        mathM2Ids
      );

      setCompletedResult(result);
      onSaveResult(result);
      setExamStep('completed');
    }
  };

  // Start Section 2 (Math) after break
  const handleResumeSection2Math = () => {
    setSecondsRemaining(MATH_MODULE_TIME_LIMIT_MINUTES * 60);
    setCurrentQuestionIndex(0);
    setExamStep('math_m1');
  };

  // Render Completed Score Report
  if (examStep === 'completed' && completedResult) {
    return (
      <BluebookScoreReportView
        result={completedResult}
        onLaunchMissedDrill={onLaunchMissedDrill}
        onReturnToCatalog={onExitTest}
      />
    );
  }

  // Render Break Screen
  if (examStep === 'break') {
    return <BluebookBreakScreen onResumeNextSection={handleResumeSection2Math} />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-100 select-none">
      {/* Bluebook Header */}
      <BluebookHeader
        sectionTitle={sectionTitle}
        moduleIndex={moduleNumber}
        totalModulesInSection={2}
        secondsRemaining={secondsRemaining}
        isMarkedForReview={!!answers[currentQuestion?.id]?.markedForReview}
        onToggleMarkForReview={handleToggleMarkForReview}
        isEliminatorActive={isEliminatorActive}
        onToggleEliminator={() => setIsEliminatorActive(!isEliminatorActive)}
        isHighlighterActive={isHighlighterActive}
        onToggleHighlighter={() => setIsHighlighterActive(!isHighlighterActive)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
        onOpenDirections={() => setIsDirectionsOpen(true)}
        onExitTest={onExitTest}
      />

      {/* Main Content Area: Question Pane OR Module Review Screen */}
      <main className="flex-1 flex flex-col">
        {isReviewStep ? (
          <BluebookModuleReview
            moduleTitle={`${sectionTitle} - Module ${moduleNumber}`}
            moduleIndex={moduleNumber}
            totalModules={2}
            questionIds={currentQuestionIds}
            questionLookup={instantiatedTest.allQuestionsMap}
            answers={answers}
            onSelectQuestion={(idx) => {
              setCurrentQuestionIndex(idx);
              if (examStep === 'rw_m1_review') setExamStep('rw_m1');
              else if (examStep === 'rw_m2_review') setExamStep('rw_m2');
              else if (examStep === 'math_m1_review') setExamStep('math_m1');
              else if (examStep === 'math_m2_review') setExamStep('math_m2');
            }}
            onReturnToCurrentQuestion={() => {
              if (examStep === 'rw_m1_review') setExamStep('rw_m1');
              else if (examStep === 'rw_m2_review') setExamStep('rw_m2');
              else if (examStep === 'math_m1_review') setExamStep('math_m1');
              else if (examStep === 'math_m2_review') setExamStep('math_m2');
            }}
            onSubmitModule={handleSubmitActiveModule}
            isFinalModule={isFinalModule}
          />
        ) : (
          currentQuestion && (
            <BluebookQuestionPane
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestionsInModule={currentQuestions.length}
              userAnswer={answers[currentQuestion.id]?.userAnswer || ''}
              onSelectAnswer={handleSelectAnswer}
              eliminatedOptions={eliminatedOptionsMap[currentQuestion.id] || []}
              onToggleEliminatedOption={handleToggleEliminatedOption}
              isEliminatorActive={isEliminatorActive}
              isHighlighterActive={isHighlighterActive}
              annotationNote={annotationsMap[currentQuestion.id]}
              onSaveAnnotation={(note) =>
                setAnnotationsMap((prev) => ({ ...prev, [currentQuestion.id]: note }))
              }
            />
          )
        )}
      </main>

      {/* Bluebook Footer Navigation (Hidden in Review Mode) */}
      {!isReviewStep && (
        <BluebookFooter
          currentIndex={currentQuestionIndex}
          totalQuestions={currentQuestions.length}
          questionIds={currentQuestionIds}
          answers={answers}
          onSelectIndex={(idx) => setCurrentQuestionIndex(idx)}
          onPrev={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentQuestionIndex((prev) => Math.min(currentQuestions.length - 1, prev + 1))}
          onGoToReviewPage={() => {
            if (examStep === 'rw_m1') setExamStep('rw_m1_review');
            else if (examStep === 'rw_m2') setExamStep('rw_m2_review');
            else if (examStep === 'math_m1') setExamStep('math_m1_review');
            else if (examStep === 'math_m2') setExamStep('math_m2_review');
          }}
        />
      )}

      {/* In-App Modals: Math Formula Reference Sheet */}
      <MathFormulaSheet
        isOpen={isFormulaSheetOpen}
        onClose={() => setIsFormulaSheetOpen(false)}
      />

      {/* In-App Modals: Graphing & Scientific Calculator */}
      <ScientificCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* In-App Modals: Official Directions Modal */}
      {isDirectionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">General Testing Directions</h3>
              </div>
              <button
                onClick={() => setIsDirectionsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <p>
                <strong>Timing:</strong> Each section is divided into 2 separately timed modules. When time expires on a module, you will automatically transition to the module review screen.
              </p>
              <p>
                <strong>Adaptive Routing:</strong> Your score on Module 1 determines whether you receive the Upper Stage (Harder) or Lower Stage (Easier) version of Module 2.
              </p>
              <p>
                <strong>Scoring:</strong> You receive points for each correct answer. There is no guessing penalty for wrong answers, so make sure to answer every question before completing a module.
              </p>
              <p>
                <strong>Tools:</strong> You may use the built-in Desmos Graphing Calculator, Math Reference sheet, and Option Eliminator at any time during testing.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDirectionsOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Close Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
