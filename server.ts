import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { initialQuestions, searchQuestions, findRelatedQuestions } from './src/data/questions';
import { Question, ADMIN_EMAILS } from './src/types';
import { parseQuestionsLocally } from './src/utils/localQuestionParser';
import { extractGraphConfig } from './src/utils/graphParser';
import { extractTableData, isValidTable } from './src/utils/tableParser';

const _filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const _dirname = _filename ? path.dirname(_filename) : (typeof __dirname !== 'undefined' ? __dirname : process.cwd());

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// In-memory high-speed question database seeded with authentic questions
let questionDatabase: Question[] = [...initialQuestions];

// Lazy initialize Gemini client on the server side
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

function withTimeout<T>(promise: Promise<T>, ms: number = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI service request timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateGeminiContentWithFallback(ai: GoogleGenAI, requestParams: { contents: any; config?: any }, timeoutMs: number = 90000) {
  // Use a highly stable list of models prioritized by availability and high Daily Free Tier Quota limits.
  // gemini-3.6-flash is recommended directly by the Google platform notice as the latest standard model.
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash'
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;

    // Determine optimal timeout based on the model's performance footprint.
    // Lighter or legacy models get 25s to failover quickly if congested, while premium models get 45s.
    const modelTimeoutMs = (model.includes('lite') || model.includes('latest')) ? 25000 : 45000;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            contents: requestParams.contents,
            config: {
              ...requestParams.config,
              temperature: 0.0,
              seed: 42
            },
            model
          }),
          modelTimeoutMs
        );
        return response;
      } catch (err: any) {
        lastError = err;
        
        // Error objects (like the ones from Google GenAI) have non-enumerable properties like message and stack.
        // Doing JSON.stringify(err) yields "{}" for these objects. We must explicitly build a robust string 
        // using the message, status, details, and standard string representation.
        let jsonString = '';
        try {
          if (err && typeof err === 'object') {
            jsonString = JSON.stringify(err);
          }
        } catch (e) {}

        const errStr = (
          (err?.message || '') + ' ' + 
          (err?.status || '') + ' ' + 
          (err?.code || '') + ' ' +
          (err?.details ? JSON.stringify(err.details) : '') + ' ' + 
          String(err) + ' ' + 
          jsonString
        ).toLowerCase();
        
        // Instant failover check for 404 (Not Found) or 503 (Unavailable/High Demand) errors.
        // No point in retrying a model that is deprecated, missing, or overloaded when other models are healthy.
        const isNotFound = errStr.includes('not_found') || errStr.includes('404') || errStr.includes('not found') || errStr.includes('no longer available');
        const isUnavailable = errStr.includes('unavailable') || errStr.includes('503') || errStr.includes('experiencing high demand');

        if (isNotFound || isUnavailable) {
          console.warn(`[Failover] Gemini model "${model}" returned status ${isNotFound ? '404' : '503'}. Skipping remaining attempts and switching to next fallback immediately...`);
          break; // Break the attempt loop for this model, proceed to the next fallback model immediately
        }

        const isRateLimit = errStr.includes('429') || 
                            errStr.includes('resource_exhausted') || 
                            errStr.includes('quota') || 
                            errStr.includes('rate limit');

        // Check if the error is a Daily Quota Exhaustion (as opposed to a temporary per-minute rate limit)
        const isDailyLimit = errStr.includes('generaterequestsperday') || 
                             errStr.includes('requests per day') || 
                             errStr.includes('daily') ||
                             errStr.includes('perday') ||
                             errStr.includes('free_tier_requests') ||
                             (errStr.includes('resource_exhausted') && !errStr.includes('minute') && !errStr.includes('rpm'));

        if (isDailyLimit) {
          console.warn(`[Daily Limit Exhausted (429)] Gemini model "${model}" has no daily quota remaining. Skipping remaining attempts to avoid freezing UI...`);
          break; // Break the attempt loop for this model, proceed to the next fallback model immediately
        }

        if (isRateLimit && attempts < maxAttempts) {
          let delayMs = 1500;
          const matchSeconds = errStr.match(/retry in\s+([\d\.]+)\s*s/i);
          if (matchSeconds) {
            delayMs = Math.ceil(parseFloat(matchSeconds[1]) * 1000) + 200;
          } else {
            const matchMs = errStr.match(/retry in\s+([\d\.]+)\s*ms/i);
            if (matchMs) {
              delayMs = Math.ceil(parseFloat(matchMs[1])) + 100;
            }
          }

          delayMs = Math.min(Math.max(delayMs, 1000), 6000);
          console.warn(`[Rate Limit Exceeded (429)] Gemini model "${model}" hit temporary RPM limits. Retrying attempt ${attempts}/${maxAttempts} in ${delayMs}ms...`);
          await sleep(delayMs);
        } else {
          console.warn(`Gemini model "${model}" execution error/timeout on attempt ${attempts}/${maxAttempts}, attempting next fallback:`, err?.message || err);
          break; // Break and try the next fallback model
        }
      }
    }
  }
  throw lastError || new Error('All Gemini model fallbacks failed or timed out.');
}

// Admin authorization verification middleware
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userEmail = (req.headers['x-user-email'] as string || '').trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail);
  
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Question uploading and management is restricted exclusively to authorized administrators.'
    });
    return;
  }
  next();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', totalQuestions: questionDatabase.length });
});

// GET all questions or filter (Optimized sub-millisecond querying)
app.get('/api/questions', (req, res) => {
  try {
    const { query, assessment, test, domain, skill, difficulty, sortBy, page, limit: limitParam } = req.query;
    const { results, searchTimeMs } = searchQuestions(questionDatabase, {
      query: (query as string) || '',
      assessment: (assessment as string) || '',
      test: (test as string) || '',
      domain: (domain as string) || '',
      skill: (skill as string) || '',
      difficulty: (difficulty as string) || '',
      sortBy: (sortBy as any) || 'relevance'
    });

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limitParam as string, 10) || results.length;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = pageSize ? results.slice(startIndex, startIndex + pageSize) : results;

    res.json({
      success: true,
      total: questionDatabase.length,
      matchedCount: results.length,
      page: pageNum,
      pageSize,
      searchTimeMs,
      questions: paginated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch questions' });
  }
});

// GET single question by ID with related questions
app.get('/api/questions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const question = questionDatabase.find((q) => q.id.toLowerCase() === id.toLowerCase());

    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    const related = findRelatedQuestions(question, questionDatabase, 4);
    res.json({ success: true, question, related });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// ----------------- ADMIN ROUTES (RESTRICTED TO ADMINS) -----------------

// GET Admin Stats
app.get('/api/admin/stats', checkAdminAuth, (req, res) => {
  try {
    const total = questionDatabase.length;
    const mathCount = questionDatabase.filter((q) => q.test === 'Math').length;
    const readingCount = questionDatabase.filter((q) => q.test === 'Reading and Writing').length;
    
    const domainCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    
    questionDatabase.forEach((q) => {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total,
        mathCount,
        readingCount,
        domainCounts,
        difficultyCounts,
        adminUsers: ADMIN_EMAILS
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// POST Create new Question (Admin Only)
app.post('/api/admin/questions', checkAdminAuth, (req, res) => {
  try {
    const newQuestion: Question = req.body;
    if (!newQuestion.prompt || !newQuestion.correctAnswer || !newQuestion.skill) {
      res.status(400).json({ success: false, error: 'Prompt, correct answer, and skill are required.' });
      return;
    }

    if (!newQuestion.id) {
      newQuestion.id = 'adm_' + Math.random().toString(36).substring(2, 9);
    }

    const existingIdx = questionDatabase.findIndex((q) => q.id === newQuestion.id);
    if (existingIdx >= 0) {
      questionDatabase[existingIdx] = newQuestion;
    } else {
      questionDatabase.unshift(newQuestion);
    }

    res.json({ success: true, question: newQuestion, totalCount: questionDatabase.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// PUT Update Question (Admin Only)
app.put('/api/admin/questions/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const idx = questionDatabase.findIndex((q) => q.id.toLowerCase() === id.toLowerCase());

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    questionDatabase[idx] = { ...questionDatabase[idx], ...updatedData };
    res.json({ success: true, question: questionDatabase[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// DELETE Question (Admin Only)
app.delete('/api/admin/questions/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const initialLen = questionDatabase.length;
    questionDatabase = questionDatabase.filter((q) => q.id.toLowerCase() !== id.toLowerCase());

    if (questionDatabase.length === initialLen) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    res.json({ success: true, remainingCount: questionDatabase.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// POST Extract Questions via AI Extractor or Local Deterministic Parser (Admin Only)
app.post('/api/admin/extract-questions', checkAdminAuth, async (req, res) => {
  try {
    const { rawText, fileBase64, mimeType, assessment } = req.body;
    if (!rawText && !fileBase64) {
      res.status(400).json({ success: false, error: 'Please provide valid question text or upload a PDF/image file.' });
      return;
    }

    // 1. Instant local deterministic parser check
    if (rawText) {
      const localParsed = parseQuestionsLocally(rawText, assessment || 'PSAT/NMSQT');
      if (localParsed.length > 0) {
        res.json({
          success: true,
          extractedCount: localParsed.length,
          questions: localParsed,
          parserMode: 'local_deterministic'
        });
        return;
      }
    }

    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
      const localParsed = rawText ? parseQuestionsLocally(rawText, assessment || 'PSAT/NMSQT') : [];
      if (localParsed.length > 0) {
        res.json({
          success: true,
          extractedCount: localParsed.length,
          questions: localParsed,
          parserMode: 'local_deterministic'
        });
        return;
      }
      res.status(400).json({ success: false, error: 'GEMINI_API_KEY is missing on server and text could not be parsed locally.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const promptText = `Extract all PSAT/SAT questions from the provided document/text into a structured JSON array matching this schema:
CRITICAL REQUIREMENT FOR 100% ACCURACY:
- You MUST capture the "prompt" and "options" text with 100% literal, verbatim accuracy.
- You are strictly forbidden from summarizing, paraphrasing, simplifying, truncating, editing, or rewriting any part of the question text or options.
- Every single word, sentence, variable, number, and mathematical formula must exactly match the original source text.
- Do not omit introductory sentences, tables, context clauses, or labels.
- Format mathematical equations and variables nicely with LaTeX math enclosed in $ (inline) or $$ (block), e.g. "$x$," "$f(x) = x^2$".

Each item MUST have:
- "id": 8-char hex or clean ID string (e.g. "psat_${Math.random().toString(36).substring(2, 8)}")
- "assessment": "${assessment || 'PSAT/NMSQT'}"
- "test": "Math" | "Reading and Writing"
- "domain": "Algebra" | "Advanced Math" | "Problem-Solving and Data Analysis" | "Geometry and Trigonometry" | "Information and Ideas" | "Craft and Structure" | "Expression of Ideas" | "Standard English Conventions"
- "skill": string (e.g. "Linear equations in two variables", "Inferences")
- "difficulty": "Easy" | "Medium" | "Hard"
- "type": "multiple_choice" | "free_response"
- "prompt": question prompt text (formatted nicely with LaTeX math enclosed in $ or $$ if math equations exist)
- "options": optional array of { "label": "A"|"B"|"C"|"D", "text": "option text" }
- "correctAnswer": correct answer letter or numeric string
- "rationale": complete and comprehensive rationale explaining step-by-step. CRITICAL: You MUST transcribe the ENTIRE explanation section verbatim from the source. This includes the explanation of why the correct choice is correct AND the explanations of why all other choices (Choice A, B, C, D) are incorrect (e.g., "Choice A is incorrect... Choice B is incorrect..."). NEVER truncate, shorten, summarize, or omit any paragraphs explaining incorrect options. Format paragraphs with double newlines (\n\n) to preserve the original visual layout and spacing of each explanation paragraph (e.g. choice D correct, choice A incorrect, choice B incorrect, choice C incorrect each in separate paragraphs). All mathematical variables (x, y, etc.) and equations used in the explanation must be accurately transcribed and formatted using LaTeX.
- "hints": array of 3 progressive hints
- "concepts": array of 3-5 concept keywords
- "tableData": optional object if the question has a data table (e.g. values of x and g(x), frequencies, or rows of data) with { "title": optional string, "headers": ["col1", "col2"], "rows": [["val1", "val2"], ...] }

${rawText ? `Input Text snippet:\n${rawText.slice(0, 20000)}` : ''}`;

      const contents: any[] = [];
      // Only include the full page image payload if we don't have extracted text, or if the text is extremely short.
      // If we have long raw text, the image is redundant and causes slow requests or timeouts on free tiers.
      if (fileBase64 && (!rawText || rawText.length < 300)) {
        contents.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: fileBase64.split(',')[1] || fileBase64
          }
        });
      }
      contents.push({ text: promptText });

      const geminiResult1 = await generateGeminiContentWithFallback(ai, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                assessment: { type: Type.STRING },
                test: { type: Type.STRING },
                domain: { type: Type.STRING },
                skill: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                type: { type: Type.STRING },
                prompt: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                rationale: { type: Type.STRING },
                tableData: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    headers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    rows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    }
                  }
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ['label', 'text']
                  }
                },
                hints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      level: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      hint: { type: Type.STRING }
                    },
                    required: ['level', 'title', 'hint']
                  }
                },
                concepts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['id', 'assessment', 'test', 'domain', 'skill', 'difficulty', 'type', 'prompt', 'correctAnswer', 'rationale', 'hints', 'concepts']
            }
          }
        }
      });

      const parsedQuestions: Question[] = JSON.parse(geminiResult1.text || '[]');
      parsedQuestions.forEach((q) => {
        if (!q.graphConfig) {
          const gc = extractGraphConfig(q.prompt, {
            rationale: q.rationale,
            options: q.options,
            correctAnswer: q.correctAnswer,
            prompt: q.prompt
          });
          if (gc) q.graphConfig = gc;
        }

        // Validate and auto-recover/upgrade tableData
        const promptHasTable = /\b(?:table|data\s+table|given\s+in\s+the\s+table|shown\s+in\s+the\s+table|values\s+in\s+the\s+table|\|)\b/i.test(q.prompt || '') || isValidTable(q.tableData);
        if (promptHasTable) {
          const extractedTd = (rawText ? extractTableData(rawText) : undefined) || extractTableData(q.prompt) || extractTableData(q.rationale);
          if (isValidTable(extractedTd)) {
            if (!isValidTable(q.tableData) || extractedTd.rows.length > q.tableData.rows.length) {
              q.tableData = extractedTd;
            }
          }
        } else {
          delete q.tableData;
        }
      });
      res.json({
        success: true,
        extractedCount: parsedQuestions.length,
        questions: parsedQuestions,
        parserMode: 'gemini_ai'
      });
    } catch (aiErr: any) {
      console.warn('Gemini extraction error or timeout, falling back to local deterministic parser:', aiErr?.message);
      const fallbackParsed = rawText ? parseQuestionsLocally(rawText, assessment || 'PSAT/NMSQT') : [];
      if (fallbackParsed.length > 0) {
        res.json({
          success: true,
          extractedCount: fallbackParsed.length,
          questions: fallbackParsed,
          parserMode: 'local_deterministic'
        });
      } else {
        throw aiErr;
      }
    }
  } catch (error: any) {
    console.error('Extract questions error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to extract questions' });
  }
});

// POST Import PDF / Text Questions (Admin Only)
app.post('/api/questions/import-text', checkAdminAuth, async (req, res) => {
  try {
    const { rawText, fileBase64, diagramBase64, mimeType, assessmentType, forceAI } = req.body;
    if (!rawText && !fileBase64) {
      res.status(400).json({ success: false, error: 'Please select a PDF file or paste valid question text.' });
      return;
    }

    // 1. Instant local deterministic parser check
    if (rawText && !forceAI) {
      const localParsed = parseQuestionsLocally(rawText, assessmentType || 'PSAT/NMSQT');
      if (localParsed.length > 0) {
        localParsed.forEach((newQ) => {
          const idx = questionDatabase.findIndex((q) => q.id === newQ.id);
          if (idx >= 0) {
            questionDatabase[idx] = newQ;
          } else {
            questionDatabase.unshift(newQ);
          }
        });

        res.json({
          success: true,
          importedCount: localParsed.length,
          totalCount: questionDatabase.length,
          questions: localParsed,
          parserMode: 'local_deterministic'
        });
        return;
      }
    }

    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
      const localParsed = rawText ? parseQuestionsLocally(rawText, assessmentType || 'PSAT/NMSQT') : [];
      if (localParsed.length > 0) {
        res.json({
          success: true,
          importedCount: localParsed.length,
          totalCount: questionDatabase.length,
          questions: localParsed,
          parserMode: 'local_deterministic'
        });
        return;
      }
      res.status(400).json({ success: false, error: 'GEMINI_API_KEY is missing on server and text could not be parsed locally.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const promptText = `Extract all PSAT/SAT questions from the provided image and text into a structured JSON array.
CRITICAL: The text layer may be missing mathematical variables (like x, y, numbers). You MUST use the visual image to accurately transcribe all equations, variables, and values.

CRITICAL REQUIREMENT FOR 100% ACCURACY:
- You MUST capture the "prompt" and "options" text with 100% literal, verbatim accuracy.
- You are strictly forbidden from summarizing, paraphrasing, simplifying, truncating, editing, or rewriting any part of the question text or options.
- Every single word, sentence, variable, number, and mathematical formula must exactly match the original source document.
- Do not omit introductory sentences, tables, context clauses, or labels.
- Format mathematical equations and variables nicely with LaTeX math enclosed in $ (inline) or $$ (block), e.g. "$x$," "$f(x) = x^2$".

WARNING AGAINST HALLUCINATING FAMOUS/STANDARD QUESTIONS:
- Many questions in this document are custom-modified or adapted from famous/standard SAT/PSAT questions to use custom values and variables (e.g. changing standard charges of $150 and $45 to customized charges of $20.00 and $9.50, or variable h to x).
- You MUST transcribe the EXACT, SPECIFIC numbers, dollar amounts, variables, and values displayed on the provided page image and text. 
- NEVER assume or substitute numbers based on your pre-trained memory of standard or famous versions of the question.

Each item MUST have:
- "id": 8-char hex or clean ID string (e.g. "psat_${Math.random().toString(36).substring(2, 8)}")
- "assessment": "${assessmentType || 'PSAT/NMSQT'}"
- "test": "Math" | "Reading and Writing"
- "domain": "Algebra" | "Advanced Math" | "Problem-Solving and Data Analysis" | "Geometry and Trigonometry" | "Information and Ideas" | "Craft and Structure" | "Expression of Ideas" | "Standard English Conventions"
- "skill": string (e.g. "Linear equations in two variables", "Systems of two linear equations in two variables", "Inferences", "Transitions")
- "difficulty": "Easy" | "Medium" | "Hard"
- "type": "multiple_choice" | "free_response"
- "prompt": question prompt text
- "options": optional array of { "label": "A"|"B"|"C"|"D", "text": "option text" }
- "correctAnswer": correct answer letter or numeric string
- "rationale": complete and comprehensive rationale explaining step-by-step. CRITICAL: You MUST transcribe the ENTIRE explanation section verbatim from the source. This includes the explanation of why the correct choice is correct AND the explanations of why all other choices (Choice A, B, C, D) are incorrect (e.g., "Choice A is incorrect... Choice B is incorrect..."). NEVER truncate, shorten, summarize, or omit any paragraphs explaining incorrect options. Format paragraphs with double newlines (\\n\\n) to preserve the original visual layout and spacing of each explanation paragraph (e.g. choice D correct, choice A incorrect, choice B incorrect, choice C incorrect each in separate paragraphs). All mathematical variables (x, y, etc.) and equations used in the explanation must be accurately transcribed and formatted using LaTeX.
- "hints": array of 3 progressive hints: [{ "level": 1, "title": "...", "hint": "..." }, { "level": 2, "title": "...", "hint": "..." }, { "level": 3, "title": "...", "hint": "..." }]
- "concepts": array of 3-5 concept keywords
- "tableData": optional object if the question has a data table (e.g. values of x and g(x), frequencies, or data rows) with { "title": optional string, "headers": ["col1", "col2"], "rows": [["val1", "val2"], ...] }

${rawText ? `Input Text Reference (may be incomplete):\n${rawText.slice(0, 10000)}` : ''}`;

      const contents: any[] = [];
      
      // Always prioritize the full page image (fileBase64) if available, as it contains 
      // the exact, uncorrupted visual rendering of all equations, text, numbers, and graphs 
      // on the entire page. This eliminates hallucination/priors leaking from famous questions.
      if (fileBase64) {
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: fileBase64.split(',')[1] || fileBase64
          }
        });
      } else if (diagramBase64) {
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: diagramBase64.split(',')[1] || diagramBase64
          }
        });
      }
      contents.push({ text: promptText });

      const geminiResult2 = await generateGeminiContentWithFallback(ai, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                assessment: { type: Type.STRING },
                test: { type: Type.STRING },
                domain: { type: Type.STRING },
                skill: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                type: { type: Type.STRING },
                prompt: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                rationale: { type: Type.STRING },
                tableData: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    headers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    rows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    }
                  }
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ['label', 'text']
                  }
                },
                hints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      level: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      hint: { type: Type.STRING }
                    },
                    required: ['level', 'title', 'hint']
                  }
                },
                concepts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['id', 'assessment', 'test', 'domain', 'skill', 'difficulty', 'type', 'prompt', 'correctAnswer', 'rationale', 'hints', 'concepts']
            }
          }
        }
      });

      const parsedQuestions: Question[] = JSON.parse(geminiResult2.text || '[]');

      if (parsedQuestions.length > 0) {
        parsedQuestions.forEach((newQ) => {
          if (!newQ.graphConfig) {
            const gc = extractGraphConfig(newQ.prompt, {
              rationale: newQ.rationale,
              options: newQ.options,
              correctAnswer: newQ.correctAnswer,
              prompt: newQ.prompt
            });
            if (gc) newQ.graphConfig = gc;
          }

          // Validate and auto-recover/upgrade tableData
          const promptHasTable = /\b(?:table|data\s+table|given\s+in\s+the\s+table|shown\s+in\s+the\s+table|values\s+in\s+the\s+table|\|)\b/i.test(newQ.prompt || '') || isValidTable(newQ.tableData);
          if (promptHasTable) {
            const extractedTd = (rawText ? extractTableData(rawText) : undefined) || extractTableData(newQ.prompt) || extractTableData(newQ.rationale);
            if (isValidTable(extractedTd)) {
              if (!isValidTable(newQ.tableData) || extractedTd.rows.length > newQ.tableData.rows.length) {
                newQ.tableData = extractedTd;
              }
            }
          } else {
            delete newQ.tableData;
          }

          const idx = questionDatabase.findIndex((q) => q.id === newQ.id);
          if (idx >= 0) {
            questionDatabase[idx] = newQ;
          } else {
            questionDatabase.unshift(newQ);
          }
        });
      }

      res.json({
        success: true,
        importedCount: parsedQuestions.length,
        totalCount: questionDatabase.length,
        questions: parsedQuestions,
        parserMode: 'gemini_ai'
      });
    } catch (aiErr: any) {
      console.warn('Gemini import error or timeout, falling back to local deterministic parser:', aiErr?.message);
      const fallbackParsed = rawText ? parseQuestionsLocally(rawText, assessmentType || 'PSAT/NMSQT') : [];
      if (fallbackParsed.length > 0) {
        fallbackParsed.forEach((newQ) => {
          const idx = questionDatabase.findIndex((q) => q.id === newQ.id);
          if (idx >= 0) {
            questionDatabase[idx] = newQ;
          } else {
            questionDatabase.unshift(newQ);
          }
        });

        res.json({
          success: true,
          importedCount: fallbackParsed.length,
          totalCount: questionDatabase.length,
          questions: fallbackParsed,
          parserMode: 'local_deterministic'
        });
      } else {
        throw aiErr;
      }
    }
  } catch (error: any) {
    console.error('Import questions error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to import questions' });
  }
});

// ----------------- AI PEDAGOGY APIS -----------------

// POST AI Socratic Hint
app.post('/api/gemini/hint', async (req, res) => {
  try {
    const { questionId, currentLevel, userNotes } = req.body;
    const question = questionDatabase.find((q) => q.id === questionId);

    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
      const existingHint = question.hints.find((h) => h.level === currentLevel) || question.hints[0];
      res.json({
        success: true,
        hintTitle: existingHint?.title || `Hint Level ${currentLevel}`,
        hintText: existingHint?.hint || 'Review the given equations and identify key mathematical relationships.'
      });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert PSAT tutor.
Question:
${question.prompt}
Domain: ${question.domain}, Skill: ${question.skill}
Rationale / Solution: ${question.rationale}
Correct Answer (DO NOT REVEAL DIRECTLY): ${question.correctAnswer}

Current Hint Level requested: Level ${currentLevel} of 3 (Level 1 = Concept direction, Level 2 = First algebraic/setup step, Level 3 = Specific tactical clue).
Student's working thoughts/notes: "${userNotes || 'None provided'}"

Provide a concise, encouraging hint for Level ${currentLevel}.
CRITICAL RULE: DO NOT state the correct answer letter or final value directly. Guide the student to realize the step themselves. Keep under 3 sentences.`;

    const geminiResult = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: 'You are a master PSAT tutor specializing in Socratic pedagogical hints without spoiling answers.'
      }
    });

    res.json({
      success: true,
      hintTitle: `Level ${currentLevel} Socratic Guidance`,
      hintText: geminiResult.text || 'Focus on isolating the target variable step by step.'
    });
  } catch (error: any) {
    console.warn('Gemini hint error/timeout, using static fallback:', error?.message || error);
    const questionId = req.body?.questionId;
    const currentLevel = req.body?.currentLevel || 1;
    const question = questionDatabase.find((q) => q.id === questionId);
    const existingHint = question?.hints?.find((h) => h.level === currentLevel) || question?.hints?.[0];
    res.json({
      success: true,
      hintTitle: existingHint?.title || `Level ${currentLevel} Guidance`,
      hintText: existingHint?.hint || 'Review the problem details carefully and work through step-by-step.'
    });
  }
});

// POST AI Detailed Breakdown & Trap Analysis
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { questionId } = req.body;
    const question = questionDatabase.find((q) => q.id === questionId);

    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
      res.json({
        success: true,
        breakdown: question.rationale,
        keyRule: `Rule: For ${question.skill}, consistently apply standard properties and check edge cases.`,
        commonPitfalls: 'Avoid arithmetic errors when handling negative signs or distributive multiplication.'
      });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `You are a PSAT exam strategist. Break down this PSAT problem:
Question Prompt: ${question.prompt}
Domain: ${question.domain} | Skill: ${question.skill} | Difficulty: ${question.difficulty}
Official Rationale: ${question.rationale}
Correct Answer: ${question.correctAnswer}

Provide structured analysis in JSON:
1. "stepByStep": Clear, beautifully formatted step-by-step walkthrough of the solution.
2. "coreRule": The 1-sentence golden rule for this concept on the PSAT.
3. "commonTrap": The most common wrong answer trap and why students fall into it.
4. "timeSavingTip": A 10-second mental shortcut or test strategy.`;

    const geminiResult = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stepByStep: { type: Type.STRING },
            coreRule: { type: Type.STRING },
            commonTrap: { type: Type.STRING },
            timeSavingTip: { type: Type.STRING }
          },
          required: ['stepByStep', 'coreRule', 'commonTrap', 'timeSavingTip']
        }
      }
    });

    const parsed = JSON.parse(geminiResult.text || '{}');
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.warn('Gemini explain error/timeout, using static fallback:', error?.message || error);
    const questionId = req.body?.questionId;
    const question = questionDatabase.find((q) => q.id === questionId);
    res.json({
      success: true,
      stepByStep: question?.rationale || 'Review problem statement step-by-step.',
      coreRule: `Golden Rule: For ${question?.skill || 'PSAT questions'}, systematically isolate key components and verify edge cases.`,
      commonTrap: 'Watch out for misreading key terms or making arithmetic errors.',
      timeSavingTip: 'Eliminate obviously incorrect choices first to save time.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PSAT Practice Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}

