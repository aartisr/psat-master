import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Question, DrillSession } from '../types';
import { QuestionCard } from './QuestionCard';
import { DrillHeader } from './drill/DrillHeader';
import { DrillSummary } from './drill/DrillSummary';
import { saveDrillSession } from '../utils/storage';

interface DrillRunnerProps {
  questions: Question[];
  title: string;
  mode: DrillSession['mode'];
  onClose: () => void;
  onQuestionAttempt: (questionId: string, isCorrect: boolean, timeSpent: number, hintsUsed: number) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onOpenScratchpad?: (prompt: string) => void;
  onOpenFormulaSheet?: () => void;
  onOpenCalculator?: () => void;
}

export const DrillRunner: React.FC<DrillRunnerProps> = React.memo(({
  questions,
  title,
  mode,
  onClose,
  onQuestionAttempt,
  bookmarks,
  onToggleBookmark,
  onOpenScratchpad,
  onOpenFormulaSheet,
  onOpenCalculator
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  type AnswerEntry = { isCorrect: boolean; timeSpent: number; hintsUsed: number };
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [comboStreak, setComboStreak] = useState<number>(0);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const correctCount = (Object.values(answers) as AnswerEntry[]).filter((a) => a.isCorrect).length;
  const totalTimeSeconds = Math.round((Date.now() - startTime) / 1000);

  const handleAttempt = useCallback((isCorrect: boolean, timeSpent: number, hintsUsed: number) => {
    if (!currentQuestion) return;

    if (isCorrect) {
      setComboStreak((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          confetti({
            particleCount: 25 * next,
            spread: 45,
            origin: { y: 0.8 }
          });
        }
        return next;
      });
    } else {
      setComboStreak(0);
    }

    const newAnswers: Record<string, AnswerEntry> = {
      ...answers,
      [currentQuestion.id]: { isCorrect, timeSpent, hintsUsed }
    };
    setAnswers(newAnswers);
    onQuestionAttempt(currentQuestion.id, isCorrect, timeSpent, hintsUsed);

    // If this was the last question, complete drill
    if (Object.keys(newAnswers).length === total) {
      setTimeout(() => {
        setIsCompleted(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Save session
        const session: DrillSession = {
          id: `drill_${Date.now()}`,
          title,
          mode,
          questionIds: questions.map((q) => q.id),
          currentIndex: total - 1,
          answers: newAnswers as any,
          completed: true,
          score: Object.values(newAnswers).filter((a) => a.isCorrect).length,
          total,
          startTime,
          endTime: Date.now()
        };
        saveDrillSession(session);
      }, 700);
    } else {
      // Advance to next question after a brief delay
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
      }, 900);
    }
  }, [currentQuestion, answers, onQuestionAttempt, total, title, mode, questions, startTime]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setComboStreak(0);
  }, []);

  if (isCompleted) {
    return (
      <DrillSummary
        title={title}
        total={total}
        correctCount={correctCount}
        totalTimeSeconds={totalTimeSeconds}
        questions={questions}
        answers={answers}
        onRestart={handleRestart}
        onReturnToBank={onClose}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <DrillHeader
        title={title}
        currentIndex={currentIndex}
        total={total}
        comboStreak={comboStreak}
        onClose={onClose}
      />

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        isBookmarked={bookmarks.includes(currentQuestion.id)}
        onToggleBookmark={onToggleBookmark}
        onAttemptSubmitted={handleAttempt}
        showRelated={false}
        onOpenScratchpad={onOpenScratchpad}
        onOpenFormulaSheet={onOpenFormulaSheet}
        onOpenCalculator={onOpenCalculator}
      />
    </div>
  );
});

DrillRunner.displayName = 'DrillRunner';
