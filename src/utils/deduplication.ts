import { Question, ImportLog, ImportQuestionDetail } from '../types';

/**
 * Normalizes question prompts for robust text comparison.
 * Removes math delimiters ($), condenses whitespace, and converts to lowercase.
 */
export function normalizePrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if incoming question is a duplicate of an existing question.
 */
export function isDuplicateQuestion(
  incoming: Question,
  existingBank: Question[]
): { isDuplicate: boolean; matchedQuestion?: Question; reason?: string } {
  // 1. Direct ID match
  const idMatch = existingBank.find(
    (q) => q.id && q.id.toLowerCase().trim() === incoming.id?.toLowerCase().trim()
  );
  if (idMatch) {
    return {
      isDuplicate: true,
      matchedQuestion: idMatch,
      reason: `Exact Question ID match ("${idMatch.id}")`
    };
  }

  // 2. Normalized prompt match
  const normIncomingPrompt = normalizePrompt(incoming.prompt);
  if (normIncomingPrompt.length > 10) {
    const promptMatch = existingBank.find((q) => {
      const normExist = normalizePrompt(q.prompt);
      return normExist === normIncomingPrompt;
    });

    if (promptMatch) {
      return {
        isDuplicate: true,
        matchedQuestion: promptMatch,
        reason: `Duplicate question prompt detected (matches existing ID "${promptMatch.id}")`
      };
    }
  }

  return { isDuplicate: false };
}

export interface DeduplicationResult {
  addedQuestions: Question[];
  skippedDuplicates: { question: Question; reason: string }[];
  details: ImportQuestionDetail[];
  addedCount: number;
  duplicateCount: number;
  totalReceived: number;
}

/**
 * Deduplicates an incoming array of questions against the current question bank,
 * and also removes duplicates within the incoming array itself.
 */
export function processQuestionDeduplication(
  incomingQuestions: Question[],
  existingBank: Question[]
): DeduplicationResult {
  const addedQuestions: Question[] = [];
  const skippedDuplicates: { question: Question; reason: string }[] = [];
  const details: ImportQuestionDetail[] = [];

  // Track combined seen IDs and normalized prompts during iteration
  const seenIds = new Set<string>(
    existingBank.map((q) => q.id.toLowerCase().trim())
  );
  const seenPrompts = new Set<string>(
    existingBank.map((q) => normalizePrompt(q.prompt)).filter((p) => p.length > 10)
  );

  for (const q of incomingQuestions) {
    const cleanId = q.id && q.id.trim().length > 0 
      ? q.id.trim() 
      : `psat_${Math.random().toString(36).substring(2, 9)}`;
    
    const normPrompt = normalizePrompt(q.prompt);

    if (seenIds.has(cleanId.toLowerCase())) {
      const reason = `Question ID already exists in Question Bank ("${cleanId}")`;
      skippedDuplicates.push({ question: q, reason });
      details.push({
        id: cleanId,
        prompt: q.prompt,
        domain: q.domain,
        skill: q.skill,
        status: 'DUPLICATE_SKIPPED',
        reason
      });
      continue;
    }

    if (normPrompt.length > 10 && seenPrompts.has(normPrompt)) {
      const reason = `Duplicate prompt text already exists in Question Bank`;
      skippedDuplicates.push({ question: q, reason });
      details.push({
        id: cleanId,
        prompt: q.prompt,
        domain: q.domain,
        skill: q.skill,
        status: 'DUPLICATE_SKIPPED',
        reason
      });
      continue;
    }

    // Mark as seen and keep
    seenIds.add(cleanId.toLowerCase());
    if (normPrompt.length > 10) seenPrompts.add(normPrompt);

    const processedQ = { ...q, id: cleanId };
    addedQuestions.push(processedQ);
    details.push({
      id: cleanId,
      prompt: q.prompt,
      domain: q.domain,
      skill: q.skill,
      status: 'ADDED'
    });
  }

  return {
    addedQuestions,
    skippedDuplicates,
    details,
    addedCount: addedQuestions.length,
    duplicateCount: skippedDuplicates.length,
    totalReceived: incomingQuestions.length
  };
}

/**
 * Local storage management for Admin Import Logs
 */
const IMPORT_LOGS_KEY = 'psat_admin_import_logs_v1';

export function getStoredImportLogs(): ImportLog[] {
  try {
    const data = localStorage.getItem(IMPORT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read import logs from localStorage', e);
    return [];
  }
}

export function saveImportLog(log: Omit<ImportLog, 'id' | 'timestamp' | 'formattedDate'>): ImportLog {
  const now = new Date();
  const logs = getStoredImportLogs();
  
  const newLog: ImportLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate: now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  const updated = [newLog, ...logs].slice(0, 100); // keep last 100 logs
  try {
    localStorage.setItem(IMPORT_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save import log to localStorage', e);
  }

  return newLog;
}

export function clearStoredImportLogs(): void {
  try {
    localStorage.removeItem(IMPORT_LOGS_KEY);
  } catch (e) {
    console.error('Failed to clear import logs', e);
  }
}
