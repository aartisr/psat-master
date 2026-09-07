import { Question } from '../types';

/**
 * Deterministically or randomly shuffles an array without mutating the original.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determines whether a skill or keyword belongs to 'Reading and Writing' or 'Math'.
 */
export function inferTestCategory(query: string): 'Reading and Writing' | 'Math' | null {
  const q = query.toLowerCase();
  
  const rwPhrases = [
    'reading and writing', 'reading & writing', 'reading', 'writing', 'r&w',
    'form, structure, and sense', 'standard english conventions', 'information and ideas',
    'craft and structure', 'expression of ideas', 'rhetorical synthesis', 'command of evidence',
    'central ideas', 'words in context', 'cross-text connections', 'text structure and purpose',
    'punctuation', 'semicolon', 'colon', 'dash', 'comma', 'boundary', 'boundaries',
    'sentence structure', 'modifier', 'subject-verb', 'verb tense', 'pronoun', 'transition',
    'rhetoric', 'vocabulary', 'inference', 'inferences', 'grammar'
  ];

  const mathPhrases = [
    'math', 'algebra', 'advanced math', 'geometry and trigonometry', 'geometry',
    'trigonometry', 'problem-solving and data analysis', 'linear equations',
    'systems of linear equations', 'systems of two linear equations', 'linear functions',
    'linear inequalities', 'nonlinear functions', 'equivalent expressions',
    'nonlinear equations', 'quadratic', 'vertex', 'discriminant', 'parabola',
    'percentages and proportions', 'percent', 'percentage', 'ratio', 'proportion',
    'one-variable data', 'two-variable data', 'scatterplots', 'probability',
    'lines, angles, and triangles', 'right triangles', 'circle', 'circles',
    'area and volume', 'slope', 'y-intercept', 'polynomial', 'exponent', 'radical'
  ];

  let rwScore = 0;
  let mathScore = 0;

  for (const phrase of rwPhrases) {
    if (q.includes(phrase)) {
      rwScore += phrase.includes(' ') ? 3 : 1;
    }
  }

  for (const phrase of mathPhrases) {
    if (q.includes(phrase)) {
      mathScore += phrase.includes(' ') ? 3 : 1;
    }
  }

  if (rwScore > mathScore) return 'Reading and Writing';
  if (mathScore > rwScore) return 'Math';
  return null;
}

/**
 * 1. ADAPTIVE DAILY SPRINT (5 Questions)
 * Returns a balanced mix: 3 Math + 2 Reading or 2 Math + 3 Reading,
 * spanning diverse domains and difficulties.
 */
export function selectDailySprintQuestions(allQuestions: Question[], count = 5): Question[] {
  if (allQuestions.length === 0) return [];

  const mathQuestions = shuffleArray(allQuestions.filter((q) => q.test === 'Math'));
  const rwQuestions = shuffleArray(allQuestions.filter((q) => q.test === 'Reading and Writing'));

  // Target 3 Math + 2 RW (or balanced if pool is small)
  const mathTarget = Math.min(Math.ceil(count / 2), mathQuestions.length);
  const rwTarget = Math.min(count - mathTarget, rwQuestions.length);

  const selectedMath = mathQuestions.slice(0, mathTarget);
  const selectedRw = rwQuestions.slice(0, rwTarget);

  const combined = shuffleArray([...selectedMath, ...selectedRw]);
  if (combined.length < count) {
    // Fill remainder from whatever questions are left
    const remaining = shuffleArray(allQuestions.filter((q) => !combined.some((c) => c.id === q.id)));
    combined.push(...remaining.slice(0, count - combined.length));
  }

  return combined.slice(0, count);
}

/**
 * 2. READING & WRITING SPRINT
 * Exclusively selects Reading and Writing questions spanning multiple domains:
 * Standard English Conventions, Craft and Structure, Information and Ideas, Expression of Ideas.
 */
export function selectReadingWritingSprintQuestions(allQuestions: Question[], count = 6): Question[] {
  const rwPool = allQuestions.filter((q) => q.test === 'Reading and Writing');
  if (rwPool.length === 0) {
    console.warn('[drillSelector] No Reading and Writing questions found in repository!');
    return [];
  }

  // Group by domain for rich variety
  const byDomain: Record<string, Question[]> = {};
  for (const q of rwPool) {
    if (!byDomain[q.domain]) byDomain[q.domain] = [];
    byDomain[q.domain].push(q);
  }

  const selected: Question[] = [];
  const domainKeys = Object.keys(byDomain);

  // Round-robin selection across domains
  let round = 0;
  while (selected.length < count && round < 10) {
    for (const d of domainKeys) {
      if (selected.length >= count) break;
      const domainQs = byDomain[d];
      if (domainQs && domainQs.length > round) {
        // Pick a random question from this domain
        const available = domainQs.filter((q) => !selected.some((s) => s.id === q.id));
        if (available.length > 0) {
          selected.push(available[Math.floor(Math.random() * available.length)]);
        }
      }
    }
    round++;
  }

  // If still need more, fill from shuffled pool
  if (selected.length < count) {
    const remaining = shuffleArray(rwPool.filter((q) => !selected.some((s) => s.id === q.id)));
    selected.push(...remaining.slice(0, count - selected.length));
  }

  return shuffleArray(selected).slice(0, count);
}

/**
 * 3. HARD MATH MASTERCLASS
 * Exclusively selects Level 3 Hard Math questions.
 */
export function selectHardMathQuestions(allQuestions: Question[], count = 6): Question[] {
  const hardMathPool = allQuestions.filter((q) => q.test === 'Math' && q.difficulty === 'Hard');
  const allMathPool = allQuestions.filter((q) => q.test === 'Math');

  const poolToUse = hardMathPool.length >= count ? hardMathPool : (hardMathPool.length > 0 ? hardMathPool : allMathPool);

  return shuffleArray(poolToUse).slice(0, count);
}

/**
 * 4. TIMED SPEED SIMULATION
 * Strictly filters to the requested test ('Math' | 'Reading and Writing').
 */
export function selectTimedSpeedDrillQuestions(
  allQuestions: Question[],
  test: 'Math' | 'Reading and Writing',
  count = 8
): Question[] {
  const testPool = allQuestions.filter((q) => q.test === test);
  if (testPool.length === 0) {
    return shuffleArray(allQuestions).slice(0, count);
  }
  return shuffleArray(testPool).slice(0, count);
}

/**
 * 5. TOPIC / SKILL MASTERY DRILL
 * Intelligently maps any skill name, domain, cheat sheet title, or keyword
 * to matching questions while STRICTLY enforcing subject boundary (Math vs. Reading and Writing).
 */
export function selectSkillDrillQuestions(
  allQuestions: Question[],
  skillOrQuery: string,
  category?: 'Math' | 'Reading and Writing',
  count = 5
): { questions: Question[]; resolvedTitle: string; test: 'Math' | 'Reading and Writing' } {
  const cleanQuery = skillOrQuery.trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // 1. Determine target test category
  const targetTest: 'Math' | 'Reading and Writing' =
    category || inferTestCategory(lowerQuery) || 'Math';

  // 2. Filter pool strictly to target test
  const testPool = allQuestions.filter((q) => q.test === targetTest);
  const fallbackPool = testPool.length > 0 ? testPool : allQuestions;

  // 3. Multi-tier matching within testPool
  // Tier 1: Exact skill match
  let matched = testPool.filter((q) => q.skill.toLowerCase() === lowerQuery);

  // Tier 2: Substring / token match on skill or domain
  if (matched.length === 0) {
    matched = testPool.filter((q) => {
      const qSkill = q.skill.toLowerCase();
      const qDomain = q.domain.toLowerCase();
      return (
        qSkill.includes(lowerQuery) ||
        lowerQuery.includes(qSkill) ||
        qDomain.includes(lowerQuery) ||
        lowerQuery.includes(qDomain)
      );
    });
  }

  // Tier 3: Keyword token matching
  if (matched.length === 0) {
    const tokens = lowerQuery
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 3 && !['with', 'from', 'into', 'what', 'rule', 'math', 'reading', 'writing'].includes(t));

    if (tokens.length > 0) {
      matched = testPool.filter((q) => {
        const textToSearch = `${q.skill} ${q.domain} ${(q.concepts || []).join(' ')} ${q.prompt}`.toLowerCase();
        return tokens.some((token) => textToSearch.includes(token));
      });
    }
  }

  // Tier 4: Domain synonym mappings for specific common triggers
  if (matched.length === 0) {
    if (targetTest === 'Reading and Writing') {
      if (lowerQuery.includes('punct') || lowerQuery.includes('semicolon') || lowerQuery.includes('colon') || lowerQuery.includes('dash') || lowerQuery.includes('modifier') || lowerQuery.includes('sentence')) {
        matched = testPool.filter((q) => q.domain === 'Standard English Conventions');
      } else if (lowerQuery.includes('transition') || lowerQuery.includes('logic') || lowerQuery.includes('rhetor')) {
        matched = testPool.filter((q) => q.domain === 'Expression of Ideas' || q.domain === 'Craft and Structure');
      } else if (lowerQuery.includes('vocab') || lowerQuery.includes('word') || lowerQuery.includes('context')) {
        matched = testPool.filter((q) => q.domain === 'Craft and Structure');
      }
    } else {
      if (lowerQuery.includes('linear') || lowerQuery.includes('system') || lowerQuery.includes('slope')) {
        matched = testPool.filter((q) => q.domain === 'Algebra');
      } else if (lowerQuery.includes('quadratic') || lowerQuery.includes('vertex') || lowerQuery.includes('parabola') || lowerQuery.includes('nonlinear')) {
        matched = testPool.filter((q) => q.domain === 'Advanced Math');
      } else if (lowerQuery.includes('percent') || lowerQuery.includes('ratio') || lowerQuery.includes('data')) {
        matched = testPool.filter((q) => q.domain === 'Problem-Solving and Data Analysis');
      } else if (lowerQuery.includes('circle') || lowerQuery.includes('triangle') || lowerQuery.includes('geometry')) {
        matched = testPool.filter((q) => q.domain === 'Geometry and Trigonometry');
      }
    }
  }

  // Tier 5: Fallback within the SAME test category (NEVER cross Math/Reading boundary)
  const finalCandidates = matched.length > 0 ? matched : fallbackPool;
  const selected = shuffleArray(finalCandidates).slice(0, count);

  return {
    questions: selected,
    resolvedTitle: cleanQuery,
    test: targetTest
  };
}

/**
 * 6. WEAK SPOT REMEDIATION DRILL
 * Targets student's lowest-accuracy skills.
 */
export function selectWeaknessDrillQuestions(
  allQuestions: Question[],
  weakestSkills: { skill: string; domain?: string }[],
  count = 5
): Question[] {
  if (weakestSkills.length === 0) {
    return selectDailySprintQuestions(allQuestions, count);
  }

  const candidatePool: Question[] = [];
  for (const item of weakestSkills) {
    const matching = allQuestions.filter((q) => 
      q.skill.toLowerCase() === item.skill.toLowerCase() ||
      (item.domain && q.domain.toLowerCase() === item.domain.toLowerCase())
    );
    candidatePool.push(...matching);
  }

  if (candidatePool.length === 0) {
    return selectDailySprintQuestions(allQuestions, count);
  }

  // Deduplicate and shuffle
  const uniqueMap = new Map<string, Question>();
  for (const q of candidatePool) {
    uniqueMap.set(q.id, q);
  }

  const unique = Array.from(uniqueMap.values());
  return shuffleArray(unique).slice(0, count);
}

/**
 * 7. MISSED QUESTION MARATHON
 */
export function selectMissedDrillQuestions(
  allQuestions: Question[],
  missedIds: string[]
): Question[] {
  if (missedIds.length === 0) return [];
  const idSet = new Set(missedIds);
  const missed = allQuestions.filter((q) => idSet.has(q.id));
  return shuffleArray(missed);
}
