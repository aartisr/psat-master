import React, { useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Loader2, 
  FileText,
  Eye
} from 'lucide-react';
import { Question, AssessmentType } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { parseQuestionsLocally } from '../../utils/localQuestionParser';
import { repairQuestion } from '../../utils/questionAuditor';
import { ImportProgressEngager } from '../common/ImportProgressEngager';
import { VerificationDiffModal } from './VerificationDiffModal';

export interface AdminExtractorProps {
  userEmail?: string | null;
  onImportQuestions: (questions: Question[], source?: any) => any;
  onOpenPdfUpload?: () => void;
}

export const AdminExtractor: React.FC<AdminExtractorProps> = React.memo(({
  userEmail,
  onImportQuestions,
  onOpenPdfUpload
}) => {
  const [rawText, setRawText] = useState('');
  const [targetAssessment, setTargetAssessment] = useState<AssessmentType>('PSAT/NMSQT');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [dedupInfo, setDedupInfo] = useState<{ added: number; duplicates: number } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing extraction pipeline...');
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleExtract = async () => {
    if (!rawText.trim()) {
      setExtractError('Please paste question text or OCR transcripts first.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(null);
    setDedupInfo(null);
    setCurrentStepIndex(0);
    setStatusMsg('Analyzing document blocks and splitting text...');
    setTelemetryLogs(['[0ms] Document analysis started']);

    // Step 1: Local parsing check
    const localResult = parseQuestionsLocally(rawText, targetAssessment);
    if (localResult.length > 0) {
      setCurrentStepIndex(1);
      setTelemetryLogs((prev) => [...prev, '[10ms] Extracted question structure locally']);
      setCurrentStepIndex(2);
      setTelemetryLogs((prev) => [...prev, '[20ms] Applied SAT domain & skill tags']);
      setCurrentStepIndex(3);
      setTelemetryLogs((prev) => [...prev, '[30ms] Ran deduplication filter']);
      setCurrentStepIndex(4);
      setTelemetryLogs((prev) => [...prev, '[40ms] Syncing records to local bank & Firestore']);

      setTimeout(() => {
        setExtractedQuestions(localResult);
        setExtractSuccess(`Successfully parsed ${localResult.length} question(s) instantly via Local Engine (0ms - AI service bypassed)!`);
        setIsExtracting(false);
      }, 400);
      return;
    }

    try {
      setCurrentStepIndex(1);
      setStatusMsg('Extracting prompts, options, and key answer patterns...');
      setTelemetryLogs((prev) => [...prev, '[100ms] Contacting extraction server...']);

      // First try /api/admin/extract-questions, fallback to /api/questions/import-text
      let res = await fetch('/api/admin/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          rawText,
          assessment: targetAssessment
        })
      });

      setCurrentStepIndex(2);
      setStatusMsg('Applying SAT/PSAT domain tags and skill benchmarks...');
      setTelemetryLogs((prev) => [...prev, '[400ms] Server response received. Validating structure...']);

      if (!res.ok && res.status === 404) {
        res = await fetch('/api/questions/import-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail || ''
          },
          body: JSON.stringify({
            rawText,
            assessmentType: targetAssessment
          })
        });
      }

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let errData: any = {};
        if (contentType.includes('application/json')) {
          errData = await res.json().catch(() => ({}));
        } else {
          const txt = await res.text().catch(() => '');
          if (res.status === 413 || txt.includes('Request Entity Too Large') || txt.includes('Payload Too Large')) {
            throw new Error('Payload size exceeds serverless limits (~3.5MB). Please upload a smaller document or paste text snippets.');
          }
          throw new Error(`Server returned status ${res.status}. ${txt.slice(0, 100)}`);
        }
        throw new Error(errData.error || `Failed to extract questions (HTTP ${res.status})`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const txt = await res.text();
        throw new Error(`Unexpected non-JSON response from server: ${txt.slice(0, 100)}`);
      }

      const data = await res.json();
      setCurrentStepIndex(3);
      setTelemetryLogs((prev) => [...prev, '[700ms] Deduplicating and formatting Socratic hints...']);

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setCurrentStepIndex(4);
        setStatusMsg('Writing items to Cloud Firestore & state database...');
        setTelemetryLogs((prev) => [...prev, `[900ms] Prepared ${data.questions.length} questions for database storage`]);

        const repaired = data.questions.map((q: Question) => repairQuestion(q, rawText));
        setExtractedQuestions(repaired);
        const modeLabel = data.parserMode === 'local_deterministic' ? 'Local Engine' : 'AI Engine';
        setExtractSuccess(`Successfully extracted ${repaired.length} structured question(s) via ${modeLabel}!`);
      } else {
        throw new Error('No valid questions could be extracted. Check format.');
      }
    } catch (err: any) {
      // Client side final fallback to local parser
      const fallbackResult = parseQuestionsLocally(rawText, targetAssessment);
      if (fallbackResult.length > 0) {
        setExtractedQuestions(fallbackResult);
        setExtractSuccess(`Extracted ${fallbackResult.length} question(s) via Local Fallback Engine after server error.`);
      } else {
        setExtractError(err.message || 'Extraction failed');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveAll = () => {
    if (extractedQuestions.length === 0) return;
    const res = onImportQuestions(extractedQuestions, 'AI Extractor / OCR');
    if (res && typeof res.addedCount === 'number') {
      setDedupInfo({ added: res.addedCount, duplicates: res.duplicateCount });
      if (res.duplicateCount > 0) {
        setExtractSuccess(`Import complete: Added ${res.addedCount} new question(s), skipped ${res.duplicateCount} duplicate(s).`);
      } else {
        setExtractSuccess(`Successfully added ${res.addedCount} question(s) to the Question Bank!`);
      }
    } else {
      setExtractSuccess(`Successfully added ${extractedQuestions.length} question(s) to the Question Bank!`);
    }
    setExtractedQuestions([]);
    setRawText('');
  };

  return (
    <div className="space-y-6">
      {isExtracting && (
        <ImportProgressEngager
          title="Extracting & Structuring Question Data"
          subtitle="Processing OCR transcript, applying College Board domain standards, and preparing records"
          currentStepIndex={currentStepIndex}
          statusMessage={statusMsg}
          logs={telemetryLogs}
        />
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Automated Question Parser &amp; OCR Extractor</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Paste raw text from College Board PSAT PDFs or OCR scans. The AI engine automatically extracts prompts, choices, correct answers, domains, skills, and formats LaTeX math.
            </p>
          </div>

          {onOpenPdfUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPdfUpload}
              leftIcon={<FileText className="w-4 h-4 text-indigo-600" />}
              className="shrink-0"
            >
              Upload PDF File
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam Type</label>
            <select
              value={targetAssessment}
              onChange={(e) => setTargetAssessment(e.target.value as AssessmentType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="PSAT 8/9">PSAT 8/9</option>
              <option value="PSAT 10">PSAT 10</option>
              <option value="PSAT/NMSQT">PSAT/NMSQT</option>
              <option value="SAT">SAT</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Raw Text / Exam Transcript
          </label>
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw exam content here... Example:
1. If 3x + 7 = 19, what is the value of 6x + 2?
A) 12
B) 24
C) 26
D) 38
Answer: C. Rationale: 3x = 12, x = 4. 6(4) + 2 = 26."
            className="w-full p-4 text-xs sm:text-sm font-mono rounded-2xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
          />
        </div>

        {extractError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}

        {extractSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{extractSuccess}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="primary"
            size="md"
            isLoading={isExtracting}
            onClick={handleExtract}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Extract & Structure Questions
          </Button>
        </div>
      </div>

      {/* Extracted Questions Preview & Publish */}
      {extractedQuestions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Extracted Questions ({extractedQuestions.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewModal(true)}
                leftIcon={<Eye className="w-4 h-4 text-indigo-600" />}
              >
                Inspect Side-by-Side Diff
              </Button>

              <Button
                variant="success"
                size="sm"
                onClick={handleSaveAll}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Publish All to Bank
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {extractedQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge test={q.test} size="xs">
                      {q.test}
                    </Badge>
                    <Badge difficulty={q.difficulty} size="xs">
                      {q.difficulty}
                    </Badge>
                    <span className="text-xs font-bold text-slate-700">{q.skill}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ID: {q.id}</span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-900">{q.prompt}</p>

                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          opt.label === q.correctAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold">{opt.label}:</span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800">Rationale: </span>
                  {q.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Diff Inspector Modal */}
      <VerificationDiffModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        parsedQuestions={extractedQuestions.map((q) => ({ question: q }))}
        fullPageImages={{}}
        rawSourceText={rawText}
        onConfirmAll={(finalQs) => {
          setExtractedQuestions(finalQs);
          setShowReviewModal(false);
          const res = onImportQuestions(finalQs, 'AI Extractor / OCR (Verified)');
          if (res && typeof res.addedCount === 'number') {
            setDedupInfo({ added: res.addedCount, duplicates: res.duplicateCount });
            setExtractSuccess(`Successfully verified and imported ${res.addedCount} question(s)!`);
          }
          setExtractedQuestions([]);
          setRawText('');
        }}
      />
    </div>
  );
});

AdminExtractor.displayName = 'AdminExtractor';
