import { Question, PracticeTestDefinition, PracticeTestType } from '../types';
import {
  buildTestModuleQuestions,
  RW_MODULE_QUESTION_COUNT,
  MATH_MODULE_QUESTION_COUNT,
  RW_MODULE_TIME_LIMIT_MINUTES,
  MATH_MODULE_TIME_LIMIT_MINUTES
} from '../utils/practiceTestEngine';

export const PRACTICE_TESTS_CATALOG: PracticeTestDefinition[] = [
  {
    id: 'psat-official-1',
    title: 'Official PSAT/NMSQT Practice Test #1',
    code: 'CB-PSAT-01',
    type: 'PSAT/NMSQT',
    source: 'Official College Board',
    badge: 'Standard Adaptive',
    description: 'Official College Board Digital PSAT/NMSQT adaptive benchmark exam. Includes multistage adaptive routing and official 320–1520 scoring with NMSC Selection Index.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'psat-1-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'psat-1-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'psat-1-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'psat-1-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'psat-1-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'psat-1-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  },
  {
    id: 'psat-official-2',
    title: 'Official PSAT/NMSQT Practice Test #2',
    code: 'CB-PSAT-02',
    type: 'PSAT/NMSQT',
    source: 'Official College Board',
    badge: 'Standard Adaptive',
    description: 'Authentic 2-section digital practice exam with full Desmos calculator integration, timing constraints, and National Merit percentile calibration.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'psat-2-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'psat-2-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'psat-2-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'psat-2-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'psat-2-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'psat-2-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  },
  {
    id: 'sat-official-1',
    title: 'Official Digital SAT Practice Test #1',
    code: 'CB-SAT-01',
    type: 'SAT',
    source: 'Official College Board',
    badge: 'High-Scorer Challenge',
    description: 'Official College Board Digital SAT full-length adaptive practice test. Calibrated for the 400–1600 composite scale with upper-difficulty modules.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'sat-1-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'sat-1-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'sat-1-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'sat-1-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'sat-1-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'sat-1-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  },
  {
    id: 'sat-official-2',
    title: 'Official Digital SAT Practice Test #2',
    code: 'CB-SAT-02',
    type: 'SAT',
    source: 'Official College Board',
    badge: 'High-Scorer Challenge',
    description: 'Digital SAT full-length test featuring advanced Algebra, Trigonometry, and analytical inference passages with 1600 scaled score evaluation.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'sat-2-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'sat-2-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'sat-2-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'sat-2-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'sat-2-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'sat-2-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  },
  {
    id: 'psat-nmsqt-mock-1',
    title: 'National Merit Qualifying Diagnostic Exam #1',
    code: 'NMSC-PRO-01',
    type: 'PSAT/NMSQT',
    source: 'Adaptive Curated',
    badge: 'High-Scorer Challenge',
    description: 'Designed specifically for students targeting 215+ NMSC Selection Index and Semifinalist qualification. Includes heavy high-discriminator items.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'nmsc-1-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'nmsc-1-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'nmsc-1-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'nmsc-1-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'nmsc-1-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'nmsc-1-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  },
  {
    id: 'psat-89-diagnostic-1',
    title: 'PSAT 8/9 & PSAT 10 Readiness Assessment',
    code: 'CB-PSAT-89',
    type: 'PSAT 8/9',
    source: 'Khan Academy Verified',
    badge: 'Foundational Diagnostic',
    description: 'Foundational baseline exam for 8th, 9th, and 10th graders to evaluate college readiness benchmarks across linear equations and reading comprehension.',
    totalQuestions: 98,
    totalMinutes: 134,
    modules: {
      rwModule1: {
        id: 'psat89-1-rw-m1',
        section: 'Reading and Writing',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 1, Module 1: Reading & Writing (Routing)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Easy: {
        id: 'psat89-1-rw-m2-easy',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 1, Module 2: Reading & Writing (Lower Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      rwModule2Hard: {
        id: 'psat89-1-rw-m2-hard',
        section: 'Reading and Writing',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 1, Module 2: Reading & Writing (Upper Stage)',
        timeLimitMinutes: RW_MODULE_TIME_LIMIT_MINUTES,
        questionCount: RW_MODULE_QUESTION_COUNT
      },
      mathModule1: {
        id: 'psat89-1-math-m1',
        section: 'Math',
        moduleIndex: 1,
        stage: 'module_1',
        title: 'Section 2, Module 1: Math (Routing)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Easy: {
        id: 'psat89-1-math-m2-easy',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_easy',
        title: 'Section 2, Module 2: Math (Lower Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      },
      mathModule2Hard: {
        id: 'psat89-1-math-m2-hard',
        section: 'Math',
        moduleIndex: 2,
        stage: 'module_2_hard',
        title: 'Section 2, Module 2: Math (Upper Stage)',
        timeLimitMinutes: MATH_MODULE_TIME_LIMIT_MINUTES,
        questionCount: MATH_MODULE_QUESTION_COUNT
      }
    }
  }
];

export interface InstantiatedPracticeTest {
  definition: PracticeTestDefinition;
  rwModule1Questions: Question[];
  rwModule2EasyQuestions: Question[];
  rwModule2HardQuestions: Question[];
  mathModule1Questions: Question[];
  mathModule2EasyQuestions: Question[];
  mathModule2HardQuestions: Question[];
  allQuestionsMap: Record<string, Question>;
}

/**
 * Builds non-overlapping question pools for all 6 modules of a practice test definition.
 */
export function instantiatePracticeTest(
  testDef: PracticeTestDefinition,
  allQuestions: Question[]
): InstantiatedPracticeTest {
  // Deterministic seed based on test id hash
  let hash = 0;
  for (let i = 0; i < testDef.id.length; i++) {
    hash = (hash * 31 + testDef.id.charCodeAt(i)) & 0xffffffff;
  }
  const seedOffset = Math.abs(hash);

  const excludeIds = new Set<string>();

  // 1. Reading & Writing Module 1 (27 Qs)
  const rwModule1Questions = buildTestModuleQuestions(
    allQuestions,
    'Reading and Writing',
    'module_1',
    RW_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 1
  );

  // 2. Reading & Writing Module 2 Upper / Hard (27 Qs)
  const rwModule2HardQuestions = buildTestModuleQuestions(
    allQuestions,
    'Reading and Writing',
    'module_2_hard',
    RW_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 2
  );

  // 3. Reading & Writing Module 2 Lower / Easy (27 Qs)
  const rwModule2EasyQuestions = buildTestModuleQuestions(
    allQuestions,
    'Reading and Writing',
    'module_2_easy',
    RW_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 3
  );

  // 4. Math Module 1 (22 Qs)
  const mathModule1Questions = buildTestModuleQuestions(
    allQuestions,
    'Math',
    'module_1',
    MATH_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 4
  );

  // 5. Math Module 2 Upper / Hard (22 Qs)
  const mathModule2HardQuestions = buildTestModuleQuestions(
    allQuestions,
    'Math',
    'module_2_hard',
    MATH_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 5
  );

  // 6. Math Module 2 Lower / Easy (22 Qs)
  const mathModule2EasyQuestions = buildTestModuleQuestions(
    allQuestions,
    'Math',
    'module_2_easy',
    MATH_MODULE_QUESTION_COUNT,
    excludeIds,
    seedOffset + 6
  );

  const allQuestionsMap: Record<string, Question> = {};
  [
    ...rwModule1Questions,
    ...rwModule2EasyQuestions,
    ...rwModule2HardQuestions,
    ...mathModule1Questions,
    ...mathModule2EasyQuestions,
    ...mathModule2HardQuestions
  ].forEach((q) => {
    allQuestionsMap[q.id] = q;
  });

  return {
    definition: testDef,
    rwModule1Questions,
    rwModule2EasyQuestions,
    rwModule2HardQuestions,
    mathModule1Questions,
    mathModule2EasyQuestions,
    mathModule2HardQuestions,
    allQuestionsMap
  };
}
