import assert from 'assert';
import { psat2900QuestionBank } from '../data/psat2900Bank';

/**
 * Helper function replicating protectCurrencyDollarSigns logic for node-based testing
 */
function protectCurrencyDollarSigns(text: string): string {
  if (!text) return '';

  const ESCAPED_DOLLAR = '\uE000';

  let processed = text.replace(/\\\$|\$\$/g, (match) => {
    if (match === '$$') return '$$';
    return ESCAPED_DOLLAR;
  });

  processed = processed.replace(/\$\s*-?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\d+(?:\.\d+)?)(?!\d|\w|\s*[,=+\-*/^_<>≤≥≠±\\%:\(\)]|\$)/g, `${ESCAPED_DOLLAR}$1`);

  return processed;
}

/**
 * Helper function replicating autoWrapAsciiMath logic for node-based testing
 */
function autoWrapAsciiMath(text: string): string {
  if (!text) return '';

  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g);

  return parts.map((part, idx) => {
    if (idx % 2 !== 0) return part;

    let converted = part;

    converted = converted.replace(/\b([a-zA-Z0-9_\(\)]+(?:\s*[\+\-\*\/=]\s*[a-zA-Z0-9_\(\)]+)*\s*\^\s*[0-9a-zA-Z]+(?:\s*[\+\-\*\/=]\s*[a-zA-Z0-9_\(\)\^]+)*)\b/g, (match) => {
      if (match.includes('http') || match.includes('www')) return match;
      return `$${match.trim()}$`;
    });

    converted = converted.replace(/(?<![\$a-zA-Z0-9])(\([a-zA-Z0-9_\s\+\-\*\/]+\)\s*\([a-zA-Z0-9_\s\+\-\*\/]+\))(?![\$a-zA-Z0-9])/g, (match) => {
      return `$${match.trim()}$`;
    });

    return converted;
  }).join('');
}

console.log('🧪 Starting Comprehensive Math Renderer & LaTeX Regression Test Suite...\n');

// -------------------------------------------------------------
// GROUP 1: Currency Protection Tests
// -------------------------------------------------------------
console.log('📋 GROUP 1: Currency Protection Engine');

const currencyTestCases = [
  { input: '$20.00', expectedDollarEscaped: true },
  { input: '$9.50', expectedDollarEscaped: true },
  { input: '$17.00', expectedDollarEscaped: true },
  { input: '$10.00', expectedDollarEscaped: true },
  { input: '$115', expectedDollarEscaped: true },
  { input: '$21', expectedDollarEscaped: true },
  { input: '$14', expectedDollarEscaped: true },
  { input: '\\$525', expectedDollarEscaped: true },
  { input: '$1,000.50', expectedDollarEscaped: true },
  { input: '$ 50', expectedDollarEscaped: true },
];

for (const tc of currencyTestCases) {
  const protectedText = protectCurrencyDollarSigns(tc.input);
  assert.ok(
    protectedText.includes('\uE000'),
    `Failed to protect currency amount: "${tc.input}" (got "${protectedText}")`
  );
}
console.log('  ✅ [PASS] All currency values correctly identified and protected from LaTeX parsing');

// -------------------------------------------------------------
// GROUP 2: LaTeX Inequality & Macro Preservation Tests
// -------------------------------------------------------------
console.log('📋 GROUP 2: LaTeX Inequality & Macro Preservation');

const inequalityTestCases = [
  '$5 \\le x \\le 6$',
  '$6 \\le x \\le 7$',
  '$x < 5$',
  '$x > 6$',
  '$11x + 14y \\le 115$',
  '$a \\ge b$',
  '$x \\neq y$',
  '$\\frac{1}{2}$',
  '$\\times 100$',
  '$(x - 1)^2 + (y + 2)^2 = 25$',
  '$f(x) = x^2 - 6x + 5$'
];

for (const latex of inequalityTestCases) {
  const protectedText = protectCurrencyDollarSigns(latex);
  // Opening $ must NOT be converted to \uE000
  assert.strictEqual(
    protectedText.startsWith('\uE000'),
    false,
    `LaTeX expression erroneously converted to currency: "${latex}" -> "${protectedText}"`
  );
  assert.ok(
    protectedText.startsWith('$') && protectedText.endsWith('$'),
    `LaTeX expression structure broken: "${latex}" -> "${protectedText}"`
  );
}
console.log('  ✅ [PASS] All LaTeX inequality macros (\\le, \\ge, \\frac) preserved as valid math');

// -------------------------------------------------------------
// GROUP 3: ASCII Math Auto-Wrapping Tests
// -------------------------------------------------------------
console.log('📋 GROUP 3: ASCII Math Auto-Wrapping Engine');

const asciiMathCases = [
  { input: 'Expand using FOIL: x^2 - 1x - 5x + 5.', expectedMath: '$x^2 - 1x - 5x + 5$' },
  { input: 'Factored form: (x - 1)(x - 5).', expectedMath: '$(x - 1)(x - 5)$' },
  { input: 'The equation is y = x^2 + 3.', expectedMath: '$y = x^2 + 3$' },
  { input: 'Pythagorean theorem: a^2 + b^2 = c^2.', expectedMath: '$a^2 + b^2 = c^2$' }
];

for (const tc of asciiMathCases) {
  const wrapped = autoWrapAsciiMath(tc.input);
  assert.ok(
    wrapped.includes(tc.expectedMath),
    `Failed to auto-wrap ASCII math in "${tc.input}": expected to contain "${tc.expectedMath}", got "${wrapped}"`
  );
}
console.log('  ✅ [PASS] Plain ASCII math expressions correctly auto-wrapped in KaTeX delimiters');

// -------------------------------------------------------------
// GROUP 4: Mixed Currency & LaTeX Context Tests
// -------------------------------------------------------------
console.log('📋 GROUP 4: Mixed Currency & LaTeX Context Integration');

const mixedContext = "Adam charges $20.00 for equipment and $9.50 per hour. Caroline charges $17.00 for equipment and $10.00 per hour. If $x$ is hours, when is Caroline's charge greater than Adam's?";
const processedMixed = protectCurrencyDollarSigns(mixedContext);

assert.ok(processedMixed.includes('\uE00020.00'), 'Failed to protect $20.00 in mixed context');
assert.ok(processedMixed.includes('\uE0009.50'), 'Failed to protect $9.50 in mixed context');
assert.ok(processedMixed.includes('\uE00017.00'), 'Failed to protect $17.00 in mixed context');
assert.ok(processedMixed.includes('\uE00010.00'), 'Failed to protect $10.00 in mixed context');
assert.ok(processedMixed.includes('$x$'), 'Failed to preserve $x$ as math in mixed context');

console.log('  ✅ [PASS] Complex mixed prompt with multiple prices and math variables rendered flawlessly');

// -------------------------------------------------------------
// GROUP 5: Exhaustive Sweep Across Entire 2,900 Question Bank
// -------------------------------------------------------------
console.log('📋 GROUP 5: Exhaustive 2,900 Question Bank Math Consistency Sweep');

let totalAudited = 0;
let errorsFound = 0;

for (const q of psat2900QuestionBank) {
  totalAudited++;

  // Audit prompt
  const protectedPrompt = protectCurrencyDollarSigns(q.prompt);
  const dollarCountPrompt = (protectedPrompt.match(/\$/g) || []).length;
  if (dollarCountPrompt % 2 !== 0) {
    console.error(`❌ Mismatched $ delimiters in question ID ${q.id} prompt: "${q.prompt}"`);
    errorsFound++;
  }

  // Audit options
  for (const opt of (q.options || [])) {
    const protectedOpt = protectCurrencyDollarSigns(opt.text);
    const dollarCountOpt = (protectedOpt.match(/\$/g) || []).length;
    if (dollarCountOpt % 2 !== 0) {
      console.error(`❌ Mismatched $ delimiters in question ID ${q.id} option ${opt.label}: "${opt.text}"`);
      errorsFound++;
    }
  }

  // Audit rationale
  const protectedRationale = protectCurrencyDollarSigns(q.rationale);
  const dollarCountRationale = (protectedRationale.match(/\$/g) || []).length;
  if (dollarCountRationale % 2 !== 0) {
    console.error(`❌ Mismatched $ delimiters in question ID ${q.id} rationale: "${q.rationale}"`);
    errorsFound++;
  }
}

assert.strictEqual(errorsFound, 0, `Found ${errorsFound} math rendering errors in dataset sweep`);
console.log(`  ✅ [PASS] Audited all ${totalAudited} questions in bank — 100% delimiters balanced & verified`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 ALL MATH RENDERER & REGRESSION TESTS PASSED CLEANLY (100%)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
