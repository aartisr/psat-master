import assert from 'assert';
import { repairQuestion } from './questionAuditor';
import { Question } from '../types';

console.log('🧪 Running Question Auditor & Rationale Format Regression Tests...\n');

try {
  // Test Case 1: Preserve paragraphs with newlines
  const mockQuestion1: Question = {
    id: 'test_q1',
    assessment: 'PSAT/NMSQT',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Mock prompt',
    correctAnswer: 'A',
    rationale: 'Choice A is correct. Paragraph 1.\n\nChoice B is incorrect. Paragraph 2.\n\nChoice C is incorrect. Paragraph 3.',
    hints: [],
    concepts: []
  };

  const repaired1 = repairQuestion(mockQuestion1);
  console.log('✅ Test Case 1: Preserving double newlines in rationale');
  assert.ok(repaired1.rationale.includes('\n\nChoice B is incorrect.'), 'Should preserve paragraph double newlines.');
  assert.ok(repaired1.rationale.includes('\n\nChoice C is incorrect.'), 'Should preserve paragraph double newlines.');

  // Test Case 2: Auto-splitting squashed paragraph text
  const mockQuestion2: Question = {
    id: 'test_q2',
    assessment: 'PSAT/NMSQT',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Mock prompt',
    correctAnswer: 'D',
    rationale: 'Choice D is correct. Since x represents the segments. Choice A is incorrect and may result from errors. Choice B is incorrect. Choice C is incorrect. Question Difficulty: Hard',
    hints: [],
    concepts: []
  };

  const repaired2 = repairQuestion(mockQuestion2);
  console.log('✅ Test Case 2: Auto-splitting squashed paragraph descriptions');
  assert.ok(repaired2.rationale.includes('\n\nChoice A is incorrect'), 'Should auto-insert double newlines before Choice A.');
  assert.ok(repaired2.rationale.includes('\n\nChoice B is incorrect'), 'Should auto-insert double newlines before Choice B.');
  assert.ok(repaired2.rationale.includes('\n\nChoice C is incorrect'), 'Should auto-insert double newlines before Choice C.');
  assert.ok(repaired2.rationale.includes('\n\nQuestion Difficulty:'), 'Should auto-insert double newlines before Question Difficulty.');

  // Test Case 3: Balancing math delimiters and preserving text content
  const mockQuestion3: Question = {
    id: 'test_q3',
    assessment: 'PSAT/NMSQT',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Mock prompt with math $3x + y = 10',
    correctAnswer: 'A',
    rationale: 'The math expression $3x + y = 10 is balanced.',
    hints: [],
    concepts: []
  };

  const repaired3 = repairQuestion(mockQuestion3);
  console.log('✅ Test Case 3: Balancing mismatched LaTeX math delimiters');
  assert.strictEqual(repaired3.prompt, 'Mock prompt with math $3x + y = 10$', 'Should automatically close unbalanced math delimiter.');
  assert.strictEqual(repaired3.rationale, 'The math expression $3x + y = 10 is balanced.$', 'Should automatically append balancing math delimiter.');

  console.log('\n🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY! ZERO REGRESSIONS FOUND.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ REGRESSION TEST SUITE FAILED:', error);
  process.exit(1);
}
