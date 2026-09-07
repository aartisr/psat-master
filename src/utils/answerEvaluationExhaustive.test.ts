import assert from 'assert';
import { psat2900QuestionBank } from '../data/psat2900Bank';
import { psatMathQuestionsPart1 } from '../data/psatMathQuestions1';
import { psatMathQuestionsPart2 } from '../data/psatMathQuestions2';
import { psatReadingQuestions } from '../data/psatReadingQuestions';
import { initialQuestions } from '../data/questions';
import {
  evaluateAnswer,
  getResolvedCorrectOption,
  getStandardCorrectAnswer,
  normalizeString,
  normalizeCompact,
  normalizeQuestion,
  normalizeQuestionBank
} from './answerEvaluator';
import { Question } from '../types';

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    throw err;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 EXHAUSTIVE ANSWER EVALUATION & SUBMISSION TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── TEST GROUP 1: STRING & MATH NORMALIZATION ──────────────────────
console.log('📋 GROUP 1: Math and String Normalization Engine');

test('normalizeString strips LaTeX delimiters and formatting correctly', () => {
  assert.strictEqual(normalizeString('$x = 5$'), 'x = 5');
  assert.strictEqual(normalizeString('$$\\frac{1}{2}$$'), '\\frac{1}{2}');
  assert.strictEqual(normalizeString('\\text{hello world}'), 'hello world');
  assert.strictEqual(normalizeString('2 \\times 3'), '2 * 3');
  assert.strictEqual(normalizeString('6 \\div 2'), '6 / 2');
  assert.strictEqual(normalizeString('“smart quotes” and ‘single’'), '"smart quotes" and \'single\'');
});

test('normalizeCompact removes all spaces and punctuation for robust comparison', () => {
  assert.strictEqual(normalizeCompact('$f(x) = x^2 - 9x + 20$'), 'fxx29x20');
  assert.strictEqual(normalizeCompact('Furthermore,'), 'furthermore');
  assert.strictEqual(normalizeCompact('(x - 2)^2 + (y - 2)^2 = 49'), 'x22y2249');
});

// ── TEST GROUP 2: MULTIPLE CHOICE EVALUATION BY LABEL ──────────────
console.log('\n📋 GROUP 2: Multiple Choice Label & Case Invariance');

test('evaluateAnswer accurately validates uppercase and lowercase option labels', () => {
  const sampleQ: Question = {
    id: 'test_q_label_1',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Easy',
    type: 'multiple_choice',
    prompt: 'Solve $x + 2 = 5$',
    correctAnswer: 'C',
    options: [
      { label: 'A', text: '1' },
      { label: 'B', text: '2' },
      { label: 'C', text: '3' },
      { label: 'D', text: '4' }
    ],
    rationale: 'Choice C is correct. $x = 3$.',
    hints: [],
    concepts: []
  };

  // Correct attempts
  assert.strictEqual(evaluateAnswer(sampleQ, 'C').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleQ, 'c').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleQ, '  C  ').isCorrect, true);

  // Incorrect attempts
  assert.strictEqual(evaluateAnswer(sampleQ, 'A').isCorrect, false);
  assert.strictEqual(evaluateAnswer(sampleQ, 'B').isCorrect, false);
  assert.strictEqual(evaluateAnswer(sampleQ, 'D').isCorrect, false);
  assert.strictEqual(evaluateAnswer(sampleQ, 'Z').isCorrect, false);
});

// ── TEST GROUP 3: MULTIPLE CHOICE EVALUATION BY TEXT ───────────────
console.log('\n📋 GROUP 3: Multiple Choice Text-Based Value Submission');

test('evaluateAnswer recognizes answer when user or legacy bank supplies option text', () => {
  const sampleQ: Question = {
    id: 'test_q_text_1',
    assessment: 'PSAT/NMSQT',
    test: 'Reading and Writing',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'As used in the text, what does "conspicuous" most nearly mean?',
    correctAnswer: 'B',
    options: [
      { label: 'A', text: 'hidden' },
      { label: 'B', text: 'noticeable' },
      { label: 'C', text: 'negligible' },
      { label: 'D', text: 'uncertain' }
    ],
    rationale: 'Choice B is correct. "Noticeable" matches conspicuous.',
    hints: [],
    concepts: []
  };

  // Submitting the text of choice B
  assert.strictEqual(evaluateAnswer(sampleQ, 'noticeable').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleQ, 'NOTICEABLE').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleQ, '  noticeable  ').isCorrect, true);

  // Submitting distractor text
  assert.strictEqual(evaluateAnswer(sampleQ, 'hidden').isCorrect, false);
  assert.strictEqual(evaluateAnswer(sampleQ, 'negligible').isCorrect, false);
  assert.strictEqual(evaluateAnswer(sampleQ, 'uncertain').isCorrect, false);
});

// ── TEST GROUP 4: FREE RESPONSE & STUDENT-PRODUCED RESPONSE (SPR) ──
console.log('\n📋 GROUP 4: Free Response (SPR) Fractions & Decimals');

test('evaluateAnswer handles fractions, decimals, negative values, and accepted variations', () => {
  const fractionQ: Question = {
    id: 'test_frac_1',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Advanced Math',
    skill: 'Nonlinear functions',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'What is the value of 55 / 4?',
    correctAnswer: '55/4',
    acceptedAnswers: ['55/4', '13.75', '13.750'],
    rationale: '55/4 = 13.75.',
    hints: [],
    concepts: []
  };

  // Exact fraction
  assert.strictEqual(evaluateAnswer(fractionQ, '55/4').isCorrect, true);
  assert.strictEqual(evaluateAnswer(fractionQ, ' 55 / 4 ').isCorrect, true);
  // Decimal equivalent
  assert.strictEqual(evaluateAnswer(fractionQ, '13.75').isCorrect, true);
  assert.strictEqual(evaluateAnswer(fractionQ, '13.750').isCorrect, true);
  // Wrong answers
  assert.strictEqual(evaluateAnswer(fractionQ, '13.7').isCorrect, false);
  assert.strictEqual(evaluateAnswer(fractionQ, '14').isCorrect, false);

  const negativeQ: Question = {
    id: 'test_neg_1',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'free_response',
    prompt: 'Solve $2x + 64 = 0$',
    correctAnswer: '-32',
    acceptedAnswers: ['-32', '-32.0'],
    rationale: '$2x = -64 \\implies x = -32$.',
    hints: [],
    concepts: []
  };

  assert.strictEqual(evaluateAnswer(negativeQ, '-32').isCorrect, true);
  assert.strictEqual(evaluateAnswer(negativeQ, ' -32 ').isCorrect, true);
  assert.strictEqual(evaluateAnswer(negativeQ, '-32.0').isCorrect, true);
  assert.strictEqual(evaluateAnswer(negativeQ, '32').isCorrect, false);
});

// ── TEST GROUP 5: RATIONALE EXTRACTION FALLBACK ─────────────────────
console.log('\n📋 GROUP 5: Fallback Extraction from Rationale');

test('getResolvedCorrectOption recovers correct option from rationale when correctAnswer is corrupted', () => {
  const corruptedQ: Question = {
    id: 'test_corrupted_1',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Find the slope.',
    correctAnswer: 'UNKNOWN_VALUE',
    options: [
      { label: 'A', text: '1/2' },
      { label: 'B', text: '3/4' },
      { label: 'C', text: '2' },
      { label: 'D', text: '5' }
    ],
    rationale: 'Choice B is correct because the rise over run is 3/4.',
    hints: [],
    concepts: []
  };

  const resolved = getResolvedCorrectOption(corruptedQ);
  assert.ok(resolved !== null);
  assert.strictEqual(resolved?.label, 'B');
  assert.strictEqual(resolved?.text, '3/4');

  const evalRes = evaluateAnswer(corruptedQ, 'B');
  assert.strictEqual(evalRes.isCorrect, true);
});

// ── TEST GROUP 6: 100% EXHAUSTIVE VERIFICATION OF ALL 2,900 QUESTIONS 
console.log('\n📋 GROUP 6: Exhaustive Sweep Across Entire 2,900 Question Bank');

test('Every single question in psat2900QuestionBank resolves and evaluates with 100% accuracy', () => {
  let mcqTested = 0;
  let frqTested = 0;

  for (const q of psat2900QuestionBank) {
    if (q.type === 'multiple_choice') {
      mcqTested++;

      // 1. Must have valid options
      assert.ok(q.options && q.options.length >= 2, `Question ${q.id} must have at least 2 options`);

      // 2. Must resolve a valid correct option
      const resolvedOpt = getResolvedCorrectOption(q);
      assert.ok(resolvedOpt !== null, `Question ${q.id} must resolve an option`);

      // 3. Submitting the correct label MUST be correct
      const resByLabel = evaluateAnswer(q, resolvedOpt.label);
      assert.strictEqual(
        resByLabel.isCorrect,
        true,
        `Question ${q.id} must be correct for label ${resolvedOpt.label}`
      );

      // 4. Submitting the correct text MUST be correct
      const resByText = evaluateAnswer(q, resolvedOpt.text);
      assert.strictEqual(
        resByText.isCorrect,
        true,
        `Question ${q.id} must be correct for text "${resolvedOpt.text}"`
      );

      // 5. Submitting any distractor MUST NOT be correct
      for (const opt of q.options) {
        if (opt.label !== resolvedOpt.label && opt.text !== resolvedOpt.text) {
          const resWrong = evaluateAnswer(q, opt.label);
          assert.strictEqual(
            resWrong.isCorrect,
            false,
            `Question ${q.id} option ${opt.label} must be rejected as incorrect`
          );
        }
      }
    } else {
      frqTested++;
      // Free response evaluation check
      assert.ok(q.correctAnswer && q.correctAnswer.trim().length > 0, `FRQ ${q.id} must have correctAnswer`);
      const resFRQ = evaluateAnswer(q, q.correctAnswer);
      assert.strictEqual(resFRQ.isCorrect, true, `FRQ ${q.id} must evaluate to true for ${q.correctAnswer}`);
    }
  }

  console.log(`     (Audited ${mcqTested} Multiple Choice questions + ${frqTested} Free Response questions)`);
  assert.strictEqual(mcqTested + frqTested, 2900);
});

// ── TEST GROUP 7: SUPPLEMENTAL DATASET VERIFICATION ─────────────────
console.log('\n📋 GROUP 7: Supplemental Datasets (Math Parts 1 & 2, Reading)');

test('All supplemental question sets evaluate with 100% precision', () => {
  const allSupplemental = [...psatMathQuestionsPart1, ...psatMathQuestionsPart2, ...psatReadingQuestions];
  assert.ok(allSupplemental.length > 0);

  for (const q of allSupplemental) {
    if (q.type === 'multiple_choice') {
      const resolved = getResolvedCorrectOption(q);
      assert.ok(resolved !== null, `Supplemental Q ${q.id} should resolve`);
      assert.strictEqual(evaluateAnswer(q, resolved.label).isCorrect, true);
    } else {
      assert.strictEqual(evaluateAnswer(q, q.correctAnswer).isCorrect, true);
    }
  }
});

// ── TEST GROUP 8: QUESTION NORMALIZATION PIPELINE ───────────────────
console.log('\n📋 GROUP 8: Question Normalization Pipeline');

test('normalizeQuestion safely converts any question object into standard format', () => {
  const legacyQ: Question = {
    id: 'legacy_1',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Easy',
    type: 'multiple_choice',
    prompt: 'What is x?',
    correctAnswer: '42',
    options: [
      { label: 'A', text: '10' },
      { label: 'B', text: '42' },
      { label: 'C', text: '99' },
      { label: 'D', text: '0' }
    ],
    rationale: 'Choice B is correct.',
    hints: [],
    concepts: []
  };

  const normalized = normalizeQuestion(legacyQ);
  assert.strictEqual(normalized.correctAnswer, 'B');

  const normalizedBank = normalizeQuestionBank([legacyQ]);
  assert.strictEqual(normalizedBank[0].correctAnswer, 'B');
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 TOTAL SUITE RESULTS: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY (100%)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
