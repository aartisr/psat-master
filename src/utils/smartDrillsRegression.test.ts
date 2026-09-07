import { psat2900QuestionBank } from '../data/psat2900Bank';
import {
  inferTestCategory,
  selectDailySprintQuestions,
  selectReadingWritingSprintQuestions,
  selectHardMathQuestions,
  selectTimedSpeedDrillQuestions,
  selectSkillDrillQuestions,
  selectWeaknessDrillQuestions,
  selectMissedDrillQuestions
} from './drillSelector';

console.log('🚀 Running PSAT Smart Drills Regression & Subject-Boundary Test Suite...');

const allQuestions = psat2900QuestionBank;
let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    passed++;
  }
}

// 1. Test Category Inference
console.log('1. Testing Subject Inference & Keyword Routing...');
const rwQueries = [
  'Reading & Writing Sprint',
  'Punctuation and Sentence Structure',
  'Punctuation: Semicolons vs. Colons vs. Dashes',
  'Subject-Verb Agreement with Intervening Phrases',
  'Logical Transitions & Signal Words',
  'Dangling & Misplaced Modifiers',
  'Words in Context',
  'Boundaries',
  'Form, Structure, and Sense',
  'Rhetorical Synthesis',
  'Inferences',
  'Command of Evidence',
  'Grammar & Conventions'
];

for (const q of rwQueries) {
  const cat = inferTestCategory(q);
  assert(cat === 'Reading and Writing', `Inference failed for RW query "${q}", got: ${cat}`);
}

const mathQueries = [
  'Systems of Linear Equations (Solutions Count)',
  'Quadratic Vertex Form & Discriminant',
  'Percent Increase / Decrease Multipliers',
  'Circle Standard Equation in Coordinate Plane',
  'Linear equations in one variable',
  'Linear equations in two variables',
  'Nonlinear functions',
  'Percentages and Proportions',
  'Lines, angles, and triangles',
  'Trigonometry',
  'Hard Math Masterclass'
];

for (const q of mathQueries) {
  const cat = inferTestCategory(q);
  assert(cat === 'Math', `Inference failed for Math query "${q}", got: ${cat}`);
}

// 2. Reading & Writing Sprint Drill
console.log('2. Testing Reading & Writing Sprint Drill...');
for (let i = 0; i < 20; i++) {
  const rwSprint = selectReadingWritingSprintQuestions(allQuestions, 6);
  assert(rwSprint.length === 6, `Expected 6 questions, got ${rwSprint.length}`);
  for (const q of rwSprint) {
    assert(
      q.test === 'Reading and Writing',
      `FATAL: Math question leaked into Reading & Writing Sprint! ID: ${q.id}, Domain: ${q.domain}, Test: ${q.test}`
    );
  }
  const domains = new Set(rwSprint.map((q) => q.domain));
  assert(domains.size >= 2, `Expected multi-domain diversity in R&W Sprint, got ${domains.size} domains`);
}

// 3. Level 3 Hard Math Masterclass Drill
console.log('3. Testing Hard Math Masterclass Drill...');
for (let i = 0; i < 20; i++) {
  const hardMath = selectHardMathQuestions(allQuestions, 6);
  assert(hardMath.length === 6, `Expected 6 questions, got ${hardMath.length}`);
  for (const q of hardMath) {
    assert(q.test === 'Math', `Non-math question in Hard Math drill: ${q.id}`);
    assert(q.difficulty === 'Hard', `Non-hard question in Hard Math drill: ${q.id}, difficulty: ${q.difficulty}`);
  }
}

// 4. Timed Speed Simulation Drills
console.log('4. Testing Timed Speed Simulation Drills...');
const mathSpeed = selectTimedSpeedDrillQuestions(allQuestions, 'Math', 8);
assert(mathSpeed.length === 8, `Expected 8 questions in Math speed, got ${mathSpeed.length}`);
assert(mathSpeed.every((q) => q.test === 'Math'), 'Non-math question in Math speed simulation');

const rwSpeed = selectTimedSpeedDrillQuestions(allQuestions, 'Reading and Writing', 8);
assert(rwSpeed.length === 8, `Expected 8 questions in RW speed, got ${rwSpeed.length}`);
assert(rwSpeed.every((q) => q.test === 'Reading and Writing'), 'Non-RW question in Reading speed simulation');

// 5. Skill & Cheat Sheet Topic Drills
console.log('5. Testing Skill & Cheat Sheet Topic Drills...');
const rwSkillQueries = [
  'Punctuation and Sentence Structure',
  'Punctuation: Semicolons vs. Colons vs. Dashes',
  'Subject-Verb Agreement with Intervening Phrases',
  'Logical Transitions & Signal Words',
  'Dangling & Misplaced Modifiers',
  'Words in Context',
  'Boundaries',
  'Form, Structure, and Sense'
];

for (const query of rwSkillQueries) {
  const res = selectSkillDrillQuestions(allQuestions, query);
  assert(res.test === 'Reading and Writing', `Expected RW test for "${query}", got ${res.test}`);
  assert(res.questions.length > 0, `No questions returned for "${query}"`);
  for (const q of res.questions) {
    assert(q.test === 'Reading and Writing', `Leaked Math question into "${query}": ID ${q.id}`);
  }
}

const mathSkillQueries = [
  'Systems of Linear Equations (Solutions Count)',
  'Quadratic Vertex Form & Discriminant',
  'Percent Increase / Decrease Multipliers',
  'Circle Standard Equation in Coordinate Plane',
  'Linear equations in two variables',
  'Nonlinear functions'
];

for (const query of mathSkillQueries) {
  const res = selectSkillDrillQuestions(allQuestions, query);
  assert(res.test === 'Math', `Expected Math test for "${query}", got ${res.test}`);
  assert(res.questions.length > 0, `No questions returned for "${query}"`);
  for (const q of res.questions) {
    assert(q.test === 'Math', `Leaked RW question into "${query}": ID ${q.id}`);
  }
}

// 6. Adaptive Daily Sprint
console.log('6. Testing Adaptive Daily Sprint (Dual-Subject Balance)...');
for (let i = 0; i < 20; i++) {
  const daily = selectDailySprintQuestions(allQuestions, 5);
  assert(daily.length === 5, `Expected 5 questions in Daily Sprint, got ${daily.length}`);
  const mCount = daily.filter((q) => q.test === 'Math').length;
  const rwCount = daily.filter((q) => q.test === 'Reading and Writing').length;
  assert(mCount >= 1 && rwCount >= 1, `Daily sprint must be dual-subject: Math=${mCount}, RW=${rwCount}`);
}

// 7. Weak Spot & Missed Drills
console.log('7. Testing Weak Spot & Missed Drills...');
const weakList = [
  { skill: 'Boundaries', domain: 'Standard English Conventions' },
  { skill: 'Nonlinear functions', domain: 'Advanced Math' }
];
const weakDrill = selectWeaknessDrillQuestions(allQuestions, weakList, 5);
assert(weakDrill.length === 5, `Expected 5 weakness questions, got ${weakDrill.length}`);
for (const q of weakDrill) {
  const matched = weakList.some((w) => w.skill === q.skill || w.domain === q.domain);
  assert(matched, `Weakness drill question did not match target skills: ${q.id}`);
}

const targetMissed = [allQuestions[1].id, allQuestions[5].id, allQuestions[20].id];
const missedDrill = selectMissedDrillQuestions(allQuestions, targetMissed);
assert(missedDrill.length === 3, `Expected 3 missed questions, got ${missedDrill.length}`);

console.log(`\n🎉 SUCCESS: All ${passed}/${total} Smart Drill subject-boundary & regression tests passed!`);
