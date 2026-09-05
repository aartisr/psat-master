import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ChevronRight, Zap, Award, Layers } from 'lucide-react';
import { MathText } from './common/MathRenderer';

interface CheatCard {
  id: string;
  category: 'Math' | 'Reading and Writing';
  title: string;
  coreRule: string;
  formulaOrPattern: string;
  example: string;
  trapToAvoid: string;
  proTip: string;
}

const CHEAT_SHEETS: CheatCard[] = [
  {
    id: 'math-linear-systems',
    category: 'Math',
    title: 'Systems of Linear Equations (Solutions Count)',
    coreRule: 'Compare slopes ($m$) and y-intercepts ($b$) in $y = mx + b$.',
    formulaOrPattern: '• 1 Solution: Different slopes ($m_1 \\neq m_2$)\n• No Solution: Same slope, different y-intercept ($m_1 = m_2, b_1 \\neq b_2$)\n• Infinitely Many: Identical equations ($m_1 = m_2, b_1 = b_2$)',
    example: '$2x + 4y = 8$ and $x + 2y = 4$ are identical multiples $\\rightarrow$ Infinite solutions.',
    trapToAvoid: 'Forgetting to normalize equations into standard or slope-intercept form before matching coefficients.',
    proTip: 'If lines have no solution, set their slopes equal and cross-multiply.'
  },
  {
    id: 'math-quadratics-vertex',
    category: 'Math',
    title: 'Quadratic Vertex Form & Discriminant',
    coreRule: 'Vertex $(h, k)$ reveals maximum/minimum value. Discriminant determines real root count.',
    formulaOrPattern: '$y = a(x - h)^2 + k$\nVertex x-coordinate: $x_v = -\\frac{b}{2a}$\nDiscriminant: $\\Delta = b^2 - 4ac$ ($\\Delta > 0 \\rightarrow 2$ roots, $\\Delta = 0 \\rightarrow 1$ root, $\\Delta < 0 \\rightarrow 0$ roots)',
    example: 'For $y = 2(x - 3)^2 + 5$, the minimum value is $5$, occurring at $x = 3$.',
    trapToAvoid: 'Misidentifying the sign of $h$: in $(x - 3)^2$, $h = +3$, not $-3$.',
    proTip: 'On Digital PSAT, you can quickly plug quadratics into the built-in Desmos graphing tool to find vertices!'
  },
  {
    id: 'math-percent-change',
    category: 'Math',
    title: 'Percent Increase / Decrease Multipliers',
    coreRule: 'Never add or subtract raw percentages sequentially; multiply growth factors.',
    formulaOrPattern: '• $p\\%$ Increase: Multiplier $= 1 + \\frac{p}{100}$\n• $p\\%$ Decrease: Multiplier $= 1 - \\frac{p}{100}$\nPercent Change $= \\frac{\\text{New} - \\text{Old}}{\\text{Old}} \\times 100\\%$',
    example: '$20\\%$ increase followed by $20\\%$ decrease is $1.20 \\times 0.80 = 0.96$ ($4\\%$ net decrease, not $0\\%$).',
    trapToAvoid: 'Dividing by the new value instead of the original initial value in the denominator.',
    proTip: 'For successive discounts, multiply the factors: e.g., $15\\%$ off then $10\\%$ off $= 0.85 \\times 0.90 = 0.765$ (pay $76.5\\%$).'
  },
  {
    id: 'math-circle-equations',
    category: 'Math',
    title: 'Circle Standard Equation in Coordinate Plane',
    coreRule: 'Standard form gives center $(h, k)$ and radius $r$.',
    formulaOrPattern: '$(x - h)^2 + (y - k)^2 = r^2$\nIf expanded ($x^2 + y^2 + Dx + Ey + F = 0$), complete the square for $x$ and $y$.',
    example: '$(x + 4)^2 + (y - 1)^2 = 25 \\rightarrow$ Center is $(-4, 1)$, Radius is $\\sqrt{25} = 5$.',
    trapToAvoid: 'Confusing $r^2$ with $r$. If the right side is $36$, the radius is $6$, not $36$!',
    proTip: 'Center coordinate signs are flipped from the parenthetical terms.'
  },
  {
    id: 'rw-semicolons-colons',
    category: 'Reading and Writing',
    title: 'Punctuation: Semicolons vs. Colons vs. Dashes',
    coreRule: 'Semicolons connect two independent clauses. Colons require a complete sentence BEFORE.',
    formulaOrPattern: '• Semicolon (;) = Period (.) = Comma + FANBOYS [Independent; Independent]\n• Colon (:) = [Complete Sentence] : [Explanation / List / Emphasis]\n• Single Dash (—) = functions like a colon\n• Pair of Dashes (— ... —) = non-essential clause (like commas or parentheses)',
    example: 'Correct: "The experiment succeeded: all three test groups showed cell recovery."',
    trapToAvoid: 'Using a colon after verbs or prepositions (e.g., "The supplies include: pens..." is INCORRECT).',
    proTip: 'If two answer choices are grammatically identical (e.g., one has a period, the other has a semicolon), BOTH are usually wrong!'
  },
  {
    id: 'rw-subject-verb',
    category: 'Reading and Writing',
    title: 'Subject-Verb Agreement with Intervening Phrases',
    coreRule: 'Cross out prepositional phrases and non-essential clauses between subject and verb.',
    formulaOrPattern: '[Singular Subject] + (prepositional phrase) + [Singular Verb (-s)]\n[Plural Subject] + (prepositional phrase) + [Plural Verb (no -s)]',
    example: '"The discovery of ancient fossil footprints [suggests] human presence." (Subject is "discovery", singular).',
    trapToAvoid: 'Matching the verb to the nearest noun ("footprints") instead of the true head subject ("discovery").',
    proTip: 'Cross out everything from the preposition ("of", "in", "with", "by", "for") to the noun object.'
  },
  {
    id: 'rw-transitions',
    category: 'Reading and Writing',
    title: 'Logical Transitions & Signal Words',
    coreRule: 'Identify the exact logical relationship between sentence 1 and sentence 2.',
    formulaOrPattern: '• Contrast: However, Nevertheless, On the other hand, Conversely\n• Cause & Effect: Therefore, Consequently, As a result, Thus\n• Continuation / Addition: Furthermore, Moreover, In addition\n• Exemplification: For instance, Specifically, In particular',
    example: 'Sentence 1 states a challenge; Sentence 2 solves it $\\rightarrow$ Use a contrast transition like "However" or "Nonetheless".',
    trapToAvoid: 'Relying on how the word "sounds". Always check if ideas are in agreement, opposition, or causation.',
    proTip: 'Read the two sentences without any transition first, decide "Is this surprising (+/-) or expected (+/+)?" then pick.'
  },
  {
    id: 'rw-dangling-modifiers',
    category: 'Reading and Writing',
    title: 'Dangling & Misplaced Modifiers',
    coreRule: 'An introductory modifying phrase MUST immediately precede the noun doing the action.',
    formulaOrPattern: '[Introductory -ing/-ed Phrase], [Subject doing the action] + [Verb]...',
    example: 'Incorrect: "Walking into the lab, the beaker was broken by Maya."\nCorrect: "Walking into the lab, Maya broke the beaker."',
    trapToAvoid: 'Passive voice placed right after the introductory modifier ("the beaker" was not walking).',
    proTip: 'Look at the very first word after the comma: Ask yourself "Can this specific noun physically do the intro action?"'
  }
];

export const ConceptCheatSheets: React.FC<{ onLaunchSkillDrill: (skill: string) => void }> = ({
  onLaunchSkillDrill
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Math' | 'Reading and Writing'>('All');
  const [activeCard, setActiveCard] = useState<CheatCard | null>(null);

  const filtered = CHEAT_SHEETS.filter(
    (c) => selectedCategory === 'All' || c.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-900/60 rounded-md text-xs font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-700/50">
              High-Yield Knowledge Base
            </span>
            <span className="text-xs text-slate-400">Digital PSAT / SAT Standards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Concept Mastery Cheat Sheets</h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Essential formulas, punctuation rules, College Board traps, and time-saving shortcuts for 99th percentile test takers.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
          {(['All', 'Math', 'Reading and Writing'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filtered.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    card.category === 'Math'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {card.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">Rule</span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {card.title}
              </h2>

              <div className="text-xs text-slate-600 font-medium leading-relaxed">
                <MathText text={card.coreRule} />
              </div>

              {/* Formula / Pattern Box */}
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs sm:text-sm text-indigo-950 font-medium whitespace-pre-line leading-relaxed">
                <MathText text={card.formulaOrPattern} />
              </div>

              {/* Example & Trap */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-emerald-950">
                  <span className="font-bold text-emerald-800">Example: </span>
                  <MathText text={card.example} />
                </div>
                <div className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-lg text-rose-950">
                  <span className="font-bold text-rose-800">Common Trap: </span>
                  <MathText text={card.trapToAvoid} />
                </div>
              </div>
            </div>

            {/* Pro Tip Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-xs"><MathText text={card.proTip} /></span>
              </div>
              <button
                onClick={() => onLaunchSkillDrill(card.title)}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shrink-0"
              >
                <span>Drill Topic</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
