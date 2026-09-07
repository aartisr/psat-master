import { PRACTICE_TESTS_CATALOG, instantiatePracticeTest } from '../data/practiceTestsCatalog';
import { 
  calculateSectionScaledScore, 
  calculateSelectionIndex, 
  estimatePercentile 
} from './practiceTestEngine';
import { initialQuestions } from '../data/questions';

function runTests() {
  console.log('--- STARTING PRACTICE TEST ENGINE TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: Catalog Integrity
  assert(PRACTICE_TESTS_CATALOG.length >= 6, `Catalog contains ${PRACTICE_TESTS_CATALOG.length} official & diagnostic tests`);

  // TEST 2: Instantiation of each test
  PRACTICE_TESTS_CATALOG.forEach((testDef) => {
    const instantiated = instantiatePracticeTest(testDef, initialQuestions);
    assert(
      instantiated.rwModule1Questions.length === 27,
      `[${testDef.code}] RW Module 1 has exactly 27 questions (got ${instantiated.rwModule1Questions.length})`
    );
    assert(
      instantiated.rwModule2HardQuestions.length === 27,
      `[${testDef.code}] RW Module 2 Hard has exactly 27 questions (got ${instantiated.rwModule2HardQuestions.length})`
    );
    assert(
      instantiated.mathModule1Questions.length === 22,
      `[${testDef.code}] Math Module 1 has exactly 22 questions (got ${instantiated.mathModule1Questions.length})`
    );
    assert(
      instantiated.mathModule2HardQuestions.length === 22,
      `[${testDef.code}] Math Module 2 Hard has exactly 22 questions (got ${instantiated.mathModule2HardQuestions.length})`
    );
  });

  // TEST 3: Scaled Score Engine - PSAT/NMSQT
  const psatPerfectScore = calculateSectionScaledScore('PSAT/NMSQT', 'Reading and Writing', 27, 27, 27, 27, 'hard');
  assert(psatPerfectScore.scaledScore === 760, `PSAT/NMSQT perfect raw score gives 760 scaled (got ${psatPerfectScore.scaledScore})`);

  const psatZeroScore = calculateSectionScaledScore('PSAT/NMSQT', 'Reading and Writing', 0, 27, 0, 27, 'easy');
  assert(psatZeroScore.scaledScore === 160, `PSAT/NMSQT zero raw score gives 160 scaled (got ${psatZeroScore.scaledScore})`);

  const psatMidHard = calculateSectionScaledScore('PSAT/NMSQT', 'Reading and Writing', 18, 27, 17, 27, 'hard');
  assert(psatMidHard.scaledScore >= 550 && psatMidHard.scaledScore <= 680, `PSAT/NMSQT mid raw score gives valid scaled score (got ${psatMidHard.scaledScore})`);

  // TEST 4: Scaled Score Engine - SAT
  const satPerfectScore = calculateSectionScaledScore('SAT', 'Math', 22, 22, 22, 22, 'hard');
  assert(satPerfectScore.scaledScore === 800, `SAT perfect raw score gives 800 scaled (got ${satPerfectScore.scaledScore})`);

  const satZeroScore = calculateSectionScaledScore('SAT', 'Math', 0, 22, 0, 22, 'easy');
  assert(satZeroScore.scaledScore === 200, `SAT zero raw score gives 200 scaled (got ${satZeroScore.scaledScore})`);

  // TEST 5: NMSC Selection Index Calculation
  const perfectSI = calculateSelectionIndex(760, 760);
  assert(perfectSI === 228, `Perfect 760/760 PSAT score gives NMSC Selection Index 228 (got ${perfectSI})`);

  const minSI = calculateSelectionIndex(160, 160);
  assert(minSI === 48, `Minimum 160/160 PSAT score gives NMSC Selection Index 48 (got ${minSI})`);

  // TEST 6: Percentile curve
  assert(estimatePercentile('PSAT/NMSQT', 1520) === 99, '1520 PSAT is 99th percentile');
  assert(estimatePercentile('SAT', 1600) === 99, '1600 SAT is 99th percentile');

  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
