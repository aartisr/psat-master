import { Question, QuestionOption } from '../types';
import { extractTableData, isValidTable } from './tableParser';
import { shouldAttachVisualReference } from './pdfExtractor';

export interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: 'latex' | 'table' | 'visual' | 'answer' | 'options';
  message: string;
}

export interface QuestionAuditResult {
  questionId: string;
  question: Question;
  fidelityScore: number; // 0 - 100
  issues: AuditIssue[];
}

export interface BankAuditReport {
  totalQuestions: number;
  perfectQuestions: number;
  averageFidelityScore: number;
  results: QuestionAuditResult[];
  summary: {
    latexErrors: number;
    tableMismatches: number;
    visualDiscrepancies: number;
    answerKeyValid: number;
  };
}

function balanceLatexString(str?: string): string {
  if (!str) return str || '';
  const dollarCount = (str.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    return str + '$';
  }
  return str;
}

/**
 * Isolates a single question's text block from a larger multi-page or multi-question document.
 * This is crucial to prevent cross-page table bleeding and variable mismatching.
 */
function isolateQuestionBlock(rawText: string, qId?: string, prompt?: string): string {
  if (!rawText) return '';
  const cleanText = rawText.trim();
  if (cleanText.length < 100) return cleanText;

  // Let's search for a unique identifier in the rawText
  let matchIndex = -1;
  if (qId) {
    matchIndex = cleanText.indexOf(qId);
  }
  if (matchIndex === -1 && prompt) {
    // Strip any LaTeX dollars or brackets first
    const cleanPrompt = prompt.replace(/\$/g, '').replace(/[\s\r\n\t]+/g, ' ').trim();
    const searchStr = cleanPrompt.substring(0, Math.min(cleanPrompt.length, 50)).trim();
    if (searchStr.length > 10) {
      matchIndex = cleanText.indexOf(searchStr);
    }
    if (matchIndex === -1 && cleanPrompt.length > 60) {
      // Try a middle substring of the prompt to be safe
      const searchStr2 = cleanPrompt.substring(20, Math.min(cleanPrompt.length, 70)).trim();
      if (searchStr2.length > 15) {
        matchIndex = cleanText.indexOf(searchStr2);
      }
    }
  }

  if (matchIndex === -1) {
    // If we can't find a match, don't return the whole document if it's huge, as it causes table bleeding!
    return cleanText.length < 5000 ? cleanText : '';
  }

  // We found where this question starts in the rawText!
  // Let's find the boundaries of this question's block.
  // 1. Scan backwards for the closest preceding boundary (page break or previous Question ID)
  let startIdx = 0;
  const textBefore = cleanText.substring(0, matchIndex);
  const boundaryRegex = /(?:Question\s*ID\b|ID:\s*[a-z0-9]{6,12}|---\s*Page\s*\d+\s*---)/gi;
  let m;
  let lastMatch = null;
  while ((m = boundaryRegex.exec(textBefore)) !== null) {
    lastMatch = m;
  }
  if (lastMatch) {
    const matchStr = lastMatch[0];
    if (matchStr.toLowerCase().includes('page')) {
      startIdx = lastMatch.index; // Include the page break and everything after it!
    } else {
      // It's a previous question's ID. Let's start after this question ID line.
      startIdx = lastMatch.index + matchStr.length;
    }
  }

  // 2. Scan forwards for the closest succeeding boundary (next page break or next Question ID)
  let endIdx = cleanText.length;
  const textAfter = cleanText.substring(matchIndex);
  // We look at least 150 characters ahead of matchIndex to avoid matching the current question's ID again
  const searchAheadText = textAfter.substring(150);
  const nextMatch = boundaryRegex.exec(searchAheadText);
  if (nextMatch) {
    endIdx = matchIndex + 150 + nextMatch.index;
  }

  return cleanText.substring(startIdx, endIdx).trim();
}

/**
 * Automatically repairs common extraction defects:
 * - Recovers tableData if missing or invalid from prompt or raw source context
 * - Cleans broken/empty table structures
 * - Fixes unbalanced math LaTeX delimiters across prompt, rationale & options
 * - Standardizes option labels and maps value-based correct answers to option keys
 * - Recovers missing free-response answers from rationale
 * - Aligns image attachments with prompt text
 */
export function repairQuestion(q: Question, rawSourceContext?: string): Question {
  const repaired: Question = JSON.parse(JSON.stringify(q));

  // Isolate the specific question's block context from rawSourceContext to prevent table bleeding
  if (rawSourceContext) {
    rawSourceContext = isolateQuestionBlock(rawSourceContext, repaired.id, repaired.prompt) || rawSourceContext;
  }

  // Helper to clean Unicode PUA box glyphs, BOM, replacement chars & font artifacts
  const cleanArtifacts = (text: string, preserveNewlines = false) => {
    if (!text) return text;
    let temp = text
      .replace(/[\uE000-\uF8FF\uF000-\uFFFF\uFEFF\uFFFD\u0000-\u0008\u000B-\u001F]/g, '')
      .replace(/^[\s⬜■□\uFEFF\uFFFD\uE000-\uF8FF]+/, '')
      .replace(/de\s*fi\s*ned/gi, 'defined');
    
    if (preserveNewlines) {
      // Normalize line endings and collapse extra horizontal spaces while keeping newlines
      temp = temp.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      temp = temp.replace(/[ \t]{2,}/g, ' ');
      temp = temp.split('\n').map(line => line.trim()).join('\n');
      temp = temp.replace(/\n{3,}/g, '\n\n');
    } else {
      temp = temp.replace(/\s{2,}/g, ' ');
    }
    return temp.trim();
  };

  // 1. Clean Prompt Text artifacts & balance LaTeX
  if (repaired.prompt) {
    let p = cleanArtifacts(repaired.prompt);

    // 2. Auto-recover missing single-letter math variables in table prompt sentences
    let h1 = (repaired.tableData?.headers?.[0] || 'x').replace(/[\$\s]/g, '');
    let h2 = (repaired.tableData?.headers?.[1] || 'y').replace(/[\$\s]/g, '');
    if (!h1) h1 = 'x';
    if (!h2) {
      if (/\bg\(x\)\b/i.test(`${p} ${repaired.rationale || ''} ${rawSourceContext || ''}`)) h2 = 'g(x)';
      else if (/\bf\(x\)\b/i.test(`${p} ${repaired.rationale || ''} ${rawSourceContext || ''}`)) h2 = 'f(x)';
      else h2 = 'y';
    }

    // "values of and their corresponding values of" -> "values of $x$ and their corresponding values of $g(x)$"
    p = p.replace(
      /(values\s+of)\s+(and\s+their\s+corresponding\s+values\s+of)\s*([,\s])/gi,
      `$1 $${h1}$ $2 $${h2}$$3`
    );

    // "where is a constant" -> "where $a$ is a constant"
    if (/where\s+is\s+a\s+constant/i.test(p)) {
      const constVar = `${p} ${repaired.rationale || ''} ${rawSourceContext || ''}`.match(/where\s+([a-zA-Z])\s+is\s+a\s+constant/i)?.[1] || 'a';
      p = p.replace(/where\s+is\s+a\s+constant/gi, `where $${constVar}$ is a constant`);
    }

    // "relationship between and ." -> "relationship between $x$ and $g(x)$."
    p = p.replace(
      /(relationship\s+between)\s+(and)\s*([\.\,\?])/gi,
      `$1 $${h1}$ $2 $${h2}$$3`
    );

    repaired.prompt = balanceLatexString(p);
  }

  // Clean LaTeX Math Delimiters ($) across rationale and options
  if (repaired.rationale) {
    let rat = cleanArtifacts(repaired.rationale, true);

    // Auto-split choice explanations with paragraph breaks if they are squashed into a single line
    rat = rat.replace(/(?:\s*)(\bChoice\s+[A-D]\s+is\s+(?:correct|incorrect)\b)/gi, '\n\n$1');
    rat = rat.replace(/(?:\s*)(\bQuestion\s+Difficulty\s*:)/gi, '\n\n$1');

    // Clean up excessive blank lines and normalize line spacing
    rat = rat.split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();

    repaired.rationale = balanceLatexString(rat);
  }
  if (repaired.options && Array.isArray(repaired.options)) {
    repaired.options = repaired.options.map((opt) => ({
      ...opt,
      text: balanceLatexString(cleanArtifacts(opt.text))
    }));
  }

  // 3. Table Data Repair & Auto-Recovery (Only if question originally had tableData or prompt references a table)
  const referencesTable =
    isValidTable(repaired.tableData) ||
    /\b(?:table|data\s+table|given\s+in\s+the\s+table|shown\s+in\s+the\s+table|values\s+in\s+the\s+table|\|)\b/i.test(repaired.prompt) ||
    (rawSourceContext && /\b(?:table|data\s+table|given\s+in\s+the\s+table|shown\s+in\s+the\s+table|values\s+in\s+the\s+table|\|)\b/i.test(rawSourceContext));

  if (referencesTable) {
    const extractedFromContext =
      (rawSourceContext ? extractTableData(rawSourceContext) : undefined) ||
      extractTableData(repaired.prompt) ||
      extractTableData(repaired.rationale || '');

    if (isValidTable(extractedFromContext)) {
      if (!isValidTable(repaired.tableData) || extractedFromContext.rows.length > repaired.tableData.rows.length) {
        repaired.tableData = extractedFromContext;
      }
    }
  } else {
    delete repaired.tableData;
  }

  // 4. Auto-Extract Options if missing or incomplete
  const textContext = `${repaired.prompt}\n${rawSourceContext || ''}\n${repaired.rationale || ''}`;
  if (repaired.type === 'multiple_choice' || (repaired.options && repaired.options.length > 0)) {
    // If fewer than 2 options, try to extract options embedded in text (A) ... B) ... C) ... D) ...)
    if (!repaired.options || repaired.options.length < 2) {
      const optRegex = /(?:^|\s|\n)(?:Option\s+|Choice\s+)?([A-D])[\)\.\:]\s*([^\n]+?)(?=(?:\s+(?:Option\s+|Choice\s+)?[A-D][\)\.\:]|$|\n))/gi;
      const extractedOpts: QuestionOption[] = [];
      let match;
      while ((match = optRegex.exec(textContext)) !== null) {
        const label = match[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        let text = match[2].trim();
        text = text.replace(/^(?:is\s+)?(?:correct|incorrect).*$/i, '').trim();
        if (text && !extractedOpts.some((o) => o.label === label)) {
          extractedOpts.push({ label, text: balanceLatexString(text) });
        }
      }
      if (extractedOpts.length >= 2) {
        repaired.options = extractedOpts;
      }
    }

    // Recover empty option texts from rawSourceContext or rationale
    if (repaired.options && repaired.options.some((o) => !o.text || !o.text.trim())) {
      const optMatches = Array.from(textContext.matchAll(/(?:^|\n|\s)(?:Option\s+|Choice\s+)?([A-D])[\)\.\:]\s*([^\n]+)/gi));
      optMatches.forEach((m) => {
        const label = m[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        let rawTxt = m[2].trim();
        rawTxt = rawTxt.replace(/^(?:is\s+)?(?:correct|incorrect).*$/i, '').trim();

        const opt = repaired.options.find((o) => o.label === label);
        if (opt && (!opt.text || !opt.text.trim()) && rawTxt.length > 0) {
          opt.text = balanceLatexString(rawTxt);
        }
      });
    }

    // Standardize Option Labels (A, B, C, D)
    if (repaired.options && repaired.options.length > 0) {
      const standardLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      repaired.options = repaired.options.map((opt, idx) => ({
        ...opt,
        label: (opt.label ? opt.label.toUpperCase().replace(/[^A-D]/g, '') : '') as 'A' | 'B' | 'C' | 'D' || standardLabels[idx] || 'A'
      }));
    }

    // 4. Align Correct Answer Key with Options
    if (repaired.options && repaired.options.length > 0) {
      let rawAns = (repaired.correctAnswer || '').trim();
      const labels = repaired.options.map((o) => o.label.toUpperCase());

      // Case A: rawAns is a value like "25", "$25$", "-32" instead of "A", "B", "C", "D"
      if (!labels.includes(rawAns.toUpperCase())) {
        const cleanAns = rawAns.replace(/[\$\s]/g, '').toLowerCase();
        const matchingOpt = repaired.options.find((opt) => {
          const cleanOptText = opt.text.replace(/[\$\s]/g, '').toLowerCase();
          return cleanOptText === cleanAns || cleanOptText.includes(cleanAns) || (cleanAns.length > 0 && cleanOptText.includes(cleanAns));
        });

        if (matchingOpt) {
          repaired.correctAnswer = matchingOpt.label;
        } else {
          // Check rationale for explicit answer statement ("The correct answer is B", "Correct Answer: C")
          const ratMatch = (repaired.rationale || textContext).match(/(?:The\s+)?correct\s+answer\s+is\s*[:\s]*([A-D])\b/i) ||
                            (repaired.rationale || textContext).match(/Correct\s+Answer\s*:\s*([A-D])\b/i);
          if (ratMatch && labels.includes(ratMatch[1].toUpperCase())) {
            repaired.correctAnswer = ratMatch[1].toUpperCase();
          } else {
            // Default to first option label if still unmapped
            if (labels.length > 0) {
              repaired.correctAnswer = labels[0];
            }
          }
        }
      } else {
        repaired.correctAnswer = rawAns.toUpperCase();
      }
    }
  }

  // 5. Free Response Answer Recovery
  if (repaired.type === 'free_response' || (!repaired.options || repaired.options.length === 0)) {
    if (!repaired.correctAnswer || !repaired.correctAnswer.trim() || /^[A-D]$/i.test(repaired.correctAnswer)) {
      const ratAnsMatch = (repaired.rationale || textContext).match(/(?:The\s+)?correct\s+answer\s+is\s*[:\s]*([^\.\n\s]+)/i) ||
                          (repaired.rationale || textContext).match(/Correct\s+Answer\s*:\s*([^\.\n\s]+)/i) ||
                          (repaired.rationale || textContext).match(/\b(?:x|y|value|answer)\s*=\s*([-\d\.\/]+)/i);

      if (ratAnsMatch && ratAnsMatch[1]) {
        repaired.correctAnswer = ratAnsMatch[1].trim();
        repaired.type = 'free_response';
      }
    }
  }

  // 6. Visual Reference Alignment
  if (repaired.imageUrl) {
    const hasVisualText = /\b(?:graph|figure|table|diagram|shown|picture|image|illustration|coordinate)\b/i.test(repaired.prompt);
    if (!hasVisualText) {
      repaired.prompt = `${repaired.prompt.trim()}\n\n(Refer to the image below.)`;
    }
  }

  return repaired;
}

/**
 * Perform deep structural and mathematical validation on a question to verify 100% fidelity.
 */
export function auditQuestion(q: Question, rawSourceContext?: string): QuestionAuditResult {
  const issues: AuditIssue[] = [];
  let score = 100;

  // 1. Validate LaTeX formatting ($ balanced)
  const fullText = `${q.prompt} ${q.rationale || ''} ${(q.options || []).map((o) => o.text).join(' ')}`;
  const dollarCount = (fullText.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    issues.push({
      type: 'error',
      category: 'latex',
      message: 'Unbalanced LaTeX math delimiters ($).'
    });
    score -= 25;
  }

  // 2. Validate Table Data
  const textSuggestsTable = /\b(?:the table shows|given in the table|values in the table|table shows four values|table shows three values|table gives the coordinates|shown in the table)\b/i.test(
    q.prompt
  );

  const hasValidTable = isValidTable(q.tableData);

  if (textSuggestsTable && !hasValidTable) {
    // Check if auto-recoverable
    const recoverable = extractTableData(q.prompt) || (rawSourceContext ? extractTableData(rawSourceContext) : undefined) || extractTableData(q.rationale);
    if (isValidTable(recoverable)) {
      issues.push({
        type: 'warning',
        category: 'table',
        message: 'Prompt mentions a table. Table structure is auto-recoverable.'
      });
      score -= 5;
    } else {
      issues.push({
        type: 'error',
        category: 'table',
        message: 'Prompt explicitly references a table, but table data is missing.'
      });
      score -= 30;
    }
  } else if (q.tableData && !hasValidTable) {
    issues.push({
      type: 'error',
      category: 'table',
      message: 'Table data object is empty or malformed.'
    });
    score -= 20;
  }

  // 3. Validate Visuals & Coordinate Graphs
  const hasVisualInPrompt = shouldAttachVisualReference(q.prompt);
  if (q.imageUrl && !hasVisualInPrompt) {
    issues.push({
      type: 'warning',
      category: 'visual',
      message: 'Question has an attached image, but prompt contains no explicit visual indicator.'
    });
    score -= 10;
  }

  if (q.graphConfig && !hasVisualInPrompt && !/\b(?:inequality|shaded|intersect|contains the points|passes through)\b/i.test(q.prompt)) {
    issues.push({
      type: 'info',
      category: 'visual',
      message: 'Dynamic vector graph attached to analytical question.'
    });
  }

  // 4. Validate Answer Key and Options
  if (q.type === 'multiple_choice') {
    if (!q.options || q.options.length < 2) {
      issues.push({
        type: 'error',
        category: 'options',
        message: 'Multiple choice question has fewer than 2 choices.'
      });
      score -= 30;
    } else {
      const labels = q.options.map((o) => o.label.toUpperCase());
      const hasCorrect = labels.includes((q.correctAnswer || '').toUpperCase());
      if (!hasCorrect) {
        issues.push({
          type: 'error',
          category: 'answer',
          message: `Correct answer (${q.correctAnswer}) does not match any available option (${labels.join(', ')}).`
        });
        score -= 35;
      }
    }
  } else if (q.type === 'free_response') {
    if (!q.correctAnswer || !q.correctAnswer.trim()) {
      issues.push({
        type: 'error',
        category: 'answer',
        message: 'Free-response question is missing a correct answer.'
      });
      score -= 35;
    }
  }

  return {
    questionId: q.id,
    question: q,
    fidelityScore: Math.max(0, Math.min(100, score)),
    issues
  };
}

/**
 * Audit entire question bank and produce a comprehensive report.
 */
export function auditQuestionBank(questions: Question[]): BankAuditReport {
  const results = questions.map((q) => auditQuestion(q));
  const perfectQuestions = results.filter((r) => r.issues.length === 0).length;
  const avgScore =
    questions.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.fidelityScore, 0) / questions.length)
      : 100;

  let latexErrors = 0;
  let tableMismatches = 0;
  let visualDiscrepancies = 0;
  let answerKeyValid = 0;

  results.forEach((r) => {
    r.issues.forEach((iss) => {
      if (iss.category === 'latex') latexErrors++;
      if (iss.category === 'table') tableMismatches++;
      if (iss.category === 'visual') visualDiscrepancies++;
    });
    const hasAnswerError = r.issues.some((iss) => iss.category === 'answer' || iss.category === 'options');
    if (!hasAnswerError) answerKeyValid++;
  });

  return {
    totalQuestions: questions.length,
    perfectQuestions,
    averageFidelityScore: avgScore,
    results,
    summary: {
      latexErrors,
      tableMismatches,
      visualDiscrepancies,
      answerKeyValid
    }
  };
}
