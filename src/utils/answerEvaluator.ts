import { Question, QuestionOption } from '../types';

/**
 * Normalizes math and text strings for robust comparison.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\\$+/g, '')
    .replace(/\$/g, '')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Compact string normalization for punctuation-insensitive matching.
 */
export function normalizeCompact(str: string): string {
  return normalizeString(str).replace(/[^a-z0-9]/gi, '');
}

/**
 * Resolves the true correct option ({ label, text }) for a multiple-choice question.
 */
export function getResolvedCorrectOption(question: Question): QuestionOption | null {
  if (!question.options || question.options.length === 0) return null;

  const rawAns = (question.correctAnswer || '').trim();
  const rawNorm = normalizeString(rawAns);
  const rawCompact = normalizeCompact(rawAns);

  // 1. Exact match by option label (A, B, C, D)
  const byLabel = question.options.find((o) => o.label.trim().toUpperCase() === rawAns.toUpperCase());
  if (byLabel) return byLabel;

  // 2. Exact match by option text (normalized)
  const byExactText = question.options.find((o) => normalizeString(o.text) === rawNorm);
  if (byExactText) return byExactText;

  // 3. Match by compact text (removing spaces and special math characters)
  if (rawCompact.length > 0) {
    const byCompact = question.options.find((o) => normalizeCompact(o.text) === rawCompact);
    if (byCompact) return byCompact;
  }

  // 4. Extract from rationale statement (e.g. "Choice A is correct", "The correct answer is B")
  if (question.rationale) {
    const ratMatch =
      question.rationale.match(/Choice\s+([A-D])\s+is\s+(?:the\s+)?correct/i) ||
      question.rationale.match(/(?:The\s+)?correct\s+answer\s+is\s*[:\s]*([A-D])\b/i) ||
      question.rationale.match(/Correct\s+Answer\s*:\s*([A-D])\b/i) ||
      question.rationale.match(/\b([A-D])\s+is\s+(?:the\s+)?correct\s+answer/i);

    if (ratMatch && ratMatch[1]) {
      const byRat = question.options.find((o) => o.label.toUpperCase() === ratMatch[1].toUpperCase());
      if (byRat) return byRat;
    }
  }

  // 5. Partial text substring inclusion
  if (rawNorm.length >= 2) {
    const bySub = question.options.find((o) => {
      const normText = normalizeString(o.text);
      return (normText.length >= 2 && normText.includes(rawNorm)) || (rawNorm.length >= 2 && rawNorm.includes(normText));
    });
    if (bySub) return bySub;
  }

  // 6. Fallback to first option if no match found
  return question.options[0] || null;
}

/**
 * Returns the standardized correct answer string for display and comparison.
 */
export function getStandardCorrectAnswer(question: Question): string {
  if (question.type === 'multiple_choice') {
    const resolved = getResolvedCorrectOption(question);
    return resolved ? resolved.label.toUpperCase() : (question.correctAnswer || 'A').toUpperCase();
  }
  return (question.correctAnswer || '').trim();
}

export interface AnswerEvaluationResult {
  isCorrect: boolean;
  userLabel?: string;
  userText?: string;
  correctLabel?: string;
  correctText?: string;
  formattedCorrectDisplay: string;
  formattedUserDisplay: string;
}

/**
 * Exhaustive, error-proof answer evaluation engine.
 */
export function evaluateAnswer(question: Question, rawUserAnswer: string): AnswerEvaluationResult {
  const userAns = (rawUserAnswer || '').trim();

  if (question.type === 'multiple_choice') {
    const resolvedOption = getResolvedCorrectOption(question);
    const correctLabel = resolvedOption ? resolvedOption.label.toUpperCase() : (question.correctAnswer || 'A').toUpperCase();
    const correctText = resolvedOption ? resolvedOption.text : '';

    // Find user's selected option if they supplied label or text
    let userOption = question.options?.find((o) => o.label.toUpperCase() === userAns.toUpperCase());
    if (!userOption && question.options) {
      const userNorm = normalizeString(userAns);
      userOption = question.options.find((o) => normalizeString(o.text) === userNorm);
    }

    const userLabel = userOption ? userOption.label.toUpperCase() : userAns.toUpperCase();
    const userText = userOption ? userOption.text : userAns;

    // Check correctness:
    // 1. User label matches correct label
    // 2. User text matches correct text
    // 3. User label matches raw question correctAnswer
    const isCorrect =
      userLabel === correctLabel ||
      (!!userText && !!correctText && normalizeString(userText) === normalizeString(correctText)) ||
      (!!userOption && normalizeString(userOption.text) === normalizeString(question.correctAnswer));

    return {
      isCorrect,
      userLabel,
      userText,
      correctLabel,
      correctText,
      formattedCorrectDisplay: correctText ? `${correctLabel}: ${correctText}` : correctLabel,
      formattedUserDisplay: userText && userText !== userLabel ? `${userLabel}: ${userText}` : userLabel
    };
  }

  // Free Response / Student-Produced Response (SPR) Evaluation
  const cleanSubmitted = userAns.toLowerCase().replace(/\s+/g, '');
  const correctNorm = (question.correctAnswer || '').toLowerCase().replace(/\s+/g, '');
  const accepted = (question.acceptedAnswers || [question.correctAnswer || ''])
    .filter(Boolean)
    .map((a) => a.toLowerCase().replace(/\s+/g, ''));

  let isCorrect = accepted.includes(cleanSubmitted) || cleanSubmitted === correctNorm;

  // Numeric equivalence checking (e.g. 55/4 vs 13.75, 2 vs 2.0, .5 vs 0.5)
  if (!isCorrect && cleanSubmitted.length > 0) {
    const parseNumeric = (val: string): number | null => {
      if (val.includes('/')) {
        const parts = val.split('/');
        if (parts.length === 2) {
          const n = Number(parts[0]);
          const d = Number(parts[1]);
          if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
        }
      }
      const num = Number(val);
      return !isNaN(num) ? num : null;
    };

    const subVal = parseNumeric(cleanSubmitted);
    if (subVal !== null) {
      for (const cand of [correctNorm, ...accepted]) {
        const candVal = parseNumeric(cand);
        if (candVal !== null && Math.abs(subVal - candVal) < 0.005) {
          isCorrect = true;
          break;
        }
      }
    }
  }

  return {
    isCorrect,
    correctLabel: question.correctAnswer,
    correctText: question.correctAnswer,
    formattedCorrectDisplay: question.correctAnswer,
    formattedUserDisplay: userAns
  };
}

/**
 * Normalizes a question object so that `correctAnswer` is always consistent and standard.
 */
export function normalizeQuestion(question: Question): Question {
  if (question.type === 'multiple_choice' && question.options && question.options.length > 0) {
    const resolved = getResolvedCorrectOption(question);
    if (resolved) {
      return {
        ...question,
        correctAnswer: resolved.label.toUpperCase()
      };
    }
  }
  return question;
}

/**
 * Standardizes an entire array of questions for in-memory and context operations.
 */
export function normalizeQuestionBank(questions: Question[]): Question[] {
  return questions.map(normalizeQuestion);
}
