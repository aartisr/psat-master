import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { initialQuestions, searchQuestions } from '../data/questions';
import { psat2900QuestionBank } from '../data/psat2900Bank';
import { repairQuestion, auditQuestionBank } from './questionAuditor';
import { processQuestionDeduplication, normalizePrompt, isDuplicateQuestion } from './deduplication';
import { firebaseConfig } from '../lib/firebase';
import { Question, FilterCriteria } from '../types';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 RUNNING EXHAUSTIVE SYSTEM & FUNCTIONALITY TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ [PASS] ${testName}`);
    totalPassed++;
  } catch (error: any) {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Error details: ${error.message || error}`);
    totalFailed++;
  }
}

// ─────────────────────────────────────────────────────────────────
// SECTION 1: FIREBASE DATABASE & INTEGRATION VERIFICATION
// ─────────────────────────────────────────────────────────────────
console.log('📋 SECTION 1: Firebase Configuration & Database Schema Verification');

runTest('Firebase Config object is well-formed with database attributes', () => {
  assert.ok(firebaseConfig, 'Firebase config must be defined');
  assert.strictEqual(typeof firebaseConfig.projectId, 'string', 'projectId must be a string');
  assert.strictEqual(typeof firebaseConfig.apiKey, 'string', 'apiKey must be a string');
  assert.strictEqual(typeof firebaseConfig.authDomain, 'string', 'authDomain must be a string');
  assert.strictEqual(typeof firebaseConfig.firestoreDatabaseId, 'string', 'firestoreDatabaseId must be a string');
});

runTest('Firestore rules file exists and contains security rules', () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  assert.ok(fs.existsSync(rulesPath), 'firestore.rules file must exist');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(rulesContent.includes('rules_version = \'2\';'), 'Rules must set rules_version = 2');
  assert.ok(rulesContent.includes('match /databases/{database}/documents'), 'Rules must specify document matching path');
});

runTest('Firebase blueprint schema file exists and is valid JSON', () => {
  const blueprintPath = path.join(process.cwd(), 'firebase-blueprint.json');
  assert.ok(fs.existsSync(blueprintPath), 'firebase-blueprint.json must exist');
  const blueprintContent = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
  assert.ok(blueprintContent.entities, 'Blueprint must specify entities');
  assert.ok(blueprintContent.entities.UserAttempt, 'UserAttempt entity must exist in blueprint');
  assert.ok(blueprintContent.entities.CustomQuestion, 'CustomQuestion entity must exist in blueprint');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 2: 2,900 QUESTION BANK EXHAUSTIVE INTEGRITY
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 2: 2,900 Question Bank Exhaustive Integrity Tests');

runTest('Total question count in bank is exactly 2,900', () => {
  assert.strictEqual(psat2900QuestionBank.length, 2900, 'psat2900QuestionBank length must be 2,900');
  assert.strictEqual(initialQuestions.length, 2900, 'initialQuestions in questions.ts must be 2,900');
});

runTest('All 2,900 question IDs are unique and well-formatted', () => {
  const idSet = new Set<string>();
  psat2900QuestionBank.forEach((q, idx) => {
    assert.ok(q.id, `Question at index ${idx} missing ID`);
    assert.strictEqual(idSet.has(q.id), false, `Duplicate question ID found: ${q.id} at index ${idx}`);
    idSet.add(q.id);
  });
  assert.strictEqual(idSet.size, 2900, 'Unique ID count must be 2,900');
});

runTest('Every question has complete required fields and valid options', () => {
  psat2900QuestionBank.forEach((q, idx) => {
    assert.ok(q.prompt && q.prompt.trim().length > 0, `Question ${q.id} (idx ${idx}) has empty prompt`);
    assert.ok(q.test === 'Math' || q.test === 'Reading and Writing', `Question ${q.id} invalid test type "${q.test}"`);
    assert.ok(q.domain && q.domain.trim().length > 0, `Question ${q.id} missing domain`);
    assert.ok(q.skill && q.skill.trim().length > 0, `Question ${q.id} missing skill`);
    assert.ok(q.correctAnswer && q.correctAnswer.trim().length > 0, `Question ${q.id} missing correctAnswer`);
    assert.ok(q.rationale && q.rationale.trim().length > 0, `Question ${q.id} missing rationale`);
    
    if (q.type === 'multiple_choice' || (!q.type && q.options)) {
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `Question ${q.id} must have at least 2 options`);
      q.options!.forEach((opt) => {
        assert.ok(opt.label, `Option in ${q.id} missing label`);
        assert.ok(opt.text !== undefined && opt.text !== null, `Option in ${q.id} missing text`);
      });
    }
  });
});

runTest('Domain and assessment distributions are balanced across 2,900 questions', () => {
  const testCounts: Record<string, number> = {};
  const assessmentCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};

  psat2900QuestionBank.forEach((q) => {
    testCounts[q.test] = (testCounts[q.test] || 0) + 1;
    assessmentCounts[q.assessment] = (assessmentCounts[q.assessment] || 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
  });

  assert.ok(testCounts['Math'] > 1000, `Math count must be substantial, got ${testCounts['Math']}`);
  assert.ok(testCounts['Reading and Writing'] > 1000, `Reading count must be substantial, got ${testCounts['Reading and Writing']}`);
  assert.ok(assessmentCounts['PSAT 8/9'] > 0, 'Must include PSAT 8/9 questions');
  assert.ok(assessmentCounts['PSAT 10'] > 0, 'Must include PSAT 10 questions');
  assert.ok(assessmentCounts['PSAT/NMSQT'] > 0, 'Must include PSAT/NMSQT questions');
  assert.ok(assessmentCounts['SAT'] > 0, 'Must include SAT questions');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 3: SEARCH, FILTERING, AND CONCEPT INTERSECTION
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 3: Search Engine & Filtering Logic Tests');

runTest('Search by Test category ("Math" vs "Reading and Writing")', () => {
  const mathFilter: Partial<FilterCriteria> = { test: 'Math' };
  const mathResults = searchQuestions(psat2900QuestionBank, mathFilter);
  assert.ok(mathResults.results.length > 0, 'Math search should yield results');
  assert.ok(mathResults.results.every((q) => q.test === 'Math'), 'All returned questions must be Math');

  const readingFilter: Partial<FilterCriteria> = { test: 'Reading and Writing' };
  const readingResults = searchQuestions(psat2900QuestionBank, readingFilter);
  assert.ok(readingResults.results.length > 0, 'Reading search should yield results');
  assert.ok(readingResults.results.every((q) => q.test === 'Reading and Writing'), 'All returned questions must be Reading and Writing');
});

runTest('Search by keyword query (e.g. "slope", "linear")', () => {
  const queryFilter: Partial<FilterCriteria> = { query: 'slope' };
  const queryResults = searchQuestions(psat2900QuestionBank, queryFilter);
  assert.ok(queryResults.results.length > 0, 'Keyword search "slope" should yield matches');
  assert.ok(queryResults.searchTimeMs >= 0, 'Search timing must be measured');
});

runTest('Filter by Difficulty ("Easy", "Medium", "Hard")', () => {
  const hardFilter: Partial<FilterCriteria> = { difficulty: 'Hard' };
  const hardResults = searchQuestions(psat2900QuestionBank, hardFilter);
  assert.ok(hardResults.results.length > 0, 'Hard difficulty filter should yield questions');
  assert.ok(hardResults.results.every((q) => q.difficulty === 'Hard'), 'All returned questions must be Hard difficulty');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 4: QUESTION AUDITOR & REPAIR ENGINE
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 4: Question Auditor & LaTeX Repair Tests');

runTest('Repair unclosed LaTeX math delimiters', () => {
  const unclosedQ: Question = {
    id: 'test_unclosed',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Solve for $x: 2x + 4 = 10',
    correctAnswer: '3',
    rationale: 'Subtract 4 to get $2x = 6',
    hints: [],
    concepts: []
  };

  const repaired = repairQuestion(unclosedQ);
  assert.strictEqual(repaired.prompt, 'Solve for $x: 2x + 4 = 10$', 'Should close unclosed $ in prompt');
  assert.strictEqual(repaired.rationale, 'Subtract 4 to get $2x = 6$', 'Should close unclosed $ in rationale');
});

runTest('Audit entire 2,900 question bank with questionAuditor', () => {
  const auditResult = auditQuestionBank(psat2900QuestionBank);
  assert.strictEqual(auditResult.totalQuestions, 2900, 'Audited question count must be 2,900');
  assert.ok(Array.isArray(auditResult.results), 'results must be an array');
  assert.strictEqual(auditResult.results.length, 2900, 'Results count must match total audited');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 5: DEDUPLICATION ENGINE & BATCH IMPORTS
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 5: Deduplication Engine & Batch Import Tests');

runTest('Prompt normalization converts math tags and extra space', () => {
  const raw = '  Solve   for  $x$:   \\frac{a}{b}  ';
  const norm = normalizePrompt(raw);
  assert.strictEqual(norm, 'solve for x: a/b', 'Normalized prompt must condense whitespace and format math');
});

runTest('Duplicate question detection catches identical IDs and prompts', () => {
  const sampleQ = psat2900QuestionBank[0];
  const exactDupResult = isDuplicateQuestion(sampleQ, psat2900QuestionBank);
  assert.strictEqual(exactDupResult.isDuplicate, true, 'Exact question match must be flagged as duplicate');

  const clonedQWithNewId: Question = {
    ...sampleQ,
    id: 'completely_new_id_9999'
  };
  const promptDupResult = isDuplicateQuestion(clonedQWithNewId, psat2900QuestionBank);
  assert.strictEqual(promptDupResult.isDuplicate, true, 'Identical prompt with different ID must be flagged as duplicate');
});

runTest('Batch deduplication adds unique items and skips duplicates', () => {
  const sampleExisting = [psat2900QuestionBank[0], psat2900QuestionBank[1]];
  const incoming = [
    psat2900QuestionBank[0], // Duplicate ID & prompt
    {
      id: 'brand_new_unique_101',
      assessment: 'PSAT 8/9',
      test: 'Math',
      domain: 'Geometry and Trigonometry',
      skill: 'Circles',
      difficulty: 'Easy',
      type: 'multiple_choice',
      prompt: 'Unique test prompt for circle radius equation',
      correctAnswer: '5',
      rationale: 'Unique rationale',
      hints: [],
      concepts: []
    } as Question
  ];

  const dedupResult = processQuestionDeduplication(incoming, sampleExisting);
  assert.strictEqual(dedupResult.totalReceived, 2, 'Total received should be 2');
  assert.strictEqual(dedupResult.duplicateCount, 1, 'Duplicate count should be 1');
  assert.strictEqual(dedupResult.addedCount, 1, 'Added count should be 1');
  assert.strictEqual(dedupResult.addedQuestions[0].id, 'brand_new_unique_101', 'Added question ID must match incoming unique item');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 6: RESILIENT LOCAL & CLOUD AUTHENTICATION VERIFICATION
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 6: Resilient Authentication & Local Fallback Engine');

import { 
  saveLocalAccount, 
  authenticateLocalAccount, 
  getActiveLocalUser, 
  logoutLocalUser,
  getLocalGuestProfile
} from '../lib/firebase';

runTest('Local account creation and session activation works correctly', () => {
  const profile = saveLocalAccount('student.test@example.com', 'mypassword123', 'Test Student');
  assert.ok(profile, 'Profile must be returned');
  assert.strictEqual(profile.email, 'student.test@example.com');
  assert.strictEqual(profile.displayName, 'Test Student');
  assert.strictEqual(profile.role, 'student', 'Regular email should have student role');
  assert.strictEqual(profile.isAnonymous, false);

  const active = getActiveLocalUser();
  assert.ok(active, 'Active local user must be set');
  assert.strictEqual(active.email, 'student.test@example.com');
});

runTest('Local account authentication validates password correctly', () => {
  saveLocalAccount('login.tester@example.com', 'secureSecret99', 'Login Tester');
  
  // Valid login
  const authed = authenticateLocalAccount('login.tester@example.com', 'secureSecret99');
  assert.ok(authed, 'Must authenticate with correct password');
  assert.strictEqual(authed.displayName, 'Login Tester');

  // Invalid password
  assert.throws(() => {
    authenticateLocalAccount('login.tester@example.com', 'wrongpassword');
  }, (err: any) => {
    return err.code === 'auth/wrong-password';
  }, 'Should throw auth/wrong-password for invalid credentials');

  // Unregistered email
  assert.throws(() => {
    authenticateLocalAccount('unregistered@example.com', 'anypass');
  }, (err: any) => {
    return err.code === 'auth/user-not-found';
  }, 'Should throw auth/user-not-found for unregistered emails');
});

runTest('Admin role is accurately recognized for authorized admin accounts', () => {
  const adminProfile = saveLocalAccount('ravikumar.raman@gmail.com', 'adminpass', 'Ravi Admin');
  assert.strictEqual(adminProfile.role, 'admin', 'Admin email must be assigned admin role');
});

runTest('Logout properly clears local active session', () => {
  saveLocalAccount('logout.check@example.com', 'secret', 'Logout Check');
  assert.ok(getActiveLocalUser(), 'User must be active before logout');
  logoutLocalUser();
  assert.strictEqual(getActiveLocalUser(), null, 'Active user must be null after logout');
});

// ─────────────────────────────────────────────────────────────────
// SECTION 7: ANSWER EVALUATION & SUBMISSION LOGIC TESTS
// ─────────────────────────────────────────────────────────────────
console.log('\n📋 SECTION 7: Answer Evaluation & Submission Correctness Tests');

import { evaluateAnswer, getResolvedCorrectOption, getStandardCorrectAnswer } from './answerEvaluator';

runTest('MCQ answer evaluation correctly recognizes answer by option label (A, B, C, D)', () => {
  const sampleMCQ: Question = {
    id: 'test_mcq_1',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'What is 2 + 2?',
    correctAnswer: 'B',
    options: [
      { label: 'A', text: '3' },
      { label: 'B', text: '4' },
      { label: 'C', text: '5' },
      { label: 'D', text: '6' }
    ],
    rationale: '2 + 2 = 4, so choice B is correct.',
    hints: [],
    concepts: []
  };

  const correctRes = evaluateAnswer(sampleMCQ, 'B');
  assert.strictEqual(correctRes.isCorrect, true, 'Submitting B should be correct');
  assert.strictEqual(correctRes.correctLabel, 'B');

  const wrongRes = evaluateAnswer(sampleMCQ, 'A');
  assert.strictEqual(wrongRes.isCorrect, false, 'Submitting A should be incorrect');
});

runTest('MCQ answer evaluation resolves questions where correctAnswer is option text', () => {
  const sampleTextMCQ: Question = {
    id: 'test_mcq_2',
    assessment: 'PSAT 10',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Solve for x: x - 3 = 1',
    correctAnswer: '4',
    options: [
      { label: 'A', text: '2' },
      { label: 'B', text: '3' },
      { label: 'C', text: '4' },
      { label: 'D', text: '5' }
    ],
    rationale: 'x = 4. Choice C is correct.',
    hints: [],
    concepts: []
  };

  const resolved = getResolvedCorrectOption(sampleTextMCQ);
  assert.ok(resolved, 'Should resolve option');
  assert.strictEqual(resolved.label, 'C');

  // Submitting label 'C'
  const byLabel = evaluateAnswer(sampleTextMCQ, 'C');
  assert.strictEqual(byLabel.isCorrect, true, 'Submitting C should be correct');

  // Submitting text '4'
  const byText = evaluateAnswer(sampleTextMCQ, '4');
  assert.strictEqual(byText.isCorrect, true, 'Submitting 4 should be correct');

  // Submitting wrong option 'A'
  const byWrong = evaluateAnswer(sampleTextMCQ, 'A');
  assert.strictEqual(byWrong.isCorrect, false, 'Submitting A should be incorrect');
});

runTest('Free response evaluation supports fractions, decimals, and accepted answers', () => {
  const sampleGridIn: Question = {
    id: 'test_grid_1',
    assessment: 'PSAT/NMSQT',
    test: 'Math',
    domain: 'Advanced Math',
    skill: 'Nonlinear functions',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'Evaluate 55 / 4',
    correctAnswer: '55/4',
    acceptedAnswers: ['55/4', '13.75'],
    rationale: '55/4 = 13.75.',
    hints: [],
    concepts: []
  };

  assert.strictEqual(evaluateAnswer(sampleGridIn, '55/4').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleGridIn, '13.75').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleGridIn, '13.750').isCorrect, true);
  assert.strictEqual(evaluateAnswer(sampleGridIn, '10').isCorrect, false);
});

runTest('All 2,900 question bank items resolve with 100% precision', () => {
  let resolvedCount = 0;
  for (const q of psat2900QuestionBank) {
    if (q.type === 'multiple_choice') {
      const opt = getResolvedCorrectOption(q);
      assert.ok(opt !== null, `Question ${q.id} must resolve an option`);
      const evalRes = evaluateAnswer(q, opt!.label);
      assert.strictEqual(evalRes.isCorrect, true, `Question ${q.id} must evaluate to correct when submitting resolved label`);
      resolvedCount++;
    }
  }
  assert.ok(resolvedCount >= 2800, `Must evaluate at least 2800 MCQ questions, evaluated ${resolvedCount}`);
});

// ─────────────────────────────────────────────────────────────────
// FINAL RESULTS SUMMARY
// ─────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 TEST SUITE SUMMARY: ${totalPassed} PASSED | ${totalFailed} FAILED`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL EXHAUSTIVE FUNCTIONALITY AND REGRESSION TESTS PASSED CLEANLY!\n');
  process.exit(0);
}
