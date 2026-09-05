import { QuestionTable } from '../types';

/**
 * Validates if a table structure is non-empty and well-formed.
 */
export function isValidTable(table?: QuestionTable | null): table is QuestionTable {
  if (!table || typeof table !== 'object') return false;
  if (!Array.isArray(table.headers) || table.headers.length === 0) return false;
  if (!table.headers.some((h) => typeof h === 'string' && h.trim().length > 0)) return false;
  if (!Array.isArray(table.rows) || table.rows.length === 0) return false;
  return table.rows.some((r) => Array.isArray(r) && r.length > 0 && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''));
}

/**
 * Modular parser to detect and extract tabular structures from question text,
 * OCR raw page text, and mathematical problem prompts.
 */
export function extractTableData(text: string): QuestionTable | undefined {
  if (!text || !text.trim()) return undefined;

  const candidates: QuestionTable[] = [];

  // Clean text and split lines
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .map((l) => {
      // Normalize function spacing so parenthesized parameters aren't isolated into separate tokens
      return l
        .replace(/\b([a-zA-Z])\s*\(\s*([a-zA-Z])\s*\)/g, '$1($2)')
        .replace(/\b([a-zA-Z])\s*\(\s*(\d+)\s*\)/g, '$1($2)');
    })
    .filter(Boolean);

  // 1. Explicit Markdown Table Parsing (| Header 1 | Header 2 |)
  const pipeLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (pipeLines.length >= 2) {
    const rawHeaders = pipeLines[0].split('|').map((c) => c.trim()).filter(Boolean);
    const rows: (string | number)[][] = [];

    for (let i = 1; i < pipeLines.length; i++) {
      if (pipeLines[i].includes('---')) continue;
      const cells = pipeLines[i].split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length === rawHeaders.length) {
        rows.push(cells.map((val) => (!isNaN(Number(val)) && val !== '' ? Number(val) : val)));
      }
    }

    if (rawHeaders.length > 0 && rows.length > 0) {
      candidates.push({ headers: rawHeaders, rows });
    }
  }

  // 2. Explicit Table: Block Parsing (e.g. "Table: x | g(x) \n 1 | 54 ...")
  const tableBlockMatch = cleanText.match(/(?:Table|Data Table|Values Table):\s*([^\n\r]+(?:\n[^\n\r]+)+)/i);
  if (tableBlockMatch) {
    const blockLines = tableBlockMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length >= 2) {
      const headers = parseLineTokens(blockLines[0]);
      if (headers.length >= 2) {
        const rows: (string | number)[][] = [];
        for (let i = 1; i < blockLines.length; i++) {
          const cells = parseLineTokens(blockLines[i]);
          if (cells.length === headers.length) {
            rows.push(cells.map((val) => (!isNaN(Number(val)) && val !== '' ? Number(val) : val)));
          }
        }
        if (rows.length >= 1) {
          candidates.push({ headers, rows });
        }
      }
    }
  }

  // 3. Mathematical Function & Coordinate Tables (e.g. "x g(x)", "x | f(x)", "x y", "t f(t)")
  for (let i = 0; i < lines.length - 1; i++) {
    let line = lines[i];

    if (/^(?:Question\s*ID|Assessment\s+Test|Domain|Skill|Difficulty)/i.test(line)) {
      continue;
    }

    // Strip leading and trailing pipe symbols from line for block 3 parsing
    if (line.startsWith('|')) line = line.substring(1).trim();
    if (line.endsWith('|')) line = line.substring(0, line.length - 1).trim();

    const mathHeaderMatch = line.match(/^(?:(?:\$|\b)(?:x|t|n|variable|input)(?:\$|\b))\s*[\t|,|\/|\|]?\s*(?:(?:\$|\b)(?:[A-Za-z]\([x|t|n]\)|g\(x\)|f\(x\)|h\(x\)|p\(x\)|y|f\(t\)|g\(t\)|output|frequency|count|value)(?:\$|\b))$/i);
    const multiColMathMatch = line.match(/^(?:x|t|n)\s*[\t|,|\/|\|]?\s*(?:f\(x\)|g\(x\)|y)\s*[\t|,|\/|\|]?\s*(?:g\(x\)|h\(x\)|z)$/i);
    const isStatHeader = /\b(Value|Score|Category|Age|Group|Class|Time|Length|Interval)\b/i.test(line) &&
      /\b(Frequency|Count|Number of|Relative Frequency|Percent|Total|Amount|Cumulative)\b/i.test(line);

    if (mathHeaderMatch || multiColMathMatch || isStatHeader) {
      let headers: string[] = [];
      if (mathHeaderMatch) {
        const parts = parseLineTokens(line).map((s) => s.trim().replace(/\$/g, '')).filter(Boolean);
        if (parts.length >= 2) headers = parts;
      } else if (multiColMathMatch) {
        headers = parseLineTokens(line).map((s) => s.trim().replace(/\$/g, '')).filter(Boolean);
      } else {
        headers = line.split(/[\t,|]|\s{2,}/).map((s) => s.trim()).filter(Boolean);
        if (headers.length < 2) {
          headers = line.split(/\s+/).map((s) => s.trim()).filter(Boolean);
        }
      }

      if (headers.length >= 2 && headers.length <= 6) {
        const rows: (string | number)[][] = [];

        for (let j = i + 1; j < lines.length; j++) {
          let rowLine = lines[j];
          if (/^(?:\[?[A-D]\]?[\.\)\:-]|Choice|Question|Rationale|Hint|For\s+the|What\s+is|Which\s+of|If\s+|In\s+the)/i.test(rowLine)) {
            break;
          }

          // Strip leading and trailing pipe symbols from row line for block 3 parsing
          if (rowLine.startsWith('|')) rowLine = rowLine.substring(1).trim();
          if (rowLine.endsWith('|')) rowLine = rowLine.substring(0, rowLine.length - 1).trim();

          let tokens = parseLineTokens(rowLine);

          // Handle split-line table tokens (e.g. line 1: "3", line 2: "48")
          if (tokens.length < headers.length && j + 1 < lines.length) {
            let combinedTokens = [...tokens];
            let lookAhead = j + 1;
            while (lookAhead < lines.length && combinedTokens.length < headers.length) {
              const nextLine = lines[lookAhead];
              if (/^(?:\[?[A-D]\]?[\.\)\:-]|Choice|Question|Rationale|Hint|For\s+the|What\s+is|Which\s+of|If\s+|In\s+the)/i.test(nextLine)) {
                break;
              }
              const nextTokens = parseLineTokens(nextLine);
              if (nextTokens.length > 0 && combinedTokens.length + nextTokens.length <= headers.length) {
                combinedTokens.push(...nextTokens);
                lookAhead++;
              } else {
                break;
              }
            }
            if (combinedTokens.length === headers.length) {
              tokens = combinedTokens;
              j = lookAhead - 1;
            }
          }

          if (tokens.length === headers.length) {
            rows.push(tokens.map((val) => (!isNaN(Number(val)) && val !== '' ? Number(val) : val)));
          } else if (tokens.length > headers.length && headers.length === 2 && tokens.length % 2 === 0) {
            for (let k = 0; k < tokens.length; k += 2) {
              const v1 = !isNaN(Number(tokens[k])) ? Number(tokens[k]) : tokens[k];
              const v2 = !isNaN(Number(tokens[k + 1])) ? Number(tokens[k + 1]) : tokens[k + 1];
              rows.push([v1, v2]);
            }
          } else if (tokens.length > headers.length && headers.length === 2) {
            const first = tokens[0];
            const rest = tokens.slice(1).join(' ');
            rows.push([!isNaN(Number(first)) ? Number(first) : first, rest]);
          } else if (tokens.length > 0) {
            // Skip unrecognized junk token lines without aborting early
            continue;
          }
        }

        if (rows.length >= 2) {
          candidates.push({ headers, rows });
        }
      }
    }
  }

  // 4. Horizontal / Transposed Table (e.g. Row 1: "x 10 15 20 25", Row 2: "f(x) 82 137 192 247")
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];

    const tokens1 = line1.split(/[\t,|]|\s+/).map((s) => s.trim().replace(/\$/g, '')).filter(Boolean);
    const tokens2 = line2.split(/[\t,|]|\s+/).map((s) => s.trim().replace(/\$/g, '')).filter(Boolean);

    if (tokens1.length >= 3 && tokens1.length === tokens2.length) {
      const isHeader1Var = /^(x|t|n|variable|input|value)$/i.test(tokens1[0]);
      const isHeader2Func = /^(?:[A-Za-z]\([x|t|n]\)|g\(x\)|f\(x\)|h\(x\)|p\(x\)|y|f\(t\)|g\(t\)|output|frequency|count|value)$/i.test(tokens2[0]);

      if (isHeader1Var && isHeader2Func) {
        const colHeaders = [tokens1[0], tokens2[0]];
        const rows: (string | number)[][] = [];
        for (let col = 1; col < tokens1.length; col++) {
          const v1 = !isNaN(Number(tokens1[col])) ? Number(tokens1[col]) : tokens1[col];
          const v2 = !isNaN(Number(tokens2[col])) ? Number(tokens2[col]) : tokens2[col];
          rows.push([v1, v2]);
        }
        candidates.push({ headers: colHeaders, rows });
      }
    }
  }

  // 5. Extract pairs from rationale or prompt sentences (e.g. "when x = 10, f(x) = 82", "g(1) = 32", "Substituting 1 for x and 54 for g(x)")
  const funcPairsMatch = Array.from(cleanText.matchAll(/\b([a-zA-Z])\((\d+)\)\s*=\s*(-?\d+(?:\.\d+)?)/gi));
  if (funcPairsMatch.length >= 2) {
    const funcName = funcPairsMatch[0][1];
    const headers = ['x', `${funcName}(x)`];
    const rows = funcPairsMatch.map((m) => [Number(m[2]), Number(m[3])]);
    candidates.push({ headers, rows });
  }

  // Extract coordinate point pairs e.g. "(1, 54), (2, 51), (3, 48), (4, 45)"
  const pointPairsMatch = Array.from(cleanText.matchAll(/\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)/g));
  if (pointPairsMatch.length >= 2) {
    const rows = pointPairsMatch.map((m) => [Number(m[1]), Number(m[2])]);
    candidates.push({ headers: ['x', 'y'], rows });
  }

  // Extract "Substituting A for x and B for g(x)"
  const subPairsMatch = Array.from(
    cleanText.matchAll(/(?:Substituting|value\s+of\s+x\s+is)\s+([-\d\.\/]+)\s+for\s+(x|t|n)\s+and\s+([-\d\.\/]+)\s+for\s+([f|g|h|p|y]\(?x?\)?)/gi)
  );
  if (subPairsMatch.length >= 2) {
    const varHeader = subPairsMatch[0][2];
    const funcHeader = subPairsMatch[0][4];
    const rows = subPairsMatch.map((m) => {
      const v1 = !isNaN(Number(m[1])) ? Number(m[1]) : m[1];
      const v2 = !isNaN(Number(m[3])) ? Number(m[3]) : m[3];
      return [v1, v2];
    });
    candidates.push({ headers: [varHeader, funcHeader], rows });
  }

  // Extract "when x is/= A, f(x)/g(x) is/= B" or "x = A, f(x) = B"
  const wordPairsMatch = Array.from(
    cleanText.matchAll(/(?:when\s+)?(?:the\s+value\s+of\s+)?([x|t|n])\s*(?:is|=|\:)\s*([-\d\.\/a-zA-Z]+)[,\s]+(?:the\s+corresponding\s+value\s+of\s+)?([f|g|h|p|y]\(?x?\)?)\s*(?:is|=|\:)\s*([-\d\.\/a-zA-Z]+)/gi)
  );
  if (wordPairsMatch.length >= 2) {
    const varHeader = wordPairsMatch[0][1];
    const funcHeader = wordPairsMatch[0][3];
    const rows = wordPairsMatch.map((m) => {
      const v1 = !isNaN(Number(m[2])) ? Number(m[2]) : m[2];
      const v2 = !isNaN(Number(m[4])) ? Number(m[4]) : m[4];
      return [v1, v2];
    });
    candidates.push({ headers: [varHeader, funcHeader], rows });
  }

  // Filter candidates to ensure strict rectangular rows matching header count
  const validCandidates = candidates.filter((c) => {
    if (!c || !c.headers || c.headers.length < 2) return false;
    if (!c.rows || c.rows.length === 0) return false;
    return c.rows.every((r) => Array.isArray(r) && r.length === c.headers.length && r.every((cell) => cell !== undefined && cell !== null && String(cell).trim() !== ''));
  });

  if (validCandidates.length === 0) return undefined;

  // Pick candidate table with maximum rows (most complete data)
  validCandidates.sort((a, b) => b.rows.length - a.rows.length);
  return validCandidates[0];
}

/**
 * Splits a line into tokens by commas, pipes, tabs, or multiple spaces.
 */
function parseLineTokens(line: string): string[] {
  if (line.includes('|')) {
    return line.split('|').map((s) => s.trim()).filter(Boolean);
  }
  if (line.includes('\t')) {
    return line.split('\t').map((s) => s.trim()).filter(Boolean);
  }
  if (line.includes(',')) {
    return line.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return line.split(/\s+/).map((s) => s.trim()).filter(Boolean);
}

