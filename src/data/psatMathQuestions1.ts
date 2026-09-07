import { Question } from '../types';

export const psatMathQuestionsPart1: Question[] = [
  {
    id: 'bb93e1bd',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The equations in the system are:\n\n$y = -\\frac{1}{9}x$\n$y = \\frac{1}{2}x$\n\nThe solution to the given system of equations is $(x, y)$. What is the value of $x$?',
    options: [
      { label: 'A', text: '-9' },
      { label: 'B', text: '-7' },
      { label: 'C', text: '0' },
      { label: 'D', text: '2' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. It's given by the first equation in the system that $y = -\\frac{1}{9}x$. Substituting $-\\frac{1}{9}x$ for $y$ in the second equation yields $-\\frac{1}{9}x = \\frac{1}{2}x$. Adding $\\frac{1}{9}x$ to both sides yields $0 = \\frac{1}{2}x + \\frac{1}{9}x = \\frac{11}{18}x$. Multiplying both sides by $\\frac{18}{11}$ yields $x = 0$.",
    hints: [
      { level: 1, title: 'Substitution Method', hint: 'Set the two expressions for y equal to each other since both equal y.' },
      { level: 2, title: 'Equate the Equations', hint: '$-\\frac{1}{9}x = \\frac{1}{2}x$. Move all x terms to one side.' },
      { level: 3, title: 'Solve for x', hint: '$0 = \\frac{11}{18}x$, which implies $x$ must be $0$.' }
    ],
    concepts: ['systems of equations', 'substitution', 'linear equations', 'zero product']
  },
  {
    id: '769dc33f',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'For the linear function g, the table shows four values of x and their corresponding values of g(x). The function can be written as g(x) = mx + b, where m and b are constants. What is the value of b?',
    tableData: {
      headers: ['x', 'g(x)'],
      rows: [
        [1, 54],
        [2, 51],
        [3, 48],
        [4, 45]
      ]
    },
    options: [
      { label: 'A', text: '3' },
      { label: 'B', text: '27' },
      { label: 'C', text: '54' },
      { label: 'D', text: '57' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Find the slope m = (51 - 54)/(2 - 1) = -3. Then substitute (1, 54) into g(x) = mx + b: 54 = -3(1) + b => b = 54 + 3 = 57.",
    hints: [
      { level: 1, title: 'Find the Rate of Change (Slope)', hint: 'Calculate m = (g(x2) - g(x1)) / (x2 - x1) from the table values.' },
      { level: 2, title: 'Calculate Slope', hint: 'm = (51 - 54) / (2 - 1) = -3 / 1 = -3.' },
      { level: 3, title: 'Solve for y-intercept b', hint: 'Use g(1) = 54: 54 = -3(1) + b => b = 57.' }
    ],
    concepts: ['linear functions', 'slope', 'y-intercept', 'table analysis', 'rate of change']
  },
  {
    id: '09fe8373',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear inequalities in one or two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'To complete a landscaping project, Adam charges a fee of $20.00 for his equipment and $9.50 per hour spent working on the project. To complete this same landscaping project, Caroline charges a fee of $17.00 for her equipment and $10.00 per hour spent working on the project. If x represents the number of hours spent working on the landscaping project, what are all the values of x for which Caroline\'s total charge is greater than Adam\'s total charge?',
    options: [
      { label: 'A', text: '$5 \\le x \\le 6$' },
      { label: 'B', text: '$6 \\le x \\le 7$' },
      { label: 'C', text: '$x < 5$' },
      { label: 'D', text: '$x > 6$' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Adam's cost = $20 + 9.50x$. Caroline's cost = $17 + 10.00x$. We set Caroline > Adam: $17 + 10.00x > 20 + 9.50x$. Subtracting $9.50x$ and $17$ yields $0.50x > 3 \\implies x > 6$.",
    hints: [
      { level: 1, title: 'Model Both Total Charges', hint: 'Adam = $20.00 + 9.50x$; Caroline = $17.00 + 10.00x$.' },
      { level: 2, title: 'Set up Inequality', hint: 'Caroline > Adam: $17 + 10x > 20 + 9.5x$.' },
      { level: 3, title: 'Isolate x', hint: '$0.5x > 3 \\implies x > 6$.' }
    ],
    concepts: ['linear inequalities', 'word problems', 'cost comparison', 'rate per hour']
  },
  {
    id: '249313d5',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'A wire with a length of 106 inches is cut into two parts. One part has a length of x inches, and the other part has a length of y inches. The value of x is 6 more than 4 times the value of y. What is the value of x?',
    options: [
      { label: 'A', text: '25' },
      { label: 'B', text: '28' },
      { label: 'C', text: '56' },
      { label: 'D', text: '86' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Total length equation: $x + y = 106$. Relation equation: $x = 4y + 6$. Substitute $x$ into the first equation: $(4y + 6) + y = 106 \\implies 5y + 6 = 106 \\implies 5y = 100 \\implies y = 20$. Then $x = 4(20) + 6 = 86$.",
    hints: [
      { level: 1, title: 'Form Two Equations', hint: 'Equation 1: $x + y = 106$. Equation 2: $x = 4y + 6$.' },
      { level: 2, title: 'Substitute to Find y', hint: '$4y + 6 + y = 106 \\implies 5y = 100 \\implies y = 20$.' },
      { level: 3, title: 'Solve for x', hint: '$x = 4(20) + 6 = 86$.' }
    ],
    concepts: ['systems of equations', 'word problems', 'substitution', 'algebraic modeling']
  },
  {
    id: 'f6809431',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear inequalities in one or two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The shaded region shown on the coordinate plane represents the solutions to which inequality?',
    graphConfig: {
      type: 'inequality',
      xRange: [-8, 8],
      yRange: [-8, 8],
      xStep: 2,
      yStep: 2,
      inequality: {
        slope: -3,
        yIntercept: -1,
        operator: '>',
        color: '#6366f1'
      },
      points: [[0, -1], [1, -4]]
    },
    options: [
      { label: 'A', text: '$y < -1 + 3x$' },
      { label: 'B', text: '$y < -1 - 3x$' },
      { label: 'C', text: '$y > -1 + 3x$' },
      { label: 'D', text: '$y > -1 - 3x$' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. The boundary line passes through $(0, -1)$ and $(1, -4)$. Slope $m = \\frac{-4 - (-1)}{1 - 0} = -3$. The y-intercept is $-1$, so the line is $y = -3x - 1$ (or $y = -1 - 3x$). The region shaded is above the line, which corresponds to $y > -1 - 3x$.",
    hints: [
      { level: 1, title: 'Determine the Boundary Line', hint: 'Find the slope and y-intercept from points $(0, -1)$ and $(1, -4)$.' },
      { level: 2, title: 'Calculate Line Equation', hint: '$m = \\frac{-4 - (-1)}{1 - 0} = -3$. y-intercept = $-1$. Line: $y = -1 - 3x$.' },
      { level: 3, title: 'Determine Shading Direction', hint: 'The region is above the line (test $(0,0)$: $0 > -1$ is true), so $y > -1 - 3x$.' }
    ],
    concepts: ['graphing inequalities', 'slope-intercept', 'shaded region', 'boundary line']
  },
  {
    id: 'cf175155',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'Caleb used juice to make popsicles. The function $f(x) = -5x + 30$ approximates the volume, in fluid ounces, of juice Caleb had remaining after making $x$ popsicles. Which statement is the best interpretation of the y-intercept of the graph of $y = f(x)$ in the $xy$-plane in this context?',
    options: [
      { label: 'A', text: 'Caleb used approximately 5 fluid ounces of juice for each popsicle.' },
      { label: 'B', text: 'Caleb had approximately 5 fluid ounces of juice when he began to make the popsicles.' },
      { label: 'C', text: 'Caleb had approximately 30 fluid ounces of juice when he began to make the popsicles.' },
      { label: 'D', text: 'Caleb used approximately 30 fluid ounces of juice for each popsicle.' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. The y-intercept occurs when $x = 0$ (making $0$ popsicles), giving $f(0) = 30$. In this context, this is the initial amount of juice Caleb had before making any popsicles.",
    hints: [
      { level: 1, title: 'Understand y-intercept meaning', hint: 'The y-intercept corresponds to the value of the function when the input variable $x = 0$.' },
      { level: 2, title: 'Evaluate at x = 0', hint: 'When $x = 0$ ($0$ popsicles made), $f(0) = 30$ fluid ounces.' },
      { level: 3, title: 'Contextual Interpretation', hint: '$30$ fluid ounces represents the initial amount of juice at the start.' }
    ],
    concepts: ['linear functions', 'y-intercept interpretation', 'contextual rate', 'initial value']
  },
  {
    id: '153dbaa0',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear inequalities in one or two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'A city employee will plant two types of bushes, azaleas and boxwoods, in a park. There will be no more than 164 total bushes planted, and the number of azaleas planted will be at most three times the number of boxwoods planted. Which of the following systems of inequalities best represents this situation, where a is the number of azaleas that will be planted, and b is the number of boxwoods that will be planted?',
    options: [
      { label: 'A', text: '$a + b \\ge 164$\n$3a \\ge b$' },
      { label: 'B', text: '$a + b \\ge 164$\n$a \\le 3b$' },
      { label: 'C', text: '$a + b \\le 164$\n$3a \\ge b$' },
      { label: 'D', text: '$a + b \\le 164$\n$a \\le 3b$' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. 'No more than 164 total bushes' translates to $a + b \\le 164$. 'Number of azaleas at most three times boxwoods' translates to $a \\le 3b$.",
    hints: [
      { level: 1, title: 'Translate "no more than"', hint: '"No more than 164" means less than or equal to ($a + b \\le 164$).' },
      { level: 2, title: 'Translate "at most 3 times"', hint: 'Azaleas ($a$) is at most 3 times boxwoods ($b$) $\\implies a \\le 3b$.' },
      { level: 3, title: 'Combine Inequalities', hint: 'System is $a + b \\le 164$ and $a \\le 3b$.' }
    ],
    concepts: ['inequality systems', 'translating word problems', 'upper bounds', 'constraints']
  },
  {
    id: '479fcded',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The table shows three values of x and their corresponding values of y, where n is a constant, for the linear relationship between x and y. What is the slope of the line that represents this relationship in the xy-plane?',
    tableData: {
      headers: ['x', 'y'],
      rows: [
        [-6, '$n + 184$'],
        [-3, '$n + 92$'],
        [0, '$n$']
      ]
    },
    options: [
      { label: 'A', text: '$-\\frac{92}{3}$' },
      { label: 'B', text: '$-\\frac{3}{92}$' },
      { label: 'C', text: '$\\frac{n + 92}{-3}$' },
      { label: 'D', text: '$\\frac{2n - 92}{3}$' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. Choose points $(0, n)$ and $(-3, n + 92)$. Slope $m = \\frac{n - (n + 92)}{0 - (-3)} = -\\frac{92}{3}$.",
    hints: [
      { level: 1, title: 'Slope Formula', hint: '$m = \\frac{y_2 - y_1}{x_2 - x_1}$.' },
      { level: 2, title: 'Pick Two Clean Points', hint: 'Pick $(0, n)$ and $(-3, n + 92)$.' },
      { level: 3, title: 'Calculate', hint: '$m = \\frac{n - (n + 92)}{0 - (-3)} = -\\frac{92}{3}$.' }
    ],
    concepts: ['slope', 'linear equations', 'algebraic constants', 'rate of change']
  },
  {
    id: 'fd80013a',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'In the xy-plane, line $\\ell$ passes through the point $(0, 0)$ and is parallel to the line represented by the equation $y = 8x + 2$. If line $\\ell$ also passes through the point $(3, d)$, what is the value of $d$?',
    correctAnswer: '24',
    acceptedAnswers: ['24'],
    rationale: "The correct answer is 24. Parallel lines have equal slopes, so the slope of line $\\ell$ is $8$. Since line $\\ell$ passes through $(0, 0)$, its equation is $y = 8x$. Substituting $(3, d)$ gives $d = 8(3) = 24$.",
    hints: [
      { level: 1, title: 'Parallel Lines Property', hint: 'Parallel lines have the exact same slope.' },
      { level: 2, title: 'Write Line ℓ Equation', hint: 'Slope is $8$ and y-intercept is $0$, so $y = 8x$.' },
      { level: 3, title: 'Substitute x = 3', hint: '$d = 8(3) = 24$.' }
    ],
    concepts: ['parallel lines', 'slope-intercept', 'coordinate geometry', 'direct variation']
  },
  {
    id: 'd0b86a61',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'For a particular car, the linear function $f$ gives the predicted power, in brake horsepower (bhp), for engine speeds between 1,000 revolutions per minute (rpm) and 6,000 rpm. According to this function, the car\'s predicted power is 433 bhp at an engine speed of 3,331 rpm and 600 bhp at an engine speed of 4,500 rpm. The equation $f(x) = \\frac{1}{7}(x - a) + 433$ defines $f$, where $x$ is the engine speed, in rpm, and $a$ is a constant. What is the value of $a$?',
    correctAnswer: '3331',
    acceptedAnswers: ['3331'],
    rationale: "The correct answer is 3,331. Substitute $x = 3331$ and $f(x) = 433$ into the equation: $433 = \\frac{1}{7}(3331 - a) + 433$. Subtract $433$ from both sides: $0 = \\frac{1}{7}(3331 - a)$, so $3331 - a = 0 \\implies a = 3331$.",
    hints: [
      { level: 1, title: 'Use Known Data Point', hint: 'Substitute the given point $(3331, 433)$ into the equation.' },
      { level: 2, title: 'Set up Equation', hint: '$433 = \\frac{1}{7}(3331 - a) + 433$.' },
      { level: 3, title: 'Solve for a', hint: '$0 = \\frac{1}{7}(3331 - a) \\implies a = 3331$.' }
    ],
    concepts: ['linear functions', 'point-slope form', 'algebraic solving', 'physics modeling']
  },
  {
    id: '672d125f',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The point with coordinates $(d, 4)$ lies on the line that passes through $(0, 7)$ and $(8, 0)$. What is the value of $d$?',
    graphConfig: {
      type: 'line',
      xRange: [0, 14],
      yRange: [0, 14],
      xStep: 2,
      yStep: 2,
      lines: [
        {
          points: [[0, 7], [8, 0]],
          color: '#0f172a',
          label: 'Line through (0,7) and (8,0)'
        }
      ],
      points: [[0, 7], [8, 0]]
    },
    options: [
      { label: 'A', text: '$\\frac{7}{2}$' },
      { label: 'B', text: '$\\frac{26}{7}$' },
      { label: 'C', text: '$\\frac{24}{7}$' },
      { label: 'D', text: '$\\frac{27}{8}$' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. The slope is $m = \\frac{0 - 7}{8 - 0} = -\\frac{7}{8}$. The line equation is $y = -\\frac{7}{8}x + 7$. If $y = 4$, then $4 = -\\frac{7}{8}d + 7 \\implies -\\frac{7}{8}d = -3 \\implies d = 3 \\cdot \\frac{8}{7} = \\frac{24}{7}$.",
    hints: [
      { level: 1, title: 'Find Line Equation', hint: 'Find the slope using $(0,7)$ and $(8,0)$: $m = -\\frac{7}{8}$. Equation: $y = -\\frac{7}{8}x + 7$.' },
      { level: 2, title: 'Substitute y = 4', hint: '$4 = -\\frac{7}{8}d + 7$.' },
      { level: 3, title: 'Solve for d', hint: '$-3 = -\\frac{7}{8}d \\implies d = \\frac{24}{7}$.' }
    ],
    concepts: ['linear equations', 'coordinate plane', 'fractions', 'points on line']
  },
  {
    id: '57a15ca6',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'What is the slope of the graph of $10x - 5y = -12$ in the $xy$-plane?',
    options: [
      { label: 'A', text: '-2' },
      { label: 'B', text: '$-\\frac{5}{6}$' },
      { label: 'C', text: '$\\frac{5}{6}$' },
      { label: 'D', text: '2' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Convert to slope-intercept form $y = mx + b$: $-5y = -10x - 12 \\implies y = 2x + \\frac{12}{5}$. The slope is $m = 2$.",
    hints: [
      { level: 1, title: 'Convert to Slope-Intercept Form', hint: 'Isolate $y$ in the equation $y = mx + b$.' },
      { level: 2, title: 'Divide by -5', hint: '$-5y = -10x - 12 \\implies y = 2x + \\frac{12}{5}$.' },
      { level: 3, title: 'Identify m', hint: '$y = 2x + \\frac{12}{5}$, so slope $m = 2$.' }
    ],
    concepts: ['standard form to slope-intercept', 'slope', 'linear equations']
  },
  {
    id: 'b22b77e5',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'If $5 - 7(2 - 4x) = 16 - 8(2 - 4x)$, what is the value of $2 - 4x$?',
    correctAnswer: '11',
    acceptedAnswers: ['11'],
    rationale: "The correct answer is 11. Let $u = 2 - 4x$. The equation becomes $5 - 7u = 16 - 8u$. Adding $8u$ and subtracting $5$ yields $u = 11$. Thus, $2 - 4x = 11$.",
    hints: [
      { level: 1, title: 'Spot the Common Expression', hint: 'Notice the repeated expression $(2 - 4x)$. You can treat it as a single variable $u$.' },
      { level: 2, title: 'Substitute u = (2 - 4x)', hint: '$5 - 7u = 16 - 8u$.' },
      { level: 3, title: 'Solve for u', hint: '$8u - 7u = 16 - 5 \\implies u = 11$.' }
    ],
    concepts: ['linear equations in one variable', 'chunking', 'algebraic substitution', 'efficiency']
  },
  {
    id: '260c8cc7',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'Hard',
    type: 'multiple_choice',
    prompt: 'The given function $g$ models the number of gallons of gasoline that remains from a full gas tank in a car after driving $m$ miles:\n\n$g(m) = -0.05m + 12.1$\n\nAccording to the model, about how many gallons of gasoline are used to drive each mile?',
    options: [
      { label: 'A', text: '0.05' },
      { label: 'B', text: '12.1' },
      { label: 'C', text: '20' },
      { label: 'D', text: '242.0' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. In $g(m) = -0.05m + 12.1$, the rate of change is the coefficient of $m$, which is $-0.05$. This means for each additional mile driven, the remaining gasoline decreases by $0.05$ gallons.",
    hints: [
      { level: 1, title: 'Identify Rate of Change', hint: 'The rate at which gasoline is used per mile is given by the magnitude of the slope.' },
      { level: 2, title: 'Slope Analysis', hint: 'The coefficient of $m$ is $-0.05$, representing $-0.05$ gallons per mile.' },
      { level: 3, title: 'Select Answer', hint: '$0.05$ gallons are used per mile.' }
    ],
    concepts: ['linear functions', 'rate of change', 'slope interpretation', 'modeling']
  },
  {
    id: 'db8430a3',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations in two variables',
    difficulty: 'Hard',
    type: 'free_response',
    prompt: 'The equations in the system are:\n\n$2a + 8b = 198$\n$2a + 4b = 98$\n\nThe solution to the given system of equations is $(a, b)$. What is the value of $b$?',
    correctAnswer: '25',
    acceptedAnswers: ['25'],
    rationale: "The correct answer is 25. Subtract the second equation from the first: $(2a + 8b) - (2a + 4b) = 198 - 98 \\implies 4b = 100 \\implies b = 25$.",
    hints: [
      { level: 1, title: 'Elimination Method', hint: 'Both equations have $2a$. Subtract the second equation from the first to eliminate $2a$.' },
      { level: 2, title: 'Subtract Equations', hint: '$(2a + 8b) - (2a + 4b) = 198 - 98 \\implies 4b = 100$.' },
      { level: 3, title: 'Solve for b', hint: '$b = \\frac{100}{4} = 25$.' }
    ],
    concepts: ['systems of equations', 'elimination method', 'linear algebra']
  },
  {
    id: 'd9d67aa9',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Medium',
    type: 'free_response',
    prompt: 'The y-intercept of the graph of $y = -6x - 32$ in the xy-plane is $(0, y)$. What is the value of $y$?',
    correctAnswer: '-32',
    acceptedAnswers: ['-32'],
    rationale: "The correct answer is -32. It's given that the y-intercept of the graph of $y = -6x - 32$ is $(0, y)$. Substituting $0$ for $x$ in this equation yields $y = -6(0) - 32$, or $y = -32$. Therefore, the value of $y$ that corresponds to the y-intercept of the graph of $y = -6x - 32$ in the xy-plane is -32.",
    hints: [
      { level: 1, title: 'Definition of y-intercept', hint: 'The y-intercept is the point on the graph where $x = 0$.' },
      { level: 2, title: 'Substitute x = 0', hint: '$y = -6(0) - 32$.' },
      { level: 3, title: 'Solve for y', hint: '$y = -32$.' }
    ],
    concepts: ['y-intercept', 'linear equations', 'coordinate geometry']
  },
  {
    id: 'f8a62f55',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'In a chess tournament, each participant earns 1 point for each game the participant plays that ends in a draw and 3 points for each game the participant wins. A certain participant in this tournament has earned 41 points. Which equation represents this situation, where d represents the number of games this participant has played that ended in a draw and w represents the number of games this participant has won?',
    options: [
      { label: 'A', text: '$d + 3w = 41$' },
      { label: 'B', text: '$3d + w = 41$' },
      { label: 'C', text: '$d + \\frac{w}{3} = 41$' },
      { label: 'D', text: '$\\frac{d}{3} + w = 41$' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. It's given that each participant earns 1 point for each game that ends in a draw and 3 points for each game won. Since $d$ represents draws and $w$ represents wins, the total points earned is $1d + 3w$, or $d + 3w$. Since the participant earned 41 points, the equation $d + 3w = 41$ represents this situation.",
    hints: [
      { level: 1, title: 'Set up point contributions', hint: 'Draws contribute $1 \\cdot d$ points and wins contribute $3 \\cdot w$ points.' },
      { level: 2, title: 'Total point sum', hint: 'Total points = $1d + 3w = d + 3w$.' },
      { level: 3, title: 'Match equation', hint: 'Set equal to 41: $d + 3w = 41$.' }
    ],
    concepts: ['linear equations', 'translating word problems', 'algebraic modeling']
  },
  {
    id: '0cec7ab3',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'A rocket contained 467,000 kilograms (kg) of propellant before launch. Exactly 21 seconds after launch, 362,105 kg of this propellant remained. On average, approximately how much propellant, in kg, did the rocket burn each second after launch?',
    options: [
      { label: 'A', text: '4,995' },
      { label: 'B', text: '17,243' },
      { label: 'C', text: '39,481' },
      { label: 'D', text: '104,895' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. The difference between the initial propellant and the remaining propellant is $467,000 - 362,105 = 104,895$ kg burned over 21 seconds. Dividing by 21 seconds gives $\\frac{104,895}{21} = 4,995$ kg burned each second.",
    hints: [
      { level: 1, title: 'Find Total Propellant Burned', hint: 'Subtract remaining amount from starting amount: $467,000 - 362,105 = 104,895$ kg.' },
      { level: 2, title: 'Calculate Burn Rate per Second', hint: 'Divide total burned by 21 seconds: $\\frac{104,895}{21}$.' },
      { level: 3, title: 'Evaluate', hint: '$\\frac{104,895}{21} = 4,995$ kg/sec.' }
    ],
    concepts: ['rate of change', 'unit rates', 'arithmetic modeling']
  },
  {
    id: '1783bf90',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'A producer is creating a video with a length of 70 minutes. The video will consist of segments that are 1 minute long and segments that are 3 minutes long. Which equation represents this situation, where x represents the number of 1-minute segments and y represents the number of 3-minute segments?',
    options: [
      { label: 'A', text: '$4xy = 70$' },
      { label: 'B', text: '$4(x + y) = 70$' },
      { label: 'C', text: '$3x + y = 70$' },
      { label: 'D', text: '$x + 3y = 70$' }
    ],
    correctAnswer: 'D',
    rationale: "Choice D is correct. Since $x$ represents the number of 1-minute segments and $y$ represents the number of 3-minute segments, the total video length is $1 \\cdot x + 3 \\cdot y$, or $x + 3y$, minutes. Since the total length is 70 minutes, the equation is $x + 3y = 70$.",
    hints: [
      { level: 1, title: 'Model segment lengths', hint: '$x$ 1-minute segments contribute $1x$ minutes; $y$ 3-minute segments contribute $3y$ minutes.' },
      { level: 2, title: 'Form total duration sum', hint: 'Total time = $1x + 3y = x + 3y$.' },
      { level: 3, title: 'Equate to total time', hint: '$x + 3y = 70$.' }
    ],
    concepts: ['linear equations', 'word problems', 'algebraic modeling']
  }
];
