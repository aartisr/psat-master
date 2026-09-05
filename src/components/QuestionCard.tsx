import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Question } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { QuestionHeader } from './question/QuestionHeader';
import { QuestionPrompt } from './question/QuestionPrompt';
import { QuestionOptions } from './question/QuestionOptions';
import { QuestionGridIn } from './question/QuestionGridIn';
import { QuestionHints } from './question/QuestionHints';
import { QuestionRationale } from './question/QuestionRationale';
import { QuestionRelatedList } from './question/QuestionRelatedList';
import { useTimer } from '../hooks/useTimer';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { usePracticeContext } from '../context/PracticeContext';

export interface QuestionCardProps {
  question: Question;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onAttemptSubmitted?: (isCorrect: boolean, timeSpent: number, hintsUsed: number) => void;
  relatedQuestions?: Question[];
  onSelectQuestion?: (question: Question) => void;
  showRelated?: boolean;
  onOpenScratchpad?: (prompt: string) => void;
  onOpenFormulaSheet?: () => void;
  onOpenCalculator?: () => void;
  onReportIssue?: (questionId: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
  question,
  isBookmarked,
  onToggleBookmark,
  onAttemptSubmitted,
  relatedQuestions = [],
  onSelectQuestion,
  showRelated = true,
  onOpenScratchpad,
  onOpenFormulaSheet,
  onOpenCalculator,
  onReportIssue
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, boolean>>({});
  const [sprInput, setSprInput] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(0);

  const { seconds, pause, reset, formatTime } = useTimer({ autoStart: true });
  const { isSpeaking, speak, stop } = useSpeechSynthesis();
  const { isAdmin, handleAdminUpdateQuestion } = usePracticeContext();

  const handleRemoveFigure = useCallback(async () => {
    if (window.confirm('Are you sure you want to remove the attached reference figure from this question?')) {
      const updated = { ...question };
      delete updated.imageUrl;
      await handleAdminUpdateQuestion(updated);
    }
  }, [question, handleAdminUpdateQuestion]);

  const handleRemoveGraph = useCallback(async () => {
    if (window.confirm('Are you sure you want to remove the coordinate graph from this question?')) {
      const updated = { ...question };
      delete updated.graphConfig;
      await handleAdminUpdateQuestion(updated);
    }
  }, [question, handleAdminUpdateQuestion]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption('');
    setEliminatedOptions({});
    setSprInput('');
    setIsSubmitted(false);
    setIsCorrect(null);
    setRevealedHintLevel(0);
    reset(0);
    stop();
  }, [question.id, reset, stop]);

  // Handle submit logic
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;

    let correct = false;
    const submittedAnswer = question.type === 'multiple_choice' ? selectedOption : sprInput.trim();

    if (!submittedAnswer) return;

    if (question.type === 'multiple_choice') {
      correct = selectedOption.toUpperCase() === question.correctAnswer.toUpperCase();
    } else {
      // Free Response checking with accepted variations
      const normalizedSubmitted = submittedAnswer.toLowerCase().replace(/\s+/g, '');
      const correctNorm = question.correctAnswer.toLowerCase().replace(/\s+/g, '');
      const accepted = (question.acceptedAnswers || [question.correctAnswer]).map((a) =>
        a.toLowerCase().replace(/\s+/g, '')
      );

      let numericMatch = false;
      const parsedSub = parseFloat(submittedAnswer);
      if (!isNaN(parsedSub)) {
        accepted.forEach((ans) => {
          if (ans.includes('/')) {
            const [num, den] = ans.split('/').map(Number);
            if (den && Math.abs(parsedSub - num / den) < 0.005) {
              numericMatch = true;
            }
          } else {
            const parsedAns = parseFloat(ans);
            if (!isNaN(parsedAns) && Math.abs(parsedSub - parsedAns) < 0.005) {
              numericMatch = true;
            }
          }
        });
      }

      correct = accepted.includes(normalizedSubmitted) || normalizedSubmitted === correctNorm || numericMatch;
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    pause();

    if (onAttemptSubmitted) {
      onAttemptSubmitted(correct, seconds, revealedHintLevel);
    }
  }, [
    isSubmitted,
    question.type,
    question.correctAnswer,
    question.acceptedAnswers,
    selectedOption,
    sprInput,
    pause,
    onAttemptSubmitted,
    seconds,
    revealedHintLevel
  ]);

  // Keyboard Shortcuts (A, B, C, D, 1, 2, 3, 4, Enter, H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (!isSubmitted && question.type === 'multiple_choice') {
        if (['A', 'B', 'C', 'D'].includes(key)) {
          setSelectedOption(key);
        } else if (key === '1') setSelectedOption('A');
        else if (key === '2') setSelectedOption('B');
        else if (key === '3') setSelectedOption('C');
        else if (key === '4') setSelectedOption('D');
      }

      if (e.key === 'Enter' && !isSubmitted) {
        if (
          (question.type === 'multiple_choice' && selectedOption) ||
          (question.type === 'free_response' && sprInput.trim())
        ) {
          handleSubmit();
        }
      }

      if (key === 'H' && !isSubmitted) {
        setRevealedHintLevel((prev) => Math.min(prev + 1, question.hints?.length || 3));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, sprInput, isSubmitted, question.type, question.hints?.length, handleSubmit]);

  const toggleElimination = useCallback((label: string) => {
    setEliminatedOptions((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
    if (selectedOption === label) {
      setSelectedOption('');
    }
  }, [selectedOption]);

  const handleToggleSpeech = useCallback(() => {
    const textToRead = `${question.stimulus ? question.stimulus + '. ' : ''}${question.prompt}`;
    speak(textToRead);
  }, [question.stimulus, question.prompt, speak]);

  const hasAnswerSelected = question.type === 'multiple_choice' ? !!selectedOption : !!sprInput.trim();

  return (
    <Card variant="default" padding="lg" className="space-y-5">
      {/* 1. Header (Badges, Controls, TTS, Scratchpad, Calculator, Bookmarks) */}
      <QuestionHeader
        question={question}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        formattedTime={formatTime(seconds)}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        onOpenScratchpad={onOpenScratchpad ? () => onOpenScratchpad(question.prompt) : undefined}
        onOpenFormulaSheet={onOpenFormulaSheet}
        onOpenCalculator={onOpenCalculator}
        onReportIssue={onReportIssue}
      />

      {/* 2. Stimulus, Prompt, Table, Coordinate Graph */}
      <QuestionPrompt
        question={question}
        onRemoveImage={isAdmin && question.imageUrl ? handleRemoveFigure : undefined}
        onRemoveGraph={isAdmin && question.graphConfig ? handleRemoveGraph : undefined}
      />

      {/* 3. Interactive Answer Interface */}
      {question.type === 'multiple_choice' && question.options ? (
        <QuestionOptions
          options={question.options}
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
          eliminatedOptions={eliminatedOptions}
          onToggleEliminate={toggleElimination}
          isSubmitted={isSubmitted}
          correctAnswer={question.correctAnswer}
        />
      ) : (
        <QuestionGridIn
          value={sprInput}
          onChange={setSprInput}
          isSubmitted={isSubmitted}
          isCorrect={isCorrect}
          correctAnswer={question.correctAnswer}
          acceptedAnswers={question.acceptedAnswers}
        />
      )}

      {/* 4. Action Bar (Submit / Feedback Banner / Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {isSubmitted && (
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct! Great mastery of {question.skill}.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs sm:text-sm bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Incorrect. Review the detailed rationale below.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSubmitted ? (
            <Button
              variant="primary"
              size="sm"
              disabled={!hasAnswerSelected}
              onClick={handleSubmit}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsSubmitted(false);
                setIsCorrect(null);
                setSelectedOption('');
                setSprInput('');
                reset(0);
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
          )}
        </div>
      </div>

      {/* 5. Progressive Socratic Hints */}
      <QuestionHints
        question={question}
        revealedHintLevel={revealedHintLevel}
        onRevealNextHint={() =>
          setRevealedHintLevel((prev) => Math.min(prev + 1, question.hints?.length || 3))
        }
      />

      {/* 6. Step-by-Step Rationale & AI Deep Breakdown (Shown when submitted or requested) */}
      <QuestionRationale
        question={question}
        isSubmitted={isSubmitted}
      />

      {/* 7. Recommended Next Questions Carousel / Grid */}
      {showRelated && relatedQuestions.length > 0 && onSelectQuestion && (
        <QuestionRelatedList
          relatedQuestions={relatedQuestions}
          onSelectQuestion={onSelectQuestion}
        />
      )}
    </Card>
  );
});

QuestionCard.displayName = 'QuestionCard';
