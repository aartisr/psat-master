import { Question, FilterCriteria } from '../types';
import { psat2900QuestionBank } from './psat2900Bank';
import { normalizeQuestionBank } from '../utils/answerEvaluator';

export const initialQuestions: Question[] = normalizeQuestionBank(psat2900QuestionBank);

function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        tmp[i][j] = tmp[i - 1][j - 1];
      } else {
        tmp[i][j] = Math.min(
          tmp[i - 1][j - 1] + 1, // substitution
          tmp[i][j - 1] + 1,     // insertion
          tmp[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return tmp[a.length][b.length];
}

function hasFuzzyMatch(term: string, words: string[]): boolean {
  if (term.length < 4) return false;
  const maxDistance = term.length <= 5 ? 1 : 2;
  for (const word of words) {
    if (word.length < 4) continue;
    if (Math.abs(word.length - term.length) > maxDistance) continue;
    if (getLevenshteinDistance(term, word) <= maxDistance) {
      return true;
    }
  }
  return false;
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s$]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const SYNONYMS: Record<string, string[]> = {
  'slope': ['slope', 'rate of change', 'constant of proportionality', 'change in y', 'm ='],
  'intercept': ['intercept', 'y-intercept', 'x-intercept', 'crosses the', 'c =', 'b ='],
  'system': ['system', 'substitution', 'elimination', 'intersection', 'two equations'],
  'systems': ['system', 'substitution', 'elimination', 'intersection', 'two equations'],
  'inequality': ['inequal', '≤', '≥', '<', '>', 'shaded region', 'inequalities'],
  'inequalities': ['inequal', '≤', '≥', '<', '>', 'shaded region', 'inequalities'],
  'solution': ['solution', 'solve', 'value of x', 'value of y'],
  'solutions': ['solution', 'solve', 'value of x', 'value of y'],
  'no': ['no solution', 'parallel', 'same slope', 'different intercept'],
  'infinite': ['infinite', 'infinitely many', 'same line', 'coincident'],
  'graph': ['graph', 'xy-plane', 'coordinate', 'plot', 'axis', 'axes', 'parabola'],
  'table': ['table', 'values', 'f(x)'],
  'word': ['word problem', 'represents', 'modeled', 'situation', 'context'],
  'words': ['word problem', 'represents', 'modeled', 'situation', 'context'],
};

const SEARCH_META_CACHE = new WeakMap<Question, {
  idLower: string;
  promptLower: string;
  rationaleLower: string;
  skillLower: string;
  domainLower: string;
  conceptsLower: string[];
  hintsText: string;
  optionsText: string;
  searchTargetCombined: string;
  promptWords: string[];
  skillWords: string[];
  conceptWords: string[];
}>();

function getQuestionSearchMeta(q: Question) {
  let meta = SEARCH_META_CACHE.get(q);
  if (!meta) {
    const idLower = (q.id || '').toLowerCase();
    const promptLower = (q.prompt || '').toLowerCase();
    const rationaleLower = (q.rationale || '').toLowerCase();
    const skillLower = (q.skill || '').toLowerCase();
    const domainLower = (q.domain || '').toLowerCase();
    const conceptsLower = (q.concepts || []).map(c => c.toLowerCase());
    const hintsText = (q.hints || []).map(h => (h.hint + ' ' + h.title).toLowerCase()).join(' ');
    const optionsText = (q.options || []).map(o => o.text.toLowerCase()).join(' ');

    const searchTargetCombined = [
      idLower,
      promptLower,
      rationaleLower,
      skillLower,
      domainLower,
      ...conceptsLower,
      hintsText,
      optionsText
    ].join(' ');

    meta = {
      idLower,
      promptLower,
      rationaleLower,
      skillLower,
      domainLower,
      conceptsLower,
      hintsText,
      optionsText,
      searchTargetCombined,
      promptWords: extractWords(promptLower),
      skillWords: extractWords(skillLower),
      conceptWords: conceptsLower.flatMap(c => extractWords(c))
    };
    SEARCH_META_CACHE.set(q, meta);
  }
  return meta;
}

export function calculateRelevanceScore(q: Question, queryStr: string): number {
  let score = 0;
  const normalizedQuery = queryStr.toLowerCase().trim();
  if (!normalizedQuery) return 0;

  const meta = getQuestionSearchMeta(q);

  // 1. Check full exact query string match
  if (meta.searchTargetCombined.includes(normalizedQuery)) {
    score += 150;
    if (meta.conceptsLower.some(c => c.includes(normalizedQuery))) {
      score += 100;
    }
    if (meta.skillLower.includes(normalizedQuery)) {
      score += 80;
    }
    if (meta.promptLower.includes(normalizedQuery)) {
      score += 50;
    }
  }

  // 2. Tokenize query and calculate term-based score
  const IGNORED_STOP_WORDS = new Set(['of', 'and', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'by', 'with', 'from', '&', 'or', 'about']);
  const rawTerms = normalizedQuery.split(/[\s,]+/);
  let terms = rawTerms.filter(t => !IGNORED_STOP_WORDS.has(t) && t.length > 0);
  if (terms.length === 0) {
    terms = rawTerms.filter(t => t.length > 0);
  }

  if (terms.length === 0) return score;

  let termsMatchedCount = 0;

  for (const term of terms) {
    let termMatched = false;

    // A. Check Synonyms
    const synonymList = SYNONYMS[term];
    if (synonymList) {
      for (const syn of synonymList) {
        if (meta.searchTargetCombined.includes(syn)) {
          score += 35;
          termMatched = true;
        }
      }
    }

    // B. Check exact substring matches in fields
    if (meta.idLower.includes(term)) {
      score += 100;
      termMatched = true;
    }
    
    if (meta.conceptsLower.some(c => c === term)) {
      score += 80;
      termMatched = true;
    } else if (meta.conceptsLower.some(c => c.includes(term))) {
      score += 40;
      termMatched = true;
    }

    if (meta.skillLower === term) {
      score += 70;
      termMatched = true;
    } else if (meta.skillLower.includes(term)) {
      score += 35;
      termMatched = true;
    }

    if (meta.domainLower === term) {
      score += 40;
      termMatched = true;
    } else if (meta.domainLower.includes(term)) {
      score += 20;
      termMatched = true;
    }

    if (meta.promptLower.includes(term)) {
      score += 15;
      termMatched = true;
    }

    if (meta.rationaleLower.includes(term)) {
      score += 8;
      termMatched = true;
    }

    if (meta.hintsText.includes(term) || meta.optionsText.includes(term)) {
      score += 4;
      termMatched = true;
    }

    // C. Check Fuzzy Matching
    if (!termMatched && term.length >= 4) {
      const fuzzyInConcepts = hasFuzzyMatch(term, meta.conceptWords);
      const fuzzyInSkill = hasFuzzyMatch(term, meta.skillWords);
      const fuzzyInPrompt = hasFuzzyMatch(term, meta.promptWords);

      if (fuzzyInConcepts) {
        score += 30;
        termMatched = true;
      }
      if (fuzzyInSkill) {
        score += 25;
        termMatched = true;
      }
      if (fuzzyInPrompt) {
        score += 10;
        termMatched = true;
      }
    }

    if (termMatched) {
      termsMatchedCount++;
    }
  }

  // Bonus for matching all non-stop-word query terms
  if (termsMatchedCount === terms.length && terms.length > 1) {
    score += 80;
  } else if (termsMatchedCount > 0) {
    score += (termsMatchedCount / terms.length) * 40;
  }

  return score;
}

const SEARCH_CACHE = new Map<string, Question[]>();

export function invalidateSearchCache() {
  SEARCH_CACHE.clear();
  RELATED_CACHE.clear();
}

export function searchQuestions(
  questions: Question[],
  criteria: Partial<FilterCriteria>
): { results: Question[]; searchTimeMs: number } {
  const startTime = performance.now();

  const cacheKey = JSON.stringify({
    qLen: questions.length,
    query: criteria.query || '',
    assessment: criteria.assessment || '',
    test: criteria.test || '',
    domain: criteria.domain || '',
    skill: criteria.skill || '',
    difficulty: criteria.difficulty || '',
    status: criteria.status || '',
    sortBy: criteria.sortBy || ''
  });

  if (SEARCH_CACHE.has(cacheKey)) {
    const cached = SEARCH_CACHE.get(cacheKey)!;
    const searchTimeMs = Math.round((performance.now() - startTime) * 10) / 10;
    return { results: cached, searchTimeMs };
  }

  const query = (criteria.query || '').trim().toLowerCase();
  const assessment = criteria.assessment;
  const test = criteria.test;
  const domain = criteria.domain;
  const skill = criteria.skill;
  const difficulty = criteria.difficulty;

  let results = questions.filter((q) => {
    // 1. Assessment Filter
    if (assessment && assessment !== 'all' && q.assessment !== assessment) {
      return false;
    }

    // 2. Test Filter
    if (test && test !== 'all' && q.test !== test) {
      return false;
    }

    // 3. Domain Filter
    if (domain && domain !== 'all' && q.domain !== domain) {
      return false;
    }

    // 4. Skill Filter
    if (skill && skill !== 'all' && q.skill !== skill) {
      return false;
    }

    // 5. Difficulty Filter
    if (difficulty && difficulty !== 'all' && q.difficulty !== difficulty) {
      return false;
    }

    return true;
  });

  if (query) {
    const scoredResults = results
      .map((q) => {
        const score = calculateRelevanceScore(q, query);
        return { question: q, score };
      })
      .filter((item) => item.score > 0);

    if (criteria.sortBy === 'relevance' || !criteria.sortBy) {
      scoredResults.sort((a, b) => b.score - a.score);
    }

    results = scoredResults.map((item) => item.question);
  } else {
    if (criteria.sortBy === 'relevance') {
      results.sort((a, b) => a.id.localeCompare(b.id));
    }
  }

  // Handle other sorting methods
  if (criteria.sortBy === 'difficulty_asc') {
    const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
    results.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
  } else if (criteria.sortBy === 'difficulty_desc') {
    const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
    results.sort((a, b) => (diffOrder[b.difficulty] || 2) - (diffOrder[a.difficulty] || 2));
  } else if (criteria.sortBy === 'skill') {
    results.sort((a, b) => a.skill.localeCompare(b.skill));
  } else if (criteria.sortBy === 'id') {
    results.sort((a, b) => a.id.localeCompare(b.id));
  }

  SEARCH_CACHE.set(cacheKey, results);
  // Cap search cache to 200 items to keep memory slim
  if (SEARCH_CACHE.size > 200) {
    const firstKey = SEARCH_CACHE.keys().next().value;
    if (firstKey) SEARCH_CACHE.delete(firstKey);
  }

  const endTime = performance.now();
  const searchTimeMs = Math.round((endTime - startTime) * 10) / 10;

  return { results, searchTimeMs };
}

const RELATED_CACHE = new Map<string, Question[]>();

export function findRelatedQuestions(currentQuestion: Question, allQuestions: Question[], limit: number = 4): Question[] {
  const cacheKey = `${currentQuestion.id}_${limit}_${allQuestions.length}`;
  if (RELATED_CACHE.has(cacheKey)) {
    return RELATED_CACHE.get(cacheKey)!;
  }

  // Candidates filter: prioritize same domain or skill
  const candidates = allQuestions.filter(q => q.id !== currentQuestion.id && (q.domain === currentQuestion.domain || q.skill === currentQuestion.skill));
  const pool = candidates.length >= limit ? candidates : allQuestions.filter(q => q.id !== currentQuestion.id);

  const results = pool
    .map((q) => {
      let score = 0;
      if (q.skill === currentQuestion.skill) score += 5;
      if (q.domain === currentQuestion.domain) score += 3;
      if (q.difficulty === currentQuestion.difficulty) score += 2;
      
      for (let i = 0; i < q.concepts.length; i++) {
        if (currentQuestion.concepts.includes(q.concepts[i])) {
          score += 2;
        }
      }

      return { question: q, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.question);

  RELATED_CACHE.set(cacheKey, results);
  return results;
}

export const DOMAINS_BY_TEST: Record<string, string[]> = {
  Math: [
    'Algebra',
    'Advanced Math',
    'Problem-Solving and Data Analysis',
    'Geometry and Trigonometry'
  ],
  'Reading and Writing': [
    'Information and Ideas',
    'Craft and Structure',
    'Expression of Ideas',
    'Standard English Conventions'
  ]
};

export const SKILLS_BY_DOMAIN: Record<string, string[]> = {
  Algebra: [
    'Linear equations in one variable',
    'Linear equations in two variables',
    'Linear functions',
    'Systems of two linear equations in two variables',
    'Linear inequalities in one or two variables'
  ],
  'Advanced Math': [
    'Nonlinear functions',
    'Equivalent expressions',
    'Nonlinear equations in one variable and systems of equations in two variables'
  ],
  'Problem-Solving and Data Analysis': [
    'Ratios, rates, proportional relationships, and units',
    'Percentages and Proportions',
    'One-variable data: distributions and measures of center and spread',
    'Two-variable data: models and scatterplots',
    'Probability and conditional probability'
  ],
  'Geometry and Trigonometry': [
    'Lines, angles, and triangles',
    'Right triangles and trigonometry',
    'Circles',
    'Area and volume'
  ],
  'Information and Ideas': [
    'Central Ideas and Details',
    'Inferences',
    'Command of Evidence'
  ],
  'Craft and Structure': [
    'Words in Context',
    'Text Structure and Purpose',
    'Cross-Text Connections',
    'Transitions'
  ],
  'Expression of Ideas': [
    'Rhetorical Synthesis',
    'Transitions'
  ],
  'Standard English Conventions': [
    'Boundaries',
    'Form, Structure, and Sense'
  ]
};
