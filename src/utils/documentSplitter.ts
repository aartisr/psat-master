/**
 * Document Splitter Utility
 * 
 * A highly modular, reusable, and generic library for partitioning raw document text
 * or multi-page OCR transcripts into structured, individual question blocks.
 * 
 * Solves the "Ghost Block" and multi-question-per-page boundary grouping issues by:
 * 1. Correctly extracting page-break segments (e.g. "--- Page X ---").
 * 2. Identifying and attaching page preambles/directions to the first child question block.
 * 3. Detecting multi-question boundaries within a single page.
 * 4. Merging follow-up continuation pages cleanly into the preceding active block.
 */

export interface PageBlock {
  pageNum: number;
  text: string;
}

export interface StructuredBlock {
  text: string;
  pageNum: number;
}

export interface SplitterOptions {
  /**
   * Lookahead regex to identify individual question boundaries.
   * Defaults to identifying College Board Question ID formats.
   */
  boundaryRegex?: RegExp;

  /**
   * Regex used to verify if a split part starts with a valid question identifier
   * (distinguishing actual questions from prefix preambles).
   */
  idHeaderRegex?: RegExp;

  /**
   * Minimum character length of a non-empty part to process.
   */
  minPartLength?: number;

  /**
   * Whether to strip weird Unicode private-use characters and normalize ligatures.
   */
  normalizeText?: boolean;
}

// Default standard regular expressions matching College Board PSAT/SAT formatting
export const DEFAULT_BOUNDARY_REGEX = /(?=\b(?:Question\s*ID|ID:\s*[a-z0-9]{6,12})\b)/i;
export const DEFAULT_ID_HEADER_REGEX = /^(?:Question\s*ID|ID\s*:)/i;

/**
 * Normalizes common PDF parsing text artifacts, weird ligatures, and Unicode symbols
 */
export function normalizeDocumentText(text: string): string {
  if (!text) return '';
  return text
    // Strip private-use areas, non-printable characters, and replacement blocks
    .replace(/[\uE000-\uF8FF\uF000-\uFFFF\uFEFF\uFFFD\u25A0-\u25FF\u0000-\u0008\u000B-\u001F]/g, '')
    // Fix ligature spelling breaks
    .replace(/Di\s*ffi\s*culty/gi, 'Difficulty')
    .replace(/\bf\s*fi\b/g, 'ffi')
    .replace(/\bf\s*i\b/g, 'fi')
    .replace(/\bf\s*l\b/g, 'fl')
    .trim();
}

/**
 * Parses raw text containing explicit "--- Page [number] ---" annotations
 * and returns structured PageBlock objects.
 */
export function extractPageBlocks(rawText: string): PageBlock[] {
  if (!rawText) return [];
  const pageBlocks: PageBlock[] = [];
  const pageRegex = /--- Page (\d+) ---\n([\s\S]*?)(?=(?:--- Page \d+ ---|$))/g;
  let match;
  
  while ((match = pageRegex.exec(rawText)) !== null) {
    const pageNum = parseInt(match[1], 10);
    const text = match[2].trim();
    if (text.length > 10) {
      pageBlocks.push({ pageNum, text });
    }
  }

  return pageBlocks;
}

/**
 * Consolidates PageBlocks into logical question blocks.
 * Solves the ghost-block double-counting bug by merging header preambles into their parent questions
 * and binding continuation chunks back to the previous question page.
 */
export function consolidateDocumentBlocks(
  pageBlocks: PageBlock[],
  options: SplitterOptions = {}
): StructuredBlock[] {
  const normalize = options.normalizeText ?? false;
  const minLength = options.minPartLength ?? 15;
  const groupedBlocks: StructuredBlock[] = [];

  // Check if the entire document contains ANY Question ID patterns.
  // This helps us distinguish between structured College Board PDFs (where ID clustering is 100% precise)
  // and generic non-College Board PDFs (where we should preserve every page as standalone to avoid loss).
  let hasAnyQuestionIds = false;
  const idTestRegex = /\b(?:Question\s*ID|ID)\s*[:\s]*([a-z0-9]{6,12})\b/i;
  for (const block of pageBlocks) {
    if (idTestRegex.test(block.text)) {
      hasAnyQuestionIds = true;
      break;
    }
  }

  for (const block of pageBlocks) {
    const cleanText = normalize ? normalizeDocumentText(block.text) : block.text.trim();
    if (!cleanText) continue;

    // 1. Identify all occurrences of Question IDs in the text block
    // We look for patterns like 'Question ID abcde123' or 'ID: abcde123'
    const idRegex = /\b(?:Question\s*ID|ID)\s*[:\s]*([a-z0-9]{6,12})\b/gi;
    const matches: { id: string; index: number }[] = [];
    let match;
    while ((match = idRegex.exec(cleanText)) !== null) {
      matches.push({
        id: match[1].toLowerCase(),
        index: match.index
      });
    }

    // 2. Extract unique Question IDs in order of their first appearance
    const uniqueIdMap = new Map<string, number>(); // ID -> first index
    for (const m of matches) {
      if (!uniqueIdMap.has(m.id)) {
        uniqueIdMap.set(m.id, m.index);
      }
    }

    const uniqueIdsOrdered = Array.from(uniqueIdMap.entries())
      .sort((a, b) => a[1] - b[1]); // Sort by first-appearance index

    const n = uniqueIdsOrdered.length;

    if (n === 0) {
      if (hasAnyQuestionIds) {
        // Structured College Board document mode:
        // Since there is at least one Question ID in the document, any page lacking an ID
        // is guaranteed to be either a continuation/rationale page or a cover/instruction page.
        if (groupedBlocks.length > 0) {
          // Append to the preceding active question block. This cleanly reunites the question prompt
          // and options with its explanation/rationale page, ensuring high-fidelity extraction!
          const prevIndex = groupedBlocks.length - 1;
          groupedBlocks[prevIndex].text += `\n\n${cleanText}`;
        } else {
          // If there is no preceding question block, this is a starting cover page or instructions page.
          // Skip it entirely to prevent generating low-fidelity "ghost" questions from random header text!
          console.log(`[DocumentSplitter] Skipping cover/instruction page ${block.pageNum} containing no Question IDs.`);
        }
      } else {
        // Generic document mode (no IDs exist anywhere):
        // Treat each physical page as standalone to ensure we don't accidentally merge unrelated questions.
        groupedBlocks.push({ text: cleanText, pageNum: block.pageNum });
      }
    } else if (n === 1) {
      // Exactly one unique question on this page. Keep the entire page fully intact!
      // This is 100% immune to splitting the prompt, choices, or rationale apart.
      groupedBlocks.push({ text: cleanText, pageNum: block.pageNum });
    } else {
      // Multiple different questions exist on this single page.
      // Split the text page cleanly at the first occurrence indices of the subsequent questions.
      for (let i = 0; i < n; i++) {
        const currentIdx = uniqueIdsOrdered[i][1];
        const nextIdx = i < n - 1 ? uniqueIdsOrdered[i + 1][1] : cleanText.length;
        
        // Extract the sub-block from the page
        // For the first sub-block, include any preamble text preceding its ID (from index 0 to currentIdx)
        const start = i === 0 ? 0 : currentIdx;
        const subText = cleanText.substring(start, nextIdx).trim();
        
        if (subText.length >= minLength) {
          groupedBlocks.push({ text: subText, pageNum: block.pageNum });
        }
      }
    }
  }

  return groupedBlocks;
}

/**
 * Helper to split and segment unstructured pasted text (no page boundaries)
 * based on question dividers or numbering sequences.
 */
export function segmentPastedText(
  rawText: string,
  options: SplitterOptions = {}
): StructuredBlock[] {
  const boundaryRegex = options.boundaryRegex || /(?=\b(?:Question\s*ID|ID:\s*[a-z0-9]{6,12}|Question\s*\d+|Q\d+[\.:\s]|\d+[\.\)]\s+[A-Z])\b)/i;
  const normalize = options.normalizeText ?? false;

  const cleanRaw = rawText.replace(/--- Page \d+ ---\n?/g, '\n');
  const normalized = normalize ? normalizeDocumentText(cleanRaw) : cleanRaw.trim();
  
  const rawSplit = normalized.split(boundaryRegex);
  const chunks = rawSplit.map((c) => c.trim()).filter((c) => c.length > 20);

  // Heuristic splitting if it's still a single giant block
  if (chunks.length === 1 && normalized.length > 4000) {
    const paragraphs = normalized.split(/\n\s*\n/);
    const subChunks: StructuredBlock[] = [];
    let currentChunk = '';
    
    paragraphs.forEach((p) => {
      if (currentChunk.length + p.length > 2500) {
        subChunks.push({ text: currentChunk.trim(), pageNum: 1 });
        currentChunk = p;
      } else {
        currentChunk += `\n\n${p}`;
      }
    });
    if (currentChunk.trim().length > 0) {
      subChunks.push({ text: currentChunk.trim(), pageNum: 1 });
    }
    return subChunks;
  }

  return chunks.map((text, idx) => ({ text, pageNum: 1 }));
}
