import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, File, Trash2 } from 'lucide-react';
import { Question, UserProfile, isUserAdmin, ADMIN_EMAILS } from '../types';
import { syncCustomQuestionToFirestore, bulkSyncCustomQuestionsToFirestore } from '../lib/firebase';
import { extractTextAndImagesFromPdfBuffer, shouldAttachVisualReference } from '../utils/pdfExtractor';
import { parseQuestionsLocally } from '../utils/localQuestionParser';
import { extractGraphConfig } from '../utils/graphParser';
import { extractTableData, isValidTable } from '../utils/tableParser';
import { repairQuestion } from '../utils/questionAuditor';
import { ImportProgressEngager } from './common/ImportProgressEngager';
import { extractPageBlocks, consolidateDocumentBlocks, segmentPastedText } from '../utils/documentSplitter';
import { VerificationDiffModal } from './admin/VerificationDiffModal';

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onQuestionsImported: (imported: Question[]) => void;
}

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onQuestionsImported
}) => {
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [fullPageImages, setFullPageImages] = useState<Record<number, string>>({});
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [readingStatus, setReadingStatus] = useState('Reading PDF & harvesting pages...');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chunked importing and tracking state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Waiting for file or text import...');
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [importedQuestionsCount, setImportedQuestionsCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);

  // Side-by-side Verification Diff State
  const [parsedForReview, setParsedForReview] = useState<{ question: Question; pageNum?: number }[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isAdmin = isUserAdmin(currentUser?.email);
  const isBusy = isLoading || isReadingFile;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    if (isBusy) return;
    setError(null);
    setIsReadingFile(true);
    setReadingStatus(`Reading "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
    setTelemetryLogs([`[0ms] Initializing PDF file reader for "${file.name}"...`]);

    try {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit. Please upload a smaller file or paste text snippets.');
        setIsReadingFile(false);
        return;
      }

      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        const text = await file.text();
        setRawText(text || '');
        setSelectedFile({
          name: file.name,
          size: `${sizeMb} MB`,
          base64: '',
          mimeType: 'text/plain'
        });
        setTelemetryLogs((prev) => [...prev, '✓ Text file loaded into editor successfully.']);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setReadingStatus('Extracting PDF text streams & harvesting page renders...');
        setTelemetryLogs((prev) => [...prev, 'Parsing PDF document structure & pages in browser memory...']);

        // Read ArrayBuffer for client-side PDF text extraction and visual diagram harvesting
        const arrayBuffer = await file.arrayBuffer();
        const { text: extractedPdfText, pageImages: extractedImgs, fullPageImages: extractedFullImgs } = await extractTextAndImagesFromPdfBuffer(arrayBuffer, fastMode);
        
        setPageImages(extractedImgs);
        setFullPageImages(extractedFullImgs);
        if (extractedPdfText) {
          setRawText((prev) => (prev ? `${prev}\n\n${extractedPdfText}` : extractedPdfText));
        }

        const pageCount = Object.keys(extractedFullImgs).length;
        setSelectedFile({
          name: file.name,
          size: `${sizeMb} MB (${pageCount} page${pageCount > 1 ? 's' : ''} • Visual AI Ready)`,
          base64: '',
          mimeType: 'application/pdf'
        });
        setTelemetryLogs((prev) => [...prev, `✓ Extracted ${pageCount} PDF page(s) and associated visual diagrams.`]);
      } else {
        // Images or other supported formats
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = (event) => {
            const result = event.target?.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.readAsDataURL(file);
        });

        setSelectedFile({
          name: file.name,
          size: `${sizeMb} MB`,
          base64: base64Data,
          mimeType: file.type || 'image/png'
        });
        setTelemetryLogs((prev) => [...prev, '✓ Image asset preprocessed for AI analysis.']);
      }
    } catch (err: any) {
      console.error('Error processing uploaded file:', err);
      setError(`Failed to read file "${file.name}": ${err.message || err}`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPageImages({});
    setFullPageImages({});
    setRawText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!isAdmin) {
      setError(`Question upload is restricted to authorized administrators (${ADMIN_EMAILS.join(', ')}).`);
      return;
    }

    if (!rawText.trim() && !selectedFile?.base64) {
      setError('Please upload a PDF file or paste text content from your PSAT material.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessCount(null);
    setImportedQuestionsCount(0);
    setIsComplete(false);
    setCurrentStepIndex(0);
    setStatusMsg('Analyzing document layout...');
    setTelemetryLogs(['[0ms] Initiating multi-page parsing pipeline...']);

    // 1. Chunk/Page splitting with strict page index extraction using generic modular splitter utility
    let queue: { text: string; idx: number; pageNum?: number }[] = [];
    if (rawText.includes('--- Page ')) {
      const pageBlocks = extractPageBlocks(rawText);
      const groupedBlocks = consolidateDocumentBlocks(pageBlocks);

      queue = groupedBlocks.map((block, index) => ({
        text: block.text,
        idx: index,
        pageNum: block.pageNum
      }));
      setTelemetryLogs((prev) => [
        ...prev,
        `Consolidated ${pageBlocks.length} pages into ${queue.length} coherent question blocks using the generic modular splitter.`
      ]);
    } else {
      const groupedChunks = segmentPastedText(rawText);
      queue = groupedChunks.map((block, index) => ({
        text: block.text,
        idx: index,
        pageNum: block.pageNum
      }));
      setTelemetryLogs((prev) => [...prev, `Pasted text segmented into ${queue.length} logical block(s) using modular splitter.`]);
    }

    if (queue.length === 0) {
      setError('No parseable question text blocks found.');
      setIsLoading(false);
      return;
    }

    const allImportedQuestions: { question: Question; pageNum?: number }[] = [];
    const concurrency = 1; // Run sequentially to stay within free tier rate limits
    let processedChunks = 0;
    const totalChunks = queue.length;

    // Define task queue and execution worker threads
    const executeQueue = async () => {
      const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;

          const { text, idx, pageNum } = item;
          try {
            // If we have already hit a quota limit, bypass AI calls entirely and parse locally
            if (isQuotaExhausted) {
              setTelemetryLogs((prev) => [
                ...prev,
                `ℹ️ [Page ${idx + 1}/${totalChunks}] Shared Gemini API Quota Reached. Sifting to Local Engine (0ms network delay)...`
              ]);
              const localParsed = parseQuestionsLocally(text).map((q) => {
                const mentionsVisual = shouldAttachVisualReference(q.prompt);
                if (mentionsVisual && pageNum && pageImages[pageNum]) {
                  return { ...q, imageUrl: pageImages[pageNum] };
                }
                return q;
              });

              if (localParsed.length > 0) {
                allImportedQuestions.push(...localParsed.map((q) => ({ question: q, pageNum, pageText: text })));
                setImportedQuestionsCount((prev) => prev + localParsed.length);
                setTelemetryLogs((prev) => [
                  ...prev,
                  `✓ [Page ${idx + 1}] Imported ${localParsed.length} question(s) instantly via Local Engine.`
                ]);
              } else {
                setTelemetryLogs((prev) => [
                  ...prev,
                  `⚠️ [Page ${idx + 1}] Local parser could not match question patterns. Block skipped.`
                ]);
              }
              processedChunks++;
              const percent = Math.round((processedChunks / totalChunks) * 100);
              setCurrentStepIndex(Math.min(Math.floor(percent / 25), 4));
              continue;
            }

            // Pacing cooldown: pause for 800ms between page parsing requests to prevent hitting rate limits
            if (processedChunks > 0) {
              await new Promise((resolve) => setTimeout(resolve, 800));
            }

            setStatusMsg(`Parsing page ${idx + 1} of ${totalChunks}...`);
            setTelemetryLogs((prev) => [
              ...prev,
              `[Page ${idx + 1}/${totalChunks}] Starting high-accuracy Gemini extraction...`
            ]);

             // Call backend API with lightweight single-page text AND full page image for multimodal precision
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout per page

            const res = await fetch('/api/questions/import-text', {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUser?.email || ''
              },
              body: JSON.stringify({
                rawText: text,
                fileBase64: pageNum ? (fullPageImages[pageNum] || null) : null, // High-fidelity full page screenshot for precise multimodal parsing!
                diagramBase64: pageNum && !fastMode ? (pageImages[pageNum] || null) : null,
                mimeType: 'text/plain',
                forceAI: !fastMode
              })
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
              const errBody = await res.text().catch(() => '');
              const isQuotaErr = res.status === 429 || errBody.includes('quota') || errBody.includes('RESOURCE_EXHAUSTED') || errBody.includes('Rate Limit Exceeded') || errBody.includes('rate-limits');
              if (isQuotaErr) {
                setIsQuotaExhausted(true);
                throw new Error('Google Gemini API Quota Exceeded (429)');
              }
              throw new Error(`Server returned HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.success && data.questions && data.questions.length > 0) {
              const parsedQs: Question[] = data.questions.map((q: any) => {
                let updatedQ = { ...q };
                if (!updatedQ.graphConfig) {
                  const gc = extractGraphConfig(updatedQ.prompt, {
                    rationale: updatedQ.rationale,
                    options: updatedQ.options,
                    correctAnswer: updatedQ.correctAnswer,
                    prompt: updatedQ.prompt
                  });
                  if (gc) updatedQ.graphConfig = gc;
                }
                // Automatic table and LaTeX repair with page context
                updatedQ = repairQuestion(updatedQ, text);

                // Strictly attach cropped reference image ONLY if the individual question actually references a visual diagram
                const mentionsVisual = shouldAttachVisualReference(updatedQ.prompt);
                if (mentionsVisual && pageNum && pageImages[pageNum]) {
                  updatedQ.imageUrl = pageImages[pageNum];
                }
                return updatedQ;
              });

              allImportedQuestions.push(...parsedQs.map((q) => ({ question: q, pageNum, pageText: text })));
              setImportedQuestionsCount((prev) => prev + parsedQs.length);
              setTelemetryLogs((prev) => [
                ...prev,
                `✓ [Page ${idx + 1}] Successfully parsed ${parsedQs.length} question(s) via Gemini AI.`
              ]);
            } else {
              // Local deterministic fallback
              const localParsed = parseQuestionsLocally(text).map((q) => {
                const mentionsVisual = shouldAttachVisualReference(q.prompt);
                if (mentionsVisual && pageNum && pageImages[pageNum]) {
                  return { ...q, imageUrl: pageImages[pageNum] };
                }
                return q;
              });

              if (localParsed.length > 0) {
                allImportedQuestions.push(...localParsed.map((q) => ({ question: q, pageNum, pageText: text })));
                setImportedQuestionsCount((prev) => prev + localParsed.length);
                setTelemetryLogs((prev) => [
                  ...prev,
                  `✓ [Page ${idx + 1}] Imported ${localParsed.length} question(s) via Local Engine (AI Fallback).`
                ]);
              } else {
                setTelemetryLogs((prev) => [
                  ...prev,
                  `⚠️ [Page ${idx + 1}] No question patterns matched. Block skipped.`
                ]);
              }
            }
          } catch (err: any) {
            const isQuotaErr = err.message?.includes('Quota') || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('rate-limits') || String(err).includes('quota');
            if (isQuotaErr) {
              setIsQuotaExhausted(true);
              setTelemetryLogs((prev) => [
                ...prev,
                `⚠️ [Page ${idx + 1}] API Quota Exceeded. Sifting to Local Parsing Engine for the rest of the file...`
              ]);
            } else {
              console.warn(`[Page ${idx + 1}] Chunk error, trying local fallback:`, err);
            }

            // Local fallback on network timeout/error
            const localParsed = parseQuestionsLocally(text).map((q) => {
              const mentionsVisual = shouldAttachVisualReference(q.prompt);
              if (mentionsVisual && pageNum && pageImages[pageNum]) {
                return { ...q, imageUrl: pageImages[pageNum] };
              }
              return q;
            });

            if (localParsed.length > 0) {
              allImportedQuestions.push(...localParsed.map((q) => ({ question: q, pageNum, pageText: text })));
              setImportedQuestionsCount((prev) => prev + localParsed.length);
              setTelemetryLogs((prev) => [
                ...prev,
                `✓ [Page ${idx + 1}] Imported ${localParsed.length} question(s) via Local Engine (Network Error Fallback).`
              ]);
            } else {
              setTelemetryLogs((prev) => [
                ...prev,
                `✗ [Page ${idx + 1}] Import failed: ${err.message || err}`
              ]);
            }
          } finally {
            processedChunks++;
            const percent = Math.round((processedChunks / totalChunks) * 100);
            setCurrentStepIndex(Math.min(Math.floor(percent / 25), 4));
          }
        }
      });

      await Promise.all(workers);
    };

    try {
      await executeQueue();

      if (allImportedQuestions.length > 0) {
        setIsLoading(false);
        setParsedForReview(allImportedQuestions);
        setShowReviewModal(true);
      } else {
        setError('No valid questions could be extracted from this document. Please check the text formatting and verify your administrator privileges.');
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during import queue processing.');
      setIsLoading(false);
    }
  };

  const handleFinalConfirmFromReview = (finalQuestions: Question[]) => {
    setShowReviewModal(false);
    setIsComplete(true);
    setSuccessCount(finalQuestions.length);
    setStatusMsg(`Successfully verified and imported ${finalQuestions.length} questions into your bank!`);
    onQuestionsImported(finalQuestions);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSamplePaste = () => {
    setSelectedFile(null);
    setRawText(`Assessment: PSAT 8/9
Test: Math
Domain: Algebra
Skill: Linear equations in two variables
Difficulty: Medium
Question ID: 3e8f99a1
Prompt: A music school charges a one-time registration fee of $35 plus $25 per private lesson. If a student spent a total of $235 on private lessons and registration, how many private lessons did the student take?
A) 6
B) 8
C) 9
D) 10
Correct Answer: B
Rationale: The total cost equation is 35 + 25x = 235, where x is the number of lessons. Subtract 35 from both sides: 25x = 200. Divide by 25: x = 8. Therefore, the student took 8 lessons.`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (!isBusy && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-full max-w-2xl my-auto max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Import PSAT PDF / Questions</h3>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded">
                    ADMIN MODE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 rounded">
                    ADMIN ONLY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isReadingFile 
                  ? 'Please wait while pages are being extracted and preprocessed...'
                  : isLoading 
                  ? 'Processing questions with high-precision AI pipeline...' 
                  : 'Upload PDF files or paste raw text extracted from College Board PSAT PDFs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { if (!isBusy) onClose(); }}
            disabled={isBusy}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title={isBusy ? 'Operation in progress...' : 'Close modal'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {isReadingFile ? (
            <ImportProgressEngager
              title="Reading & Preparing Document"
              subtitle="Extracting text layers, rendering pages, and harvesting visual diagrams"
              currentStepIndex={0}
              statusMessage={readingStatus}
              logs={telemetryLogs}
              itemCount={1}
              isComplete={false}
            />
          ) : isLoading ? (
            <ImportProgressEngager
              title="Parsing & Persisting Questions"
              subtitle="Validating schema, generating Socratic hints, and syncing to Firestore database"
              currentStepIndex={currentStepIndex}
              statusMessage={statusMsg}
              logs={telemetryLogs}
              itemCount={importedQuestionsCount}
              isComplete={isComplete}
            />
          ) : !isAdmin ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Question Uploading is Restricted to Administrators</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Only verified administrator accounts (<strong className="text-amber-950">ravikumar.raman@gmail.com</strong> and <strong className="text-amber-950">aarti.sri.ravikumar@gmail.com</strong>) are authorized to upload and publish new questions.
              </p>
              <p className="text-[11px] text-amber-800">
                Please click <strong>Sign In</strong> in the top header and sign in with your administrator Google account to upload files.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Drop Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. Upload PDF or Question Document
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer group" title="Bypass image rendering for lightning-fast text processing (skips math/diagram parsing)">
                    <input 
                      type="checkbox" 
                      checked={fastMode} 
                      disabled={isBusy}
                      onChange={(e) => setFastMode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-slate-800 transition-colors">Fast Text-Only Mode</span>
                  </label>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt,.json,.png,.jpg,.jpeg"
                  disabled={isBusy}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-indigo-600">{selectedFile.size} &bull; Ready for AI extraction</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={isBusy}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => { if (!isBusy) fileInputRef.current?.click(); }}
                    className={`p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/40 rounded-2xl text-center transition-all group ${
                      isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">
                      Click to choose or drag &amp; drop PDF file here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports PDF, TXT, JSON, PNG, or JPG (up to 20MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Or Paste Raw Text Content
                  </label>
                  <button
                    type="button"
                    onClick={handleSamplePaste}
                    disabled={isBusy}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Paste Sample Question
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={rawText}
                  disabled={isBusy}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste raw text snippet from your PSAT PDF if not uploading a file directly..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Successfully parsed and imported {successCount} question(s)!</span>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => { if (!isBusy) onClose(); }}
            disabled={isBusy}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleImport}
              disabled={isBusy || (!rawText.trim() && !selectedFile)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isReadingFile 
                  ? 'Reading PDF File...' 
                  : isLoading 
                  ? 'Extracting with Gemini AI...' 
                  : 'Parse & Add to Bank'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Pre-Import Verification Diff Modal */}
      <VerificationDiffModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        parsedQuestions={parsedForReview}
        fullPageImages={fullPageImages}
        rawSourceText={rawText}
        onConfirmAll={handleFinalConfirmFromReview}
      />
    </div>
  );
};
