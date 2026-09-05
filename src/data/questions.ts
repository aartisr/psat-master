import { Question, FilterCriteria } from '../types';
import { psatMathQuestionsPart1 } from './psatMathQuestions1';
import { psatMathQuestionsPart2 } from './psatMathQuestions2';
import { psatReadingQuestions } from './psatReadingQuestions';

export const initialQuestions: Question[] = [
  ...psatMathQuestionsPart1,
  ...psatMathQuestionsPart2,
  ...psatReadingQuestions
];

export function searchQuestions(
  questions: Question[],
  criteria: Partial<FilterCriteria>
): { results: Question[]; searchTimeMs: number } {
  const startTime = performance.now();

  const query = (criteria.query || '').trim().toLowerCase();
  const assessment = criteria.assessment;
  const test = criteria.test;
  const domain = criteria.domain;
  const skill = criteria.skill;
  const difficulty = criteria.difficulty;

  // Split query terms for intelligent multi-term and concept intersection
  const terms = query ? query.split(/\s+/).filter(Boolean) : [];

  const results = questions.filter((q) => {
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

    // 6. Sub-second Intelligent Search Query matching
    if (terms.length > 0) {
      const searchTarget = [
        q.id,
        q.prompt,
        q.rationale,
        q.skill,
        q.domain,
        q.test,
        q.assessment,
        q.difficulty,
        ...(q.concepts || []),
        ...(q.options ? q.options.map((o) => o.text) : []),
        ...(q.hints ? q.hints.map((h) => h.hint + ' ' + h.title) : [])
      ]
        .join(' ')
        .toLowerCase();

      // Check if all terms or concept keywords match
      const allTermsMatch = terms.every((term) => {
        // Concept synonyms / aliases
        if (term === 'slope' && (searchTarget.includes('slope') || searchTarget.includes('rate of change') || searchTarget.includes('m ='))) {
          return true;
        }
        if (term === 'intercept' && (searchTarget.includes('intercept') || searchTarget.includes('y-intercept') || searchTarget.includes('x-intercept'))) {
          return true;
        }
        if (term === 'system' && (searchTarget.includes('system') || searchTarget.includes('substitution') || searchTarget.includes('elimination'))) {
          return true;
        }
        if (term === 'inequality' && (searchTarget.includes('inequalit') || searchTarget.includes('≤') || searchTarget.includes('≥') || searchTarget.includes('<') || searchTarget.includes('>'))) {
          return true;
        }
        if (term === 'table' && (searchTarget.includes('table') || q.tableData)) {
          return true;
        }
        if (term === 'graph' && (searchTarget.includes('graph') || searchTarget.includes('xy-plane') || q.graphConfig)) {
          return true;
        }
        return searchTarget.includes(term);
      });

      if (!allTermsMatch) return false;
    }

    return true;
  });

  // Sort results
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

  const endTime = performance.now();
  const searchTimeMs = Math.round((endTime - startTime) * 10) / 10;

  return { results, searchTimeMs };
}

export function findRelatedQuestions(currentQuestion: Question, allQuestions: Question[], limit: number = 4): Question[] {
  return allQuestions
    .filter((q) => q.id !== currentQuestion.id)
    .map((q) => {
      let score = 0;
      if (q.skill === currentQuestion.skill) score += 5;
      if (q.domain === currentQuestion.domain) score += 3;
      if (q.difficulty === currentQuestion.difficulty) score += 2;
      
      const commonConcepts = q.concepts.filter((c) => currentQuestion.concepts.includes(c));
      score += commonConcepts.length * 2;

      return { question: q, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.question);
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
