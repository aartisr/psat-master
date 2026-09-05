import { Question } from '../types';

export const psatReadingQuestions: Question[] = [
  {
    id: 'rw01inf99',
    assessment: 'PSAT 8/9',
    test: 'Reading and Writing',
    domain: 'Information and Ideas',
    skill: 'Inferences',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Which choice most logically completes the text?',
    stimulus: "Paleontologists analyzing the fossilized teeth of ancient theropod dinosaurs noticed microscopic scratch patterns (microwear) that closely match those observed in modern carnivores that occasionally scavenge bone rather than strictly consuming soft muscle tissue. If these microscopic wear markings reflect consistent dietary behaviors throughout the dinosaur's lifetime rather than anomalous post-mortem abrasion, the researchers conclude that _______",
    options: [
      { label: 'A', text: 'the theropod species was exclusively herbivorous during juvenile stages.' },
      { label: 'B', text: 'the theropod engaged in opportunistic bone consumption as part of its regular foraging strategy.' },
      { label: 'C', text: 'microwear patterns cannot be reliably used to distinguish predatory behavior from scavenging.' },
      { label: 'D', text: 'modern carnivores have evolved distinct enamel structures that prevent dental abrasion.' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. The text notes that the microwear on the theropod teeth matches that of modern carnivores that scavenge bone. If these marks reflect lifelong feeding behavior, it logically follows that the theropod incorporated bone consumption into its regular diet.",
    hints: [
      { level: 1, title: 'Connect the Premise to Conclusion', hint: 'Look at the comparison between the fossil wear patterns and modern bone scavengers.' },
      { level: 2, title: 'Evaluate the Assumption', hint: 'The text assumes the markings reflect consistent dietary behavior.' },
      { level: 3, title: 'Select Direct Implication', hint: 'Matching bone-scavenging wear implies opportunistic bone consumption.' }
    ],
    concepts: ['reading comprehension', 'scientific inference', 'evidence-based conclusion']
  },
  {
    id: 'rw02tra44',
    assessment: 'PSAT 8/9',
    test: 'Reading and Writing',
    domain: 'Craft and Structure',
    skill: 'Transitions',
    difficulty: 'Easy',
    type: 'multiple_choice',
    prompt: 'Which choice completes the text with the most logical transition?',
    stimulus: "During solar eclipses, sudden drops in ambient light and temperature trigger nocturnal behaviors in many diurnal species; bees return to their hives, and crickets begin their evening chorus. _______, once the Moon moves out of alignment and sunlight returns, animals resume their daytime routines within minutes.",
    options: [
      { label: 'A', text: 'Furthermore' },
      { label: 'B', text: 'Consequently' },
      { label: 'C', text: 'However' },
      { label: 'D', text: 'For instance' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. The first sentence describes the onset of nocturnal behavior during the eclipse. The second sentence presents a contrast: once the eclipse ends, the behavior quickly reverses back to daytime routines. 'However' signals this contrast.",
    hints: [
      { level: 1, title: 'Analyze Sentence Relationship', hint: 'The first sentence describes behavior during the eclipse; the second describes the reversal afterward.' },
      { level: 2, title: 'Identify Direction of Thought', hint: 'The relationship is contrast/reversal, not continuation or cause.' },
      { level: 3, title: 'Pick Transition', hint: '"However" signals a contrast.' }
    ],
    concepts: ['transitions', 'logical flow', 'contrast words', 'sentence structure']
  },
  {
    id: 'rw03sec12',
    assessment: 'PSAT 8/9',
    test: 'Reading and Writing',
    domain: 'Standard English Conventions',
    skill: 'Boundaries',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    stimulus: "Biologist Dr. Elena Vance spent six months surveying the canopy microclimates of the Monteverde Cloud _______ discovering over twenty uncataloged lichen species adapted to extreme mist gradients.",
    options: [
      { label: 'A', text: 'Forest, ultimately' },
      { label: 'B', text: 'Forest ultimately' },
      { label: 'C', text: 'Forest; ultimately' },
      { label: 'D', text: 'Forest: ultimately' }
    ],
    correctAnswer: 'A',
    rationale: "Choice A is correct. 'Forest, ultimately discovering...' uses a comma to set off a participial modifier ('discovering...') that describes the outcome of Dr. Vance's six months of surveying.",
    hints: [
      { level: 1, title: 'Identify Clause Structure', hint: 'The first part is an independent clause. The second part begins with a participle "discovering".' },
      { level: 2, title: 'Avoid Semicolon Trap', hint: 'A semicolon requires an independent clause after it, but "ultimately discovering..." is a dependent participial phrase.' },
      { level: 3, title: 'Punctuation Rule', hint: 'Use a comma before a concluding participial modifier.' }
    ],
    concepts: ['punctuation', 'participial phrases', 'comma rules', 'sentence boundaries']
  },
  {
    id: 'am01quad88',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Advanced Math',
    skill: 'Nonlinear functions',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'The function f is defined by f(x) = (x - 4)(x + 6). For what value of x does f(x) reach its minimum value?',
    options: [
      { label: 'A', text: '-6' },
      { label: 'B', text: '-1' },
      { label: 'C', text: '1' },
      { label: 'D', text: '4' }
    ],
    correctAnswer: 'B',
    rationale: "Choice B is correct. The roots of the parabola are x = 4 and x = -6. Since the parabola opens upward, the minimum occurs at the vertex x-coordinate, which is the midpoint of the roots: x = (4 + (-6)) / 2 = -2 / 2 = -1.",
    hints: [
      { level: 1, title: 'Find the X-intercepts (Roots)', hint: 'Setting f(x) = 0 gives roots x = 4 and x = -6.' },
      { level: 2, title: 'Find Axis of Symmetry', hint: 'The vertex x-coordinate is the average of the roots: (4 + (-6)) / 2.' },
      { level: 3, title: 'Calculate Value', hint: 'x = -2 / 2 = -1.' }
    ],
    concepts: ['parabolas', 'vertex', 'axis of symmetry', 'quadratic functions']
  },
  {
    id: 'ps01data33',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Percentages and Proportions',
    difficulty: 'Medium',
    type: 'multiple_choice',
    prompt: 'A science club had 40 members in September. By January, the number of members increased by 25%. By May, the membership increased by an additional 20% of the January count. How many members were in the club in May?',
    options: [
      { label: 'A', text: '50' },
      { label: 'B', text: '58' },
      { label: 'C', text: '60' },
      { label: 'D', text: '62' }
    ],
    correctAnswer: 'C',
    rationale: "Choice C is correct. In January: 40 × 1.25 = 50 members. In May: 50 × 1.20 = 60 members.",
    hints: [
      { level: 1, title: 'Calculate January Count', hint: '40 + 25% of 40 = 40 + 10 = 50.' },
      { level: 2, title: 'Calculate May Count', hint: '50 + 20% of 50 = 50 + 10 = 60.' },
      { level: 3, title: 'Avoid Adding Percentages Directly', hint: '25% + 20% is not 45% of original; apply sequentially: 40 × 1.25 × 1.20 = 60.' }
    ],
    concepts: ['percentages', 'sequential percentage change', 'proportions']
  },
  {
    id: 'gt01geom55',
    assessment: 'PSAT 8/9',
    test: 'Math',
    domain: 'Geometry and Trigonometry',
    skill: 'Lines, angles, and triangles',
    difficulty: 'Easy',
    type: 'free_response',
    prompt: 'In right triangle ABC, angle C measures 90°. If the measure of angle A is 38°, what is the measure, in degrees, of angle B?',
    correctAnswer: '52',
    acceptedAnswers: ['52'],
    rationale: "The correct answer is 52. In any triangle, the sum of angles is 180°. In a right triangle, the two acute angles are complementary: 90° - 38° = 52°.",
    hints: [
      { level: 1, title: 'Triangle Angle Sum', hint: 'The angles of a triangle sum to 180°.' },
      { level: 2, title: 'Complementary Angles', hint: 'Angle A + Angle B = 90° in a right triangle.' },
      { level: 3, title: 'Calculate Angle B', hint: '90 - 38 = 52.' }
    ],
    concepts: ['triangles', 'right triangles', 'complementary angles', 'degrees']
  }
];
