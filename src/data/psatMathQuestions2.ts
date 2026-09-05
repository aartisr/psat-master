import { Question } from '../types';

export const psatMathQuestionsPart2: Question[] = [
  {
    id: 'cacf0929',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'What is the slope of the graph of $y = \\frac{1}{4}(27x + 15) + 7x$ in the $xy$-plane?',
    correctAnswer: '55/4',
    acceptedAnswers: ['55/4', '13.75'],
    rationale: "The correct answer is 55/4 (or 13.75). Distribute $\\frac{1}{4}$: $y = \\frac{27}{4}x + \\frac{15}{4} + 7x$. Combine x coefficients: $\\frac{27}{4} + \\frac{28}{4} = \\frac{55}{4}$. Thus, the slope $m$ is $\\frac{55}{4}$.",
    hints: [
      { level: 1, title: 'Distribute the Fraction', hint: 'Multiply $\\frac{1}{4}$ into $(27x + 15)$.' },
      { level: 2, title: 'Combine Like Terms', hint: 'Add $\\frac{27}{4}x + 7x = \\frac{27}{4}x + \\frac{28}{4}x$.' },
      { level: 3, title: 'Extract Slope', hint: '$\\frac{27 + 28}{4} = \\frac{55}{4}$ or 13.75.' }
    ],
    concepts: ['slope', 'linear equations', 'distributive property', 'combining fractions']
  },
  {
    id: '87277ccb',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'If $\\frac{x + 6}{3} = \\frac{x + 6}{13}$, the value of $x + 6$ is between which of the following pairs of values?',
    options: [
      { label: 'A', text: '-7 and -3' },
      { label: 'B', text: '-2 and 2' },
      { label: 'C', text: '2 and 7' },
      { label: 'D', text: '8 and 13' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. Let $u = x + 6$. The equation is $\\frac{u}{3} = \\frac{u}{13}$. Cross multiplying gives $13u = 3u \\implies 10u = 0 \\implies u = 0$. Since $u = 0$, $x + 6 = 0$, which lies between $-2$ and $2$.",
    hints: [
      { level: 1, title: 'Substitute Expression', hint: 'Notice the quantity $(x + 6)$ appears on both sides. Let $u = x + 6$.' },
      { level: 2, title: 'Solve for u', hint: '$\\frac{u}{3} = \\frac{u}{13} \\implies 13u = 3u \\implies 10u = 0 \\implies u = 0$.' },
      { level: 3, title: 'Check Intervals', hint: '0 is between $-2$ and $2$, matching Choice B.' }
    ],
    concepts: ['linear equations', 'algebraic reasoning', 'intervals', 'zero solution']
  },
  {
    id: 'c1ed2e87',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The functions f and g model the number of participants, in thousands, in two different programs x years since 2010. The graphs of y = f(x) and y = g(x) intersect at (11, 11). One line has y-intercept (0, 13) and the other has y-intercept (0, 7). Which of the following could represent functions f and g?',
    graphConfig: {
      type: 'system',
      xRange: [0, 16],
      yRange: [0, 16],
      xStep: 2,
      yStep: 2,
      xLabel: 'Years since 2010',
      yLabel: 'Participants (thousands)',
      lines: [
        { points: [[0, 13], [11, 11], [16, 10.1]], color: '#dc2626', label: 'f(x)' },
        { points: [[0, 7], [11, 11], [16, 12.8]], color: '#2563eb', label: 'g(x)' }
      ],
      points: [[0, 13], [0, 7], [11, 11]]
    },
    options: [
      { label: 'A', text: '$f(x) = -\\frac{1}{11}x + 13$\n$g(x) = \\frac{2}{11}x + 7$' },
      { label: 'B', text: '$f(x) = -\\frac{4}{11}x + 7$\n$g(x) = \\frac{2}{11}x + 13$' },
      { label: 'C', text: '$f(x) = -\\frac{2}{11}x + 13$\n$g(x) = \\frac{4}{11}x + 7$' },
      { label: 'D', text: '$f(x) = -\\frac{2}{11}x + 7$\n$g(x) = \\frac{4}{11}x + 13$' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. For line $f$ passing through $(0, 13)$ and $(11, 11)$: slope $= \\frac{11 - 13}{11 - 0} = -\\frac{2}{11}$, y-intercept $= 13 \\implies f(x) = -\\frac{2}{11}x + 13$. For line $g$ passing through $(0, 7)$ and $(11, 11)$: slope $= \\frac{11 - 7}{11 - 0} = \\frac{4}{11}$, y-intercept $= 7 \\implies g(x) = \\frac{4}{11}x + 7$.",
    hints: [
      { level: 1, title: 'Find Slope for f(x)', hint: 'Calculate slope between $(0, 13)$ and $(11, 11)$: $\\frac{11 - 13}{11 - 0} = -\\frac{2}{11}$.' },
      { level: 2, title: 'Find Slope for g(x)', hint: 'Calculate slope between $(0, 7)$ and $(11, 11)$: $\\frac{11 - 7}{11 - 0} = \\frac{4}{11}$.' },
      { level: 3, title: 'Match Equations', hint: '$f(x) = -\\frac{2}{11}x + 13$ and $g(x) = \\frac{4}{11}x + 7$.' }
    ],
    concepts: ['systems of equations', 'graphical models', 'slope calculation', 'linear functions']
  },
  {
    id: '4820d38d',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The given system of equations is:\n\n$y = 3x + 9$\n$3y = 8x - 6$\n\nThe solution to the given system of equations is $(x, y)$. What is the value of $x - y$?',
    options: [
      { label: 'A', text: '-123' },
      { label: 'B', text: '-33' },
      { label: 'C', text: '3' },
      { label: 'D', text: '57' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Substitute $y = 3x + 9$ into the second equation: $3(3x + 9) = 8x - 6 \\implies 9x + 27 = 8x - 6 \\implies x = -33$. Then $y = 3(-33) + 9 = -99 + 9 = -90$. The value of $x - y = -33 - (-90) = 57$.",
    hints: [
      { level: 1, title: 'Substitute y into Second Equation', hint: '$3(3x + 9) = 8x - 6$.' },
      { level: 2, title: 'Solve for x and y', hint: '$9x + 27 = 8x - 6 \\implies x = -33$. $y = 3(-33) + 9 = -90$.' },
      { level: 3, title: 'Calculate x - y', hint: '$x - y = -33 - (-90) = -33 + 90 = 57$.' }
    ],
    concepts: ['systems of linear equations', 'substitution method', 'difference expression']
  },
  {
    id: '8aa7b0ea',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'The table gives the coordinates of two points on a line in the xy-plane: $(k, 13)$ and $(k + 7, -15)$. The y-intercept of the line is $(k - 5, b)$, where $k$ and $b$ are constants. What is the value of $b$?',
    tableData: {
      headers: ['x', 'y'],
      rows: [
        ['k', 13],
        ['k + 7', -15]
      ]
    },
    correctAnswer: '33',
    acceptedAnswers: ['33'],
    rationale: "The correct answer is 33. The slope of the line is $m = \\frac{-15 - 13}{(k + 7) - k} = -\\frac{28}{7} = -4$. Using the slope with point $(k, 13)$ and y-intercept $(k - 5, b)$: $m = \\frac{13 - b}{k - (k - 5)} \\implies -4 = \\frac{13 - b}{5} \\implies -20 = 13 - b \\implies b = 33$.",
    hints: [
      { level: 1, title: 'Calculate Slope with Constant k', hint: '$m = \\frac{-15 - 13}{k + 7 - k} = -\\frac{28}{7} = -4$. Notice $k$ cancels!' },
      { level: 2, title: 'Set up Slope with Third Point', hint: 'Slope between $(k - 5, b)$ and $(k, 13)$: $\\frac{13 - b}{k - (k - 5)} = \\frac{13 - b}{5}$.' },
      { level: 3, title: 'Solve for b', hint: '$\\frac{13 - b}{5} = -4 \\implies 13 - b = -20 \\implies b = 33$.' }
    ],
    concepts: ['slope', 'linear equations', 'algebraic cancellation', 'y-intercept']
  },
  {
    id: '087283ab',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'In the xy-plane, the graph of the linear function f contains the points $(0, 2)$ and $(8, 34)$. Which equation defines $f$, where $y = f(x)$?',
    options: [
      { label: 'A', text: '$f(x) = 2x + 42$' },
      { label: 'B', text: '$f(x) = 32x + 36$' },
      { label: 'C', text: '$f(x) = 4x + 2$' },
      { label: 'D', text: '$f(x) = 8x + 2$' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. The y-intercept is $(0, 2)$ so $b = 2$. The slope $m = \\frac{34 - 2}{8 - 0} = \\frac{32}{8} = 4$. Thus $f(x) = 4x + 2$.",
    hints: [
      { level: 1, title: 'Identify y-intercept', hint: 'The point $(0, 2)$ gives y-intercept $b = 2$.' },
      { level: 2, title: 'Calculate Slope', hint: '$m = \\frac{34 - 2}{8 - 0} = \\frac{32}{8} = 4$.' },
      { level: 3, title: 'Assemble Function', hint: '$f(x) = 4x + 2$.' }
    ],
    concepts: ['linear functions', 'slope-intercept', 'points on graph']
  },
  {
    id: '90381488',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear inequalities in one or two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'Anthony will spend at most $115 to purchase x small cheese pizzas and y large cheese pizzas for a team dinner. The given inequality represents this situation:\n\n$11x + 14y \\le 115$\n\nWhich of the following is the best interpretation of $14y$ in this context?',
    options: [
      { label: 'A', text: 'The amount, in dollars, Anthony will spend on each large cheese pizza' },
      { label: 'B', text: 'The amount, in dollars, Anthony will spend on each small cheese pizza' },
      { label: 'C', text: 'The total amount, in dollars, Anthony will spend on large cheese pizzas' },
      { label: 'D', text: 'The total amount, in dollars, Anthony will spend on small cheese pizzas' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. Here $y$ is the number of large pizzas and $14$ is the price per large pizza. The product $14y$ represents the total dollar amount spent on all large cheese pizzas.",
    hints: [
      { level: 1, title: 'Break Down Term 14y', hint: '14 is the unit price of large pizza, and $y$ is the quantity of large pizzas.' },
      { level: 2, title: 'Unit Analysis', hint: '($14 / pizza) × ($y$ pizzas) = total dollars spent on large pizzas.' },
      { level: 3, title: 'Select Match', hint: 'Choice C accurately specifies total dollars on large pizzas.' }
    ],
    concepts: ['inequalities', 'algebraic interpretation', 'modeling', 'word problems']
  },
  {
    id: '88de8eeb',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'For groups of 25 or more people, a museum charges $21 per person for the first 25 people and $14 for each additional person. Which function f gives the total charge, in dollars, for a tour group with n people, where $n \\ge 25$?',
    options: [
      { label: 'A', text: '$f(n) = 14n + 175$' },
      { label: 'B', text: '$f(n) = 14n + 525$' },
      { label: 'C', text: '$f(n) = 35n - 350$' },
      { label: 'D', text: '$f(n) = 14n + 21$' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. For $n \\ge 25$, the first 25 people cost $21(25) = $525$. The remaining $(n - 25)$ people cost $14(n - 25)$. Total $f(n) = 525 + 14n - 350 = 14n + 175$.",
    hints: [
      { level: 1, title: 'Split into Two Groups', hint: 'Group 1: 25 people @ $21 = $525. Group 2: $(n - 25)$ people @ $14.' },
      { level: 2, title: 'Write Expression', hint: '$f(n) = 25(21) + 14(n - 25) = 525 + 14n - 350$.' },
      { level: 3, title: 'Simplify', hint: '$f(n) = 14n + 175$.' }
    ],
    concepts: ['piecewise/linear function', 'cost function', 'word problems', 'simplification']
  },
  {
    id: '82ba8114',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'In the xy-plane, line $\\ell$ passes through the points $(0, 9)$ and $(1, 17)$. Which equation defines line $\\ell$?',
    options: [
      { label: 'A', text: '$y = \\frac{1}{8}x + 9$' },
      { label: 'B', text: '$y = x + \\frac{1}{8}$' },
      { label: 'C', text: '$y = x + 8$' },
      { label: 'D', text: '$y = 8x + 9$' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. The y-intercept is $(0, 9)$ so $b = 9$. Slope $m = \\frac{17 - 9}{1 - 0} = 8$. Thus, $y = 8x + 9$.",
    hints: [
      { level: 1, title: 'Find y-intercept', hint: 'Point $(0, 9)$ gives $b = 9$.' },
      { level: 2, title: 'Find Slope', hint: '$m = \\frac{17 - 9}{1 - 0} = \\frac{8}{1} = 8$.' },
      { level: 3, title: 'Form Equation', hint: '$y = 8x + 9$.' }
    ],
    concepts: ['slope-intercept', 'linear equations', 'coordinate geometry']
  },
  {
    id: '019d6a10',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'What value of t is the solution to the given equation?\n\n$5(t + 3) - 7(t + 3) = 38$',
    correctAnswer: '-22',
    acceptedAnswers: ['-22'],
    rationale: "The correct answer is -22. Combine like terms: $-2(t + 3) = 38 \\implies t + 3 = -19 \\implies t = -22$.",
    hints: [
      { level: 1, title: 'Combine Like Terms', hint: '$5(t + 3) - 7(t + 3) = -2(t + 3)$.' },
      { level: 2, title: 'Divide by -2', hint: '$t + 3 = \\frac{38}{-2} = -19$.' },
      { level: 3, title: 'Isolate t', hint: '$t = -19 - 3 = -22$.' }
    ],
    concepts: ['linear equations', 'combining like terms', 'single variable']
  },
  {
    id: '891af74b',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The graph models the relationship between the number of T-shirts, x, and the number of sweatshirts, y, that Kira can purchase for a school fundraiser. The line passes through $(0, 35)$ and $(90, 0)$. Which equation could represent this relationship?',
    graphConfig: {
      type: 'line',
      xRange: [0, 100],
      yRange: [0, 50],
      xStep: 20,
      yStep: 10,
      xLabel: 'Number of T-shirts (x)',
      yLabel: 'Number of sweatshirts (y)',
      lines: [
        { points: [[0, 35], [90, 0]], color: '#0f172a', label: 'Budget Line' }
      ],
      points: [[0, 35], [90, 0]]
    },
    options: [
      { label: 'A', text: '$y = 7x + 18$' },
      { label: 'B', text: '$7x + 18y = 630$' },
      { label: 'C', text: '$y = 18x + 7$' },
      { label: 'D', text: '$18x + 7y = 630$' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. Intercepts are $(0, 35)$ and $(90, 0)$. Slope $m = \\frac{0 - 35}{90 - 0} = -\\frac{35}{90} = -\\frac{7}{18}$. Equation: $y = -\\frac{7}{18}x + 35 \\implies 18y = -7x + 630 \\implies 7x + 18y = 630$.",
    hints: [
      { level: 1, title: 'Calculate Slope', hint: '$m = \\frac{0 - 35}{90 - 0} = -\\frac{35}{90} = -\\frac{7}{18}$.' },
      { level: 2, title: 'Write in Slope-Intercept', hint: '$y = -\\frac{7}{18}x + 35$.' },
      { level: 3, title: 'Convert to Standard Form', hint: 'Multiply by 18: $18y = -7x + 630 \\implies 7x + 18y = 630$.' }
    ],
    concepts: ['standard form', 'intercepts', 'budget constraint', 'coordinate graphs']
  },
  {
    id: '3fe4f440',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'Ellen bought two types of snack bags for a school event. Each box of chips Ellen bought contained 24 bags and cost $11. Each box of crackers Ellen bought contained 16 bags and cost $9. It cost Ellen $497 before tax to buy 968 bags. If x is the number of boxes of chips and y is the number of boxes of crackers that Ellen bought, which of the following systems of equations represents this situation?',
    options: [
      { label: 'A', text: '$11x + 16y = 968$\n$24x + 9y = 497$' },
      { label: 'B', text: '$11x + 9y = 968$\n$24x + 16y = 497$' },
      { label: 'C', text: '$11x + 9y = 497$\n$24x + 16y = 968$' },
      { label: 'D', text: '$9x + 11y = 497$\n$16x + 24y = 968$' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. Total bag count: 24 bags/box × $x$ + 16 bags/box × $y$ = 968 bags ($24x + 16y = 968$). Total cost: $11 × $x$ + $9 × $y$ = $497 ($11x + 9y = 497$).",
    hints: [
      { level: 1, title: 'Cost Equation', hint: 'Chips cost $11/box and crackers $9/box, total $497 $\\implies 11x + 9y = 497$.' },
      { level: 2, title: 'Bags Equation', hint: '24 bags/box for chips and 16 bags/box for crackers, total 968 $\\implies 24x + 16y = 968$.' },
      { level: 3, title: 'Identify Matching System', hint: 'Choice C matches both equations perfectly.' }
    ],
    concepts: ['systems of equations', 'translating word problems', 'algebraic modeling']
  },
  {
    id: '804081ee',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'In the given system of equations, p is a constant:\n\n$6 + 7r = pw$\n$7r - 5w = 5w + 11$\n\nIf the system has no solution, what is the value of p?',
    correctAnswer: '10',
    acceptedAnswers: ['10'],
    rationale: "The correct answer is 10. From equation 1: $7r = pw - 6$. From equation 2: $7r = 10w + 11$. Equating $7r$ yields $pw - 6 = 10w + 11 \\implies (p - 10)w = 17$. For there to be no solution in $w$, the coefficient $(p - 10)$ must be $0$, so $p = 10$.",
    hints: [
      { level: 1, title: 'Isolate 7r in both equations', hint: 'Eq 1: $7r = pw - 6$. Eq 2: $7r = 10w + 11$.' },
      { level: 2, title: 'Equate the Expressions', hint: '$pw - 6 = 10w + 11 \\implies pw - 10w = 17 \\implies (p - 10)w = 17$.' },
      { level: 3, title: 'Condition for No Solution', hint: '$0 \\cdot w = 17$ has no solution, meaning $p - 10 = 0 \\implies p = 10$.' }
    ],
    concepts: ['no solution systems', 'parallel lines', 'linear algebra', 'constants']
  },
  {
    id: 'b4b0cd06',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'How many solutions does the given equation have?\n\n$-49x = -98x$',
    options: [
      { label: 'A', text: 'Zero' },
      { label: 'B', text: 'Exactly one' },
      { label: 'C', text: 'Exactly two' },
      { label: 'D', text: 'Infinitely many' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. Adding $98x$ to both sides yields $49x = 0 \\implies x = 0$. There is exactly one unique solution, which is $x = 0$.",
    hints: [
      { level: 1, title: 'Add 98x to Both Sides', hint: '$-49x + 98x = 0$.' },
      { level: 2, title: 'Simplify', hint: '$49x = 0$.' },
      { level: 3, title: 'Determine Number of Solutions', hint: '$x = 0$ is one valid unique solution.' }
    ],
    concepts: ['number of solutions', 'linear equations', 'zero root']
  },
  {
    id: 'a79871f4',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The given equations represent the possible numbers of beach chairs, x, and umbrellas, y, rented at a park last month and the total spent, in dollars, to rent those beach chairs and umbrellas:\n\n$x + y = 53$\n$11x + 18y = 730$\n\nWhich of the following descriptions matches the correct graph of this system?',
    options: [
      { label: 'A', text: 'Two lines: one passing through (0, 0) and (53, 53); the other through (0, 40.6) and (66.4, 0)' },
      { label: 'B', text: 'Two lines: one with intercepts (0, 53) and (53, 0); the other with intercepts at approximately (0, 40.6) and (66.4, 0)' },
      { label: 'C', text: 'Two lines: one with intercepts (0, 53) and (53, 0); the other with positive slope and y-intercept (0, 40.6)' },
      { label: 'D', text: 'Two lines: one horizontal line at y = 53; the other with intercepts at (0, 40.6) and (66.4, 0)' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. For $x + y = 53$, setting $x=0$ gives $y=53$, setting $y=0$ gives $x=53$. For $11x + 18y = 730$, setting $x=0$ gives $y = \\frac{730}{18} \\approx 40.56$, and setting $y=0$ gives $x = \\frac{730}{11} \\approx 66.36$. Graph B shows these two downward-sloping lines with exactly these intercepts.",
    hints: [
      { level: 1, title: 'Find Intercepts of x + y = 53', hint: 'x-int = $(53, 0)$, y-int = $(0, 53)$.' },
      { level: 2, title: 'Find Intercepts of 11x + 18y = 730', hint: 'x-int: $\\frac{730}{11} \\approx 66.4$. y-int: $\\frac{730}{18} \\approx 40.6$.' },
      { level: 3, title: 'Match Graph Description', hint: 'Choice B describes both lines with negative slopes and their precise intercepts.' }
    ],
    concepts: ['graphing systems', 'intercepts', 'linear equations', 'visual modeling']
  }
];
