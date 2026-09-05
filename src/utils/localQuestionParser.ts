import { Question, AssessmentType, TestType, DomainType, DifficultyType, QuestionHint } from '../types';
import { extractGraphConfig } from './graphParser';
import { extractTableData } from './tableParser';
import { normalizeDocumentText } from './documentSplitter';

/**
 * Local Deterministic Question Parser
 * Runs 100% locally on client and server.
 * Requires 0ms external API calls, avoiding timeouts and network issues.
 */

export function parseQuestionsLocally(rawText: string, defaultAssessment: AssessmentType = 'PSAT/NMSQT'): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const trimmed = rawText.trim();

  // 1. Try Direct JSON or embedded JSON array parsing
  const jsonParsed = tryParseJsonQuestions(trimmed, defaultAssessment);
  if (jsonParsed && jsonParsed.length > 0) {
    return jsonParsed;
  }

  // 2. Text / Key-Value / Block Parsing
  const blockParsed = parseTextBlocks(trimmed, defaultAssessment);
  return blockParsed;
}

/**
 * Strategy 1: Attempt to parse JSON or JSON extracted from markdown / text codeblocks
 */
function tryParseJsonQuestions(text: string, defaultAssessment: AssessmentType): Question[] | null {
  let jsonString: string | null = null;

  if (text.startsWith('[') || text.startsWith('{')) {
    jsonString = text;
  } else {
    // Look for ```json ... ``` or array brackets [...]
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1].trim();
    } else {
      const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        jsonString = arrayMatch[0];
      }
    }
  }

  if (!jsonString) return null;

  try {
    const parsed = JSON.parse(jsonString);
    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
      items = parsed.questions;
    }

    if (items.length === 0) return null;

    const validated: Question[] = [];
    items.forEach((item, index) => {
      if (item && typeof item === 'object' && (item.prompt || item.question)) {
        validated.push(normalizeQuestionObj(item, index, defaultAssessment));
      }
    });

    return validated.length > 0 ? validated : null;
  } catch (e) {
    return null; // Not valid JSON, fallback to block parser
  }
}

/**
 * Strategy 2: Parse plain text blocks, key-value pairs, and standard numbered questions
 */
function parseTextBlocks(text: string, defaultAssessment: AssessmentType): Question[] {
  // Strip page header markers so multi-page rationales aren't broken into separate chunks
  const cleanText = text.replace(/--- Page \d+ ---\n?/g, '\n');

  // Split by question boundaries:
  // - "Question ID [id]" or "Question ID: [id]" or "ID: [id]"
  // - "Question [number]:" or "Question [number]"
  // - "Q[number]." or "Q[number]:"
  // - Numbered lines "1. ", "2. "
  const rawBlocks = cleanText.split(/(?:\n(?=(?:Question\s*ID\b|Question\s*\d+\b|Q\d+[\.:\s]|\bID:\s*[a-z0-9]{6,12}|\n\s*(?:Assessment:|\d+[\.\)]\s+[A-Z]))))/i);

  const questions: Question[] = [];

  rawBlocks.forEach((block, idx) => {
    const cleanBlock = block.trim();
    if (!cleanBlock || cleanBlock.length < 15) return;

    const q = parseSingleTextBlock(cleanBlock, idx, defaultAssessment);
    if (q) {
      questions.push(q);
    }
  });

  return questions;
}

function parseSingleTextBlock(block: string, index: number, defaultAssessment: AssessmentType): Question | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let id = `psat_local_${Date.now().toString(36)}_${index}_${Math.random().toString(36).substring(2, 6)}`;
  let assessment: AssessmentType = defaultAssessment;
  let test: TestType = 'Math';
  let domain: DomainType = 'Algebra';
  let skill = 'Problem Solving';
  let difficulty: DifficultyType = 'Medium';
  let type: 'multiple_choice' | 'free_response' = 'multiple_choice';
  let promptLines: string[] = [];
  let rationaleLines: string[] = [];
  let correctAnswer = 'A';
  let options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
  let userHints: string[] = [];

  let currentSection: 'prompt' | 'options' | 'rationale' | 'hints' = 'prompt';

  for (const rawLine of lines) {
    // Skip page break headers
    if (/^---\s*Page\s*\d+\s*---$/i.test(rawLine)) {
      continue;
    }

    // Clean up known College Board ligatures and spacing artifacts using generic utility
    const line = normalizeDocumentText(rawLine);

    // Check for College Board header line e.g. "Question ID [id]" or "ID: [id]"
    const cbIdMatch = line.match(/^(?:Question\s*ID|ID)\s*[:\s]*([a-z0-9]+)/i);
    if (cbIdMatch) {
      id = cbIdMatch[1];
      if (/PSAT\s*8\/9/i.test(line)) assessment = 'PSAT 8/9';
      else if (/PSAT\s*10/i.test(line)) assessment = 'PSAT 10';
      else if (/SAT/i.test(line)) assessment = 'SAT';

      if (/\bMath\b/i.test(line)) {
        test = 'Math';
      } else if (/Reading/i.test(line)) {
        test = 'Reading and Writing';
      }

      if (/Algebra/i.test(line)) domain = 'Algebra';
      else if (/Advanced\s+Math/i.test(line)) domain = 'Advanced Math';
      else if (/Problem-Solving/i.test(line)) domain = 'Problem-Solving and Data Analysis';
      else if (/Geometry/i.test(line)) domain = 'Geometry and Trigonometry';

      // Look for the actual question prompt embedded after the table headers
      const promptMatch = line.match(/(?:(?:Easy|Medium|Hard)\s+)?(The\s+[\s\S]+|\b(?:Which|What|How|If|In|A|For|Based|According)\b[\s\S]+\?)/i);
      if (promptMatch && promptMatch[1]) {
        promptLines.push(promptMatch[1].trim());
      }
      continue;
    }

    // Skip standalone College Board table header rows or metadata titles
    if (
      /^(?:Assessment\s+Test\s+Domain\s+Skill|Question\s+ID\s+Assessment)/i.test(line) ||
      (/^(?:PSAT(?:\s*8\/9|\s*10|\/NMSQT)?|SAT)\s+Math\b/i.test(line) && !line.includes('?') && !line.includes('='))
    ) {
      continue;
    }

    // Check for Question Difficulty line
    if (/^Question\s*Difficulty:\s*(.*)$/i.test(line)) {
      const diffMatch = line.match(/^Question\s*Difficulty:\s*(.*)$/i);
      if (diffMatch && diffMatch[1]) {
        const val = diffMatch[1].trim();
        if (val.toLowerCase().includes('easy')) difficulty = 'Easy';
        else if (val.toLowerCase().includes('hard')) difficulty = 'Hard';
        else difficulty = 'Medium';
      }
      continue;
    }

    // Check for Rationale or Explanation section boundary (with or without colon)
    if (/^(?:Rationale|Explanation|Correct\s*Answer:?)\b/i.test(line) && !line.match(/^(?:Rationale|Explanation|Correct\s*Answer:?)\s*[:\s]+[A-D]\b/i)) {
      currentSection = 'rationale';
      const cleanRat = line.replace(/^(?:Rationale|Explanation|Correct\s*Answer:?)\s*:?\s*/i, '').trim();
      if (cleanRat) rationaleLines.push(cleanRat);
      continue;
    }

    // Key-value metadata extraction
    const kvMatch = line.match(/^(Question\s*ID|ID|Assessment|Test|Domain|Skill|Difficulty|Type|Correct\s*Answer|Answer|Rationale|Explanation|Hint[s]?):\s*(.*)$/i);
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase().replace(/\s+/g, '');
      const val = kvMatch[2].trim();

      if (key === 'questionid' || key === 'id') {
        if (val) id = val.replace(/\s*Answer$/i, '').trim();
        continue;
      }
      if (key === 'assessment') {
        if (val.includes('8/9')) assessment = 'PSAT 8/9';
        else if (val.includes('10')) assessment = 'PSAT 10';
        else if (val.includes('SAT') && !val.includes('PSAT')) assessment = 'SAT';
        else assessment = 'PSAT/NMSQT';
        continue;
      }
      if (key === 'test') {
        if (val.toLowerCase().includes('read') || val.toLowerCase().includes('writ')) {
          test = 'Reading and Writing';
          domain = 'Information and Ideas';
        } else {
          test = 'Math';
          domain = 'Algebra';
        }
        continue;
      }
      if (key === 'domain') {
        if (val) domain = inferDomain(val, test);
        continue;
      }
      if (key === 'skill') {
        if (val) skill = val;
        continue;
      }
      if (key === 'difficulty') {
        if (val.toLowerCase().includes('easy')) difficulty = 'Easy';
        else if (val.toLowerCase().includes('hard')) difficulty = 'Hard';
        else difficulty = 'Medium';
        continue;
      }
      if (key === 'type') {
        if (val.toLowerCase().includes('free') || val.toLowerCase().includes('grid') || val.toLowerCase().includes('student')) {
          type = 'free_response';
        } else {
          type = 'multiple_choice';
        }
        continue;
      }
      if (key === 'correctanswer' || key === 'answer') {
        const letterMatch = val.match(/^([A-D])\b/i);
        if (letterMatch) {
          correctAnswer = letterMatch[1].toUpperCase();
        } else {
          correctAnswer = val || 'A';
          if (!isNaN(Number(val)) || val.includes('/') || val.startsWith('-')) {
            type = 'free_response';
          }
        }
        continue;
      }
      if (key === 'rationale' || key === 'explanation') {
        currentSection = 'rationale';
        if (val) rationaleLines.push(val);
        continue;
      }
      if (key.startsWith('hint')) {
        currentSection = 'hints';
        if (val) userHints.push(val);
        continue;
      }
    }

    // Option line extraction (e.g. A) Option text, A. Option text, [A] Option text, or lone option label A)
    const optionMatch = line.match(/^(?:\[?([A-D])\]?[\.\)\:-]?)\s*(.*)$/i);
    const isExplicitOption = optionMatch && (line.match(/^(?:\[?([A-D])\]?[\.\)\:-])/i) || /^[A-D]$/i.test(line.trim()));
    if (isExplicitOption) {
      currentSection = 'options';
      const label = optionMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      let optText = optionMatch[2].trim();

      // Check if option line contains "(Correct Answer)" or similar tag
      if (optText.match(/\b(correct|correct answer|\*)\b/i)) {
        optText = optText.replace(/\b\(?correct answer\)?|\*$/i, '').trim();
        correctAnswer = label;
      }

      options.push({ label, text: optText });
      continue;
    }

    // Append to active section
    if (currentSection === 'rationale') {
      rationaleLines.push(line);
    } else if (currentSection === 'hints') {
      userHints.push(line);
    } else if (currentSection === 'options') {
      // Append multi-line option content to the most recent option
      if (options.length > 0) {
        options[options.length - 1].text = (options[options.length - 1].text ? `${options[options.length - 1].text} ${line}` : line).trim();
      }
    } else if (currentSection === 'prompt') {
      // Remove leading "1. ", "Question 1: ", etc. if present on first line
      let cleanLine = line;
      if (promptLines.length === 0) {
        cleanLine = line.replace(/^(?:Question\s*\d+:|Q\d+[\.:\s]|\d+[\.\)]\s*)/i, '').trim();
      }
      if (cleanLine) promptLines.push(cleanLine);
    }
  }

  let promptText = promptLines.join(' ').trim();
  if (!promptText) return null;

  let rationale = rationaleLines.join(' ').trim();

  // Recover missing prompt math variables from rationale if present
  promptText = recoverMissingPromptMath(promptText, rationale);

  // Auto-detect test & domain if not explicitly given
  if (test === 'Math' && (promptText.toLowerCase().includes('passage') || promptText.toLowerCase().includes('text') || promptText.toLowerCase().includes('author'))) {
    test = 'Reading and Writing';
    domain = 'Information and Ideas';
  } else if (test === 'Math' && domain === 'Algebra') {
    domain = inferDomainFromPrompt(promptText);
  }

  // If rationale contains explicit answer statement like "The correct answer is -32." or "Correct Answer: 4"
  if (rationale) {
    const ratAnsMatch = rationale.match(/(?:The\s+)?correct\s+answer\s+is\s*[:\s]*([^\.\n\s]+)/i);
    if (ratAnsMatch && ratAnsMatch[1]) {
      const rawVal = ratAnsMatch[1].trim();
      if (!isNaN(Number(rawVal)) || rawVal.includes('/') || rawVal.startsWith('-')) {
        correctAnswer = rawVal;
        type = 'free_response';
      }
    }
  } else {
    rationale = `The correct answer is ${correctAnswer}. Work through the problem by analyzing key variables and conditions step-by-step.`;
  }

  // Handle free response vs multiple choice options default
  if (options.length === 0 && type === 'multiple_choice') {
    // Check if options were embedded in prompt string
    const embeddedOpts = extractEmbeddedOptions(promptText);
    if (embeddedOpts.length === 4) {
      options = embeddedOpts;
    } else if (!isNaN(Number(correctAnswer)) || correctAnswer.includes('/') || correctAnswer.startsWith('-')) {
      type = 'free_response';
    } else {
      // Default placeholder options if none were found
      options = [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' }
      ];
    }
  }

  const hintsObj: QuestionHint[] = userHints.length > 0
    ? userHints.map((h, i) => ({
        level: (Math.min(i + 1, 3)) as 1 | 2 | 3,
        title: `Hint ${i + 1}`,
        hint: h
      }))
    : [
        { level: 1, title: 'Understand the Goal', hint: `Identify what the problem is asking for and note given values.` },
        { level: 2, title: 'Step-by-Step Strategy', hint: `Formulate an algebraic expression or logical rule to isolate key components.` },
        { level: 3, title: 'Solution Check', hint: `Substitute back into the original condition to confirm answer ${correctAnswer}.` }
      ];

  const concepts = [domain, skill, test].filter(Boolean);

  const graphConfig = extractGraphConfig(promptText, {
    rationale,
    options,
    correctAnswer,
    prompt: promptText
  });
  const tableData = extractTableData(block) || extractTableData(promptText);

  return {
    id,
    assessment,
    test,
    domain,
    skill,
    difficulty,
    type,
    prompt: promptText,
    options: options.length > 0 ? options : undefined,
    correctAnswer,
    rationale,
    hints: hintsObj,
    concepts,
    graphConfig,
    tableData
  };
}

function normalizeQuestionObj(item: any, index: number, defaultAssessment: AssessmentType): Question {
  const id = item.id || `psat_local_${Date.now().toString(36)}_${index}`;
  const assessment: AssessmentType = item.assessment || defaultAssessment;
  const test: TestType = item.test === 'Reading and Writing' ? 'Reading and Writing' : 'Math';
  const domain: DomainType = inferDomain(item.domain || 'Algebra', test);
  const skill: string = item.skill || 'Problem Solving';
  const difficulty: DifficultyType = item.difficulty === 'Easy' || item.difficulty === 'Hard' ? item.difficulty : 'Medium';
  const type: 'multiple_choice' | 'free_response' = item.type === 'free_response' ? 'free_response' : 'multiple_choice';
  const prompt: string = item.prompt || item.question || 'PSAT Question Prompt';
  const correctAnswer: string = String(item.correctAnswer || item.answer || 'A');
  const rationale: string = item.rationale || item.explanation || `Correct answer is ${correctAnswer}.`;

  let options = item.options;
  if (type === 'multiple_choice' && (!options || !Array.isArray(options) || options.length === 0)) {
    options = [
      { label: 'A', text: item.optionA || 'Option A' },
      { label: 'B', text: item.optionB || 'Option B' },
      { label: 'C', text: item.optionC || 'Option C' },
      { label: 'D', text: item.optionD || 'Option D' }
    ];
  }

  let hints = item.hints;
  if (!hints || !Array.isArray(hints) || hints.length === 0) {
    hints = [
      { level: 1, title: 'Key Concept', hint: 'Identify what is requested in the prompt.' },
      { level: 2, title: 'Mathematical Setup', hint: 'Set up an equation or logical structure.' },
      { level: 3, title: 'Verification', hint: `Confirm that answer choice ${correctAnswer} satisfies all requirements.` }
    ];
  }

  const concepts = Array.isArray(item.concepts) && item.concepts.length > 0 ? item.concepts : [domain, skill];

  const graphConfig =
    item.graphConfig ||
    extractGraphConfig(prompt, {
      rationale,
      options,
      correctAnswer,
      prompt
    });
  const tableData = item.tableData || extractTableData(prompt);

  return {
    id,
    assessment,
    test,
    domain,
    skill,
    difficulty,
    type,
    prompt,
    options: type === 'multiple_choice' ? options : undefined,
    correctAnswer,
    rationale,
    hints,
    concepts,
    graphConfig,
    tableData
  };
}

function inferDomain(domainStr: string, test: TestType): DomainType {
  const d = domainStr.toLowerCase();
  if (test === 'Reading and Writing') {
    if (d.includes('craft') || d.includes('structure')) return 'Craft and Structure';
    if (d.includes('expression') || d.includes('idea')) return 'Expression of Ideas';
    if (d.includes('standard') || d.includes('english') || d.includes('convention')) return 'Standard English Conventions';
    return 'Information and Ideas';
  } else {
    if (d.includes('advanced')) return 'Advanced Math';
    if (d.includes('problem') || d.includes('data')) return 'Problem-Solving and Data Analysis';
    if (d.includes('geometry') || d.includes('trig')) return 'Geometry and Trigonometry';
    return 'Algebra';
  }
}

function inferDomainFromPrompt(prompt: string): DomainType {
  const p = prompt.toLowerCase();
  if (p.includes('quadratic') || p.includes('exponent') || p.includes('polynomial') || p.includes('f(x)')) return 'Advanced Math';
  if (p.includes('percent') || p.includes('probability') || p.includes('mean') || p.includes('median') || p.includes('table') || p.includes('ratio')) return 'Problem-Solving and Data Analysis';
  if (p.includes('triangle') || p.includes('angle') || p.includes('circle') || p.includes('area') || p.includes('volume') || p.includes('sin') || p.includes('cos')) return 'Geometry and Trigonometry';
  return 'Algebra';
}

function extractEmbeddedOptions(promptText: string): { label: 'A' | 'B' | 'C' | 'D'; text: string }[] {
  const optMatch = promptText.match(/A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*)$/i);
  if (optMatch) {
    return [
      { label: 'A', text: optMatch[1].trim() },
      { label: 'B', text: optMatch[2].trim() },
      { label: 'C', text: optMatch[3].trim() },
      { label: 'D', text: optMatch[4].trim() }
    ];
  }
  return [];
}

/**
 * Reconstructs missing mathematical variables and equations in PDF prompt text
 * by referencing the step-by-step explanation in the rationale.
 */
function recoverMissingPromptMath(promptText: string, rationaleText: string): string {
  if (!promptText || !rationaleText) return promptText;
  let p = promptText;

  // Pattern 1: "graph of in the" -> "graph of y = -6x - 32 in the"
  if (/graph\s+of\s+in\s+the/i.test(p)) {
    const eqMatch = rationaleText.match(/graph\s+of\s+([\$a-zA-Z0-9\s\=\-\+\/\(\)]+?)\s+is\s+/i);
    if (eqMatch && eqMatch[1].trim()) {
      const eq = eqMatch[1].trim();
      p = p.replace(/graph\s+of\s+in\s+the/i, `graph of $${eq}$ in the`);
    }
  }

  // Pattern 2: "is . What is" -> "is (0, y). What is"
  if (/is\s*\.\s*What\s+is/i.test(p)) {
    const ptMatch = rationaleText.match(/is\s+(\([0-9a-zA-Z,\s\-\+]+\))/i);
    if (ptMatch && ptMatch[1]) {
      p = p.replace(/is\s*\.\s*What\s+is/i, `is $${ptMatch[1]}$. What is`);
    }
  }

  // Pattern 3: "value of ?" -> "value of y?"
  if (/value\s+of\s*\?/i.test(p)) {
    const varMatch =
      rationaleText.match(/value\s+of\s+([a-zA-Z])\s+that\s+corresponds/i) ||
      rationaleText.match(/value\s+of\s+([a-zA-Z])\b/i);
    if (varMatch && varMatch[1]) {
      p = p.replace(/value\s+of\s*\?/i, `value of $${varMatch[1]}$?`);
    }
  }

  return p;
}
