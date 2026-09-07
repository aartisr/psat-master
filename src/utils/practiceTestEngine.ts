import { Question, PracticeTestDefinition, PracticeTestResult, PracticeTestAnswerRecord, PracticeTestType } from '../types';
import { evaluateAnswer } from './answerEvaluator';

/**
 * Official College Board Module Sizes for Digital Tests:
 * - Reading & Writing: 27 questions per module (32 minutes per module)
 * - Math: 22 questions per module (35 minutes per module)
 */
export const RW_MODULE_QUESTION_COUNT = 27;
export const MATH_MODULE_QUESTION_COUNT = 22;
export const RW_MODULE_TIME_LIMIT_MINUTES = 32;
export const MATH_MODULE_TIME_LIMIT_MINUTES = 35;
export const SCHEDULED_BREAK_TIME_SECONDS = 600; // 10 minutes

/**
 * Multistage Adaptive routing threshold:
 * Answering >= 60% of Module 1 correctly routes student to the Harder Stage 2.
 */
export const RW_ROUTING_THRESHOLD_CORRECT = 15; // 15/27 (~56-60%)
export const MATH_ROUTING_THRESHOLD_CORRECT = 13; // 13/22 (~59-60%)

/**
 * Filter questions for a specific module based on difficulty and test category.
 */
export function buildTestModuleQuestions(
  allQuestions: Question[],
  test: 'Math' | 'Reading and Writing',
  stage: 'module_1' | 'module_2_easy' | 'module_2_hard',
  count: number,
  excludeIds: Set<string>,
  seedOffset: number = 0
): Question[] {
  const pool = allQuestions.filter(
    (q) => q.test === test && !q.isDeleted && !excludeIds.has(q.id)
  );

  let targetDifficulties: ('Easy' | 'Medium' | 'Hard')[] = [];
  if (stage === 'module_1') {
    // Balanced baseline
    targetDifficulties = ['Easy', 'Medium', 'Hard'];
  } else if (stage === 'module_2_easy') {
    // Lower stage
    targetDifficulties = ['Easy', 'Medium'];
  } else {
    // Upper stage
    targetDifficulties = ['Medium', 'Hard'];
  }

  const matching = pool.filter((q) => targetDifficulties.includes(q.difficulty));
  const candidatePool = matching.length >= count ? matching : pool;

  // Domain balancing
  const domainBuckets: Record<string, Question[]> = {};
  candidatePool.forEach((q) => {
    if (!domainBuckets[q.domain]) domainBuckets[q.domain] = [];
    domainBuckets[q.domain].push(q);
  });

  const selected: Question[] = [];
  const domains = Object.keys(domainBuckets);
  let domainIdx = seedOffset % Math.max(domains.length, 1);

  // Distribute across domains
  while (selected.length < count) {
    let addedInPass = false;
    for (let i = 0; i < domains.length && selected.length < count; i++) {
      const currentDomain = domains[(domainIdx + i) % domains.length];
      const bucket = domainBuckets[currentDomain];
      if (bucket && bucket.length > 0) {
        // Pick question with rotation based on seed
        const pickIdx = (seedOffset * 7 + selected.length) % bucket.length;
        const [picked] = bucket.splice(pickIdx, 1);
        selected.push(picked);
        excludeIds.add(picked.id);
        addedInPass = true;
      }
    }
    if (!addedInPass) break;
  }

  // Fallback if needed
  if (selected.length < count) {
    for (const q of pool) {
      if (!excludeIds.has(q.id)) {
        selected.push(q);
        excludeIds.add(q.id);
        if (selected.length === count) break;
      }
    }
  }

  return selected.slice(0, count);
}

/**
 * Calculates official scaled scores (160-760 for PSAT, 200-800 for SAT)
 * with multistage ceiling/floor adjustments.
 */
export function calculateSectionScaledScore(
  testType: PracticeTestType,
  section: 'Reading and Writing' | 'Math',
  m1Correct: number,
  m1Total: number,
  m2Correct: number,
  m2Total: number,
  m2Stage: 'easy' | 'hard'
): { scaledScore: number; percentile: number } {
  const isSAT = testType === 'SAT';
  const minScore = isSAT ? 200 : 160;
  const maxScore = isSAT ? 800 : 760;
  const scoreSpan = maxScore - minScore;

  const totalCorrect = m1Correct + m2Correct;
  const totalQuestions = m1Total + m2Total;

  if (totalQuestions === 0) return { scaledScore: minScore, percentile: 1 };

  let scaledScore: number;

  if (m2Stage === 'easy') {
    // Lower Stage: Maximum scaled score is capped at ~600 (PSAT) or ~640 (SAT)
    const easyMaxCap = isSAT ? 640 : 590;
    const accuracy = totalCorrect / totalQuestions;
    const computed = minScore + accuracy * (easyMaxCap - minScore);
    scaledScore = Math.round(computed / 10) * 10;
  } else {
    // Upper Stage: Full scale accessible with elevated floor
    const hardFloor = isSAT ? 420 : 380;
    const accuracy = totalCorrect / totalQuestions;
    const computed = hardFloor + accuracy * (maxScore - hardFloor);
    scaledScore = Math.round(computed / 10) * 10;
  }

  // Ensure strict bounds
  scaledScore = Math.max(minScore, Math.min(maxScore, scaledScore));

  // Estimate Percentile
  const percentile = estimatePercentile(testType, scaledScore * 2); // composite estimate

  return { scaledScore, percentile };
}

/**
 * Estimate national percentile from composite score.
 */
export function estimatePercentile(testType: PracticeTestType, compositeScore: number): number {
  if (testType === 'SAT') {
    if (compositeScore >= 1550) return 99;
    if (compositeScore >= 1500) return 98;
    if (compositeScore >= 1450) return 96;
    if (compositeScore >= 1400) return 93;
    if (compositeScore >= 1350) return 90;
    if (compositeScore >= 1300) return 86;
    if (compositeScore >= 1250) return 81;
    if (compositeScore >= 1200) return 75;
    if (compositeScore >= 1150) return 68;
    if (compositeScore >= 1100) return 60;
    if (compositeScore >= 1050) return 51;
    if (compositeScore >= 1000) return 43;
    if (compositeScore >= 950) return 34;
    if (compositeScore >= 900) return 26;
    if (compositeScore >= 850) return 18;
    return Math.max(1, Math.round((compositeScore / 800) * 10));
  } else {
    // PSAT / NMSQT (320 - 1520)
    if (compositeScore >= 1480) return 99;
    if (compositeScore >= 1420) return 99;
    if (compositeScore >= 1380) return 98;
    if (compositeScore >= 1320) return 95;
    if (compositeScore >= 1260) return 91;
    if (compositeScore >= 1200) return 86;
    if (compositeScore >= 1140) return 79;
    if (compositeScore >= 1080) return 70;
    if (compositeScore >= 1020) return 60;
    if (compositeScore >= 960) return 50;
    if (compositeScore >= 900) return 39;
    if (compositeScore >= 840) return 28;
    if (compositeScore >= 780) return 19;
    return Math.max(1, Math.round((compositeScore / 760) * 10));
  }
}

/**
 * Calculate the NMSC Selection Index (48-228) for PSAT/NMSQT.
 * Formula: 2 * (RW / 10) + (Math / 10)
 */
export function calculateSelectionIndex(rwScore: number, mathScore: number): number {
  const rwNMSC = Math.round(rwScore / 10);
  const mathNMSC = Math.round(mathScore / 10);
  return 2 * rwNMSC + mathNMSC;
}

/**
 * Compiles full PracticeTestResult from an exam session.
 */
export function compileTestResult(
  testDef: PracticeTestDefinition,
  answers: Record<string, PracticeTestAnswerRecord>,
  questionLookup: Record<string, Question>,
  totalTimeSpentSeconds: number,
  rwStage: 'easy' | 'hard',
  mathStage: 'easy' | 'hard',
  rwM1QuestionIds: string[],
  rwM2QuestionIds: string[],
  mathM1QuestionIds: string[],
  mathM2QuestionIds: string[]
): PracticeTestResult {
  // Reading & Writing Evaluation
  let rwM1Correct = 0;
  rwM1QuestionIds.forEach((id) => {
    if (answers[id]?.isCorrect) rwM1Correct++;
  });

  let rwM2Correct = 0;
  rwM2QuestionIds.forEach((id) => {
    if (answers[id]?.isCorrect) rwM2Correct++;
  });

  // Math Evaluation
  let mathM1Correct = 0;
  mathM1QuestionIds.forEach((id) => {
    if (answers[id]?.isCorrect) mathM1Correct++;
  });

  let mathM2Correct = 0;
  mathM2QuestionIds.forEach((id) => {
    if (answers[id]?.isCorrect) mathM2Correct++;
  });

  // Domain Breakdown calculation
  const rwDomains: Record<string, { correct: number; total: number; accuracy: number }> = {};
  const mathDomains: Record<string, { correct: number; total: number; accuracy: number }> = {};

  const allActiveIds = [...rwM1QuestionIds, ...rwM2QuestionIds, ...mathM1QuestionIds, ...mathM2QuestionIds];

  allActiveIds.forEach((id) => {
    const q = questionLookup[id];
    if (!q) return;
    const isCorrect = !!answers[id]?.isCorrect;
    const targetMap = q.test === 'Reading and Writing' ? rwDomains : mathDomains;

    if (!targetMap[q.domain]) {
      targetMap[q.domain] = { correct: 0, total: 0, accuracy: 0 };
    }
    targetMap[q.domain].total++;
    if (isCorrect) targetMap[q.domain].correct++;
    targetMap[q.domain].accuracy = Math.round(
      (targetMap[q.domain].correct / targetMap[q.domain].total) * 100
    );
  });

  // Section Scaled Scores
  const rwScoreObj = calculateSectionScaledScore(
    testDef.type,
    'Reading and Writing',
    rwM1Correct,
    rwM1QuestionIds.length,
    rwM2Correct,
    rwM2QuestionIds.length,
    rwStage
  );

  const mathScoreObj = calculateSectionScaledScore(
    testDef.type,
    'Math',
    mathM1Correct,
    mathM1QuestionIds.length,
    mathM2Correct,
    mathM2QuestionIds.length,
    mathStage
  );

  const compositeScore = rwScoreObj.scaledScore + mathScoreObj.scaledScore;
  const maxCompositeScore = testDef.type === 'SAT' ? 1600 : 1520;
  const percentile = estimatePercentile(testDef.type, compositeScore);
  const selectionIndex =
    testDef.type === 'PSAT/NMSQT' || testDef.type === 'PSAT 10'
      ? calculateSelectionIndex(rwScoreObj.scaledScore, mathScoreObj.scaledScore)
      : undefined;

  return {
    id: `result_${testDef.id}_${Date.now()}`,
    testId: testDef.id,
    testTitle: testDef.title,
    testType: testDef.type,
    completedAt: Date.now(),
    totalTimeSpentSeconds,
    compositeScore,
    maxCompositeScore,
    percentile,
    selectionIndex,
    rwSection: {
      rawScore: rwM1Correct + rwM2Correct,
      maxRawScore: rwM1QuestionIds.length + rwM2QuestionIds.length,
      scaledScore: rwScoreObj.scaledScore,
      percentile: rwScoreObj.percentile,
      module1Score: rwM1Correct,
      module1Total: rwM1QuestionIds.length,
      module2Score: rwM2Correct,
      module2Total: rwM2QuestionIds.length,
      module2Stage: rwStage,
      domainBreakdown: rwDomains
    },
    mathSection: {
      rawScore: mathM1Correct + mathM2Correct,
      maxRawScore: mathM1QuestionIds.length + mathM2QuestionIds.length,
      scaledScore: mathScoreObj.scaledScore,
      percentile: mathScoreObj.percentile,
      module1Score: mathM1Correct,
      module1Total: mathM1QuestionIds.length,
      module2Score: mathM2Correct,
      module2Total: mathM2QuestionIds.length,
      module2Stage: mathStage,
      domainBreakdown: mathDomains
    },
    answers,
    questions: questionLookup
  };
}
