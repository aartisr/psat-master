import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bug, 
  FileQuestion, 
  Lightbulb, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Monitor, 
  UploadCloud, 
  X, 
  Copy, 
  Check, 
  Search, 
  HelpCircle, 
  Laptop, 
  Smartphone,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { FeedbackReport, FeedbackCategory, FeedbackSeverity, ClientDiagnostics, Question, UserProfile } from '../../types';
import { submitFeedbackReport } from '../../lib/firebase';

interface IssueReportViewProps {
  currentUser: UserProfile | null;
  allQuestions: Question[];
  prefilledQuestionId?: string | null;
  initialCategory?: FeedbackCategory;
  onViewTickets: () => void;
  onClearPrefilledQuestion?: () => void;
}

export const IssueReportView: React.FC<IssueReportViewProps> = ({
  currentUser,
  allQuestions,
  prefilledQuestionId,
  initialCategory = 'bug',
  onViewTickets,
  onClearPrefilledQuestion
}) => {
  const [category, setCategory] = useState<FeedbackCategory>(
    prefilledQuestionId ? 'question_issue' : initialCategory
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(prefilledQuestionId || '');
  const [questionSearch, setQuestionSearch] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  const [severity, setSeverity] = useState<FeedbackSeverity>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Diagnostics
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [diagnostics, setDiagnostics] = useState<ClientDiagnostics>({
    browser: 'Detecting...',
    os: 'Detecting...',
    screenResolution: 'Detecting...',
    userAgent: '',
    onlineStatus: true,
    timestamp: '',
    appVersion: 'v2.4.0 (PSAT Master)'
  });

  // Attachments
  const [attachment, setAttachment] = useState<{ name: string; size: string; previewUrl?: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Auto-detect client environment
  useEffect(() => {
    const detectClient = () => {
      const ua = navigator.userAgent;
      let browser = 'Unknown Browser';
      if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
      else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
      else if (ua.includes('Chrome/')) browser = 'Google Chrome';
      else if (ua.includes('Safari/')) browser = 'Apple Safari';

      let os = 'Unknown OS';
      if (ua.includes('Mac OS')) os = 'macOS';
      else if (ua.includes('Windows NT')) os = 'Windows PC';
      else if (ua.includes('Android')) os = 'Android Device';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';
      else if (ua.includes('Linux')) os = 'Linux';

      setDiagnostics({
        browser,
        os,
        screenResolution: `${window.innerWidth} x ${window.innerHeight} (Device Screen: ${window.screen?.width || 0} x ${window.screen?.height || 0})`,
        userAgent: ua,
        onlineStatus: navigator.onLine,
        timestamp: new Date().toISOString(),
        appVersion: 'v2.4.0 (PSAT Master)'
      });
    };

    detectClient();
  }, []);

  // Update selected question if prefilled changes
  useEffect(() => {
    if (prefilledQuestionId) {
      setSelectedQuestionId(prefilledQuestionId);
      setCategory('question_issue');
      setSubject(`Report on Question #${prefilledQuestionId}`);
    }
  }, [prefilledQuestionId]);

  // Find linked question object
  const linkedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return allQuestions.find((q) => q.id.toLowerCase() === selectedQuestionId.toLowerCase());
  }, [selectedQuestionId, allQuestions]);

  // Filtered questions for search picker
  const matchingQuestions = useMemo(() => {
    if (!questionSearch.trim()) return allQuestions.slice(0, 8);
    const query = questionSearch.toLowerCase();
    return allQuestions
      .filter((q) => q.id.toLowerCase().includes(query) || q.skill.toLowerCase().includes(query) || q.prompt.toLowerCase().includes(query))
      .slice(0, 10);
  }, [questionSearch, allQuestions]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = Number(sizeKb) > 1024 ? `${(Number(sizeKb) / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    // Create object URL for images
    let previewUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    setAttachment({
      name: file.name,
      size: sizeStr,
      previewUrl
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const prefix = category === 'bug' ? 'BUG-' : category === 'question_issue' ? 'QST-' : 'IDEA-';
    const ticketId = prefix + Math.floor(100000 + Math.random() * 900000);

    const report: FeedbackReport = {
      id: 'issue_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ticketNumber: ticketId,
      category,
      severity: category === 'bug' || category === 'question_issue' ? severity : 'low',
      subject: subject.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim() || undefined,
      expectedBehavior: expectedBehavior.trim() || undefined,
      actualBehavior: actualBehavior.trim() || undefined,
      questionId: selectedQuestionId.trim() || undefined,
      questionPromptSnippet: linkedQuestion ? linkedQuestion.prompt.slice(0, 120) : undefined,
      name: name.trim() || 'Student / Educator',
      email: email.trim() || 'unspecified@psatmastery.local',
      clientDiagnostics: includeDiagnostics ? diagnostics : undefined,
      status: 'received',
      createdAt: Date.now(),
      authorUid: currentUser?.uid
    };

    try {
      await submitFeedbackReport(report);
      setSubmittedTicket(ticketId);
    } catch (err) {
      console.error('Failed to submit issue report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (!submittedTicket) return;
    navigator.clipboard.writeText(submittedTicket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Category Tabs / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Type 1: Software Bug */}
        <button
          type="button"
          onClick={() => setCategory('bug')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            category === 'bug'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs text-rose-950'
              : 'bg-white/90 border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center mb-3">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-rose-800">Software Bug</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Glitch, broken button, UI error</div>
          </div>
        </button>

        {/* Type 2: Question Flaw */}
        <button
          type="button"
          onClick={() => setCategory('question_issue')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            category === 'question_issue'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs text-amber-950'
              : 'bg-white/90 border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center mb-3">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-800">Question Flaw</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Typo, formula, wrong answer key</div>
          </div>
        </button>

        {/* Type 3: Quick Idea */}
        <button
          type="button"
          onClick={() => setCategory('feature_idea')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            category === 'feature_idea'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950'
              : 'bg-white/90 border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-3">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-indigo-800">Idea / Suggestion</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Quick workflow improvement</div>
          </div>
        </button>

        {/* Type 4: Performance */}
        <button
          type="button"
          onClick={() => setCategory('bug')}
          className="p-4 rounded-3xl border border-slate-200/80 bg-white/90 hover:bg-slate-50 text-left transition-all cursor-pointer flex flex-col justify-between text-slate-700"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-100/70 text-teal-600 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-teal-800">Tool / Scratchpad</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Audio TTS or drawing glitch</div>
          </div>
        </button>
      </div>

      {/* Main Issue Form */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {category === 'question_issue' ? (
                <>
                  <FileQuestion className="w-6 h-6 text-amber-500" />
                  Report a Question Flaw or Math Error
                </>
              ) : category === 'feature_idea' ? (
                <>
                  <Lightbulb className="w-6 h-6 text-indigo-500" />
                  Suggest an Idea or Enhancement
                </>
              ) : (
                <>
                  <Bug className="w-6 h-6 text-rose-500" />
                  Report a Bug or Software Issue
                </>
              )}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Help us maintain impeccable PSAT standard rigor. We triage every bug report directly with curriculum engineers.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewTickets}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 transition-all cursor-pointer self-start sm:self-auto"
          >
            Track My Submissions →
          </button>
        </div>

        {/* Success Banner if submitted */}
        {submittedTicket ? (
          <div className="p-6 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              Ticket Logged Successfully!
            </div>
            <p className="text-xs sm:text-sm text-emerald-900/80 leading-relaxed">
              Our engineering &amp; curriculum review team has logged your report. You can track its status at any time with this code:
            </p>
            <div className="flex items-center gap-2 bg-white/90 px-3.5 py-2 rounded-xl border border-emerald-300 w-fit">
              <span className="font-mono font-black text-emerald-900 text-sm tracking-wider">{submittedTicket}</span>
              <button
                onClick={copyTicket}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer ml-2"
              >
                {copiedTicket ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTicket ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  setSubmittedTicket(null);
                  setSubject('');
                  setDescription('');
                  setStepsToReproduce('');
                  setSelectedQuestionId('');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Report Another Issue
              </button>
              <button
                onClick={onViewTickets}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                View Ticket Status
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Selector (If question issue or requested) */}
            {category === 'question_issue' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    <FileQuestion className="w-4 h-4 text-amber-600" />
                    Target Question
                  </div>
                  {selectedQuestionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuestionId('');
                        if (onClearPrefilledQuestion) onClearPrefilledQuestion();
                      }}
                      className="text-xs text-amber-700 hover:text-amber-900 underline font-bold cursor-pointer"
                    >
                      Change Question
                    </button>
                  )}
                </div>

                {/* Pre-selected question preview */}
                {linkedQuestion ? (
                  <div className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        #{linkedQuestion.id}
                      </span>
                      <span className="font-bold text-slate-500">
                        {linkedQuestion.test} • {linkedQuestion.domain}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                      {linkedQuestion.prompt}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => {
                          setQuestionSearch(e.target.value);
                          setShowQuestionPicker(true);
                        }}
                        onFocus={() => setShowQuestionPicker(true)}
                        placeholder="Search question ID or skill (e.g., #pm-101 or Linear Equations)..."
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>

                    {showQuestionPicker && (
                      <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1">
                        {matchingQuestions.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setSelectedQuestionId(q.id);
                              setShowQuestionPicker(false);
                              if (!subject) setSubject(`Issue in Question #${q.id} (${q.skill})`);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-amber-50/70 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="font-mono font-bold text-indigo-600 shrink-0">#{q.id}</span>
                            <span className="font-medium text-slate-700 truncate flex-1">{q.prompt}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{q.skill}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Severity Matrix (For bugs and question flaws) */}
            {category !== 'feature_idea' && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Impact / Severity Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('low')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      severity === 'low'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-emerald-700 font-black mb-0.5">🟢 Low</div>
                    <div className="text-[11px] text-slate-500 font-normal">Minor typo / cosmetic</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverity('medium')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      severity === 'medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-amber-700 font-black mb-0.5">🟡 Medium</div>
                    <div className="text-[11px] text-slate-500 font-normal">Awkward layout / slow</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverity('high')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      severity === 'high'
                        ? 'bg-orange-50 border-orange-300 text-orange-950 ring-2 ring-orange-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-orange-700 font-black mb-0.5">🟠 High</div>
                    <div className="text-[11px] text-slate-500 font-normal">Wrong answer key</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverity('blocker')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      severity === 'blocker'
                        ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-rose-700 font-black mb-0.5">🔴 Blocker</div>
                    <div className="text-[11px] text-slate-500 font-normal">App crash / cannot practice</div>
                  </button>
                </div>
              </div>
            )}

            {/* Subject Title */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Issue Summary / Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  category === 'question_issue'
                    ? 'e.g., In Question #pm-104, rationale for option C appears to use incorrect vertex formula'
                    : 'e.g., Scientific calculator degree/radian toggle resets during timed drill'
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Detailed Description &amp; Findings
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened, what seemed inaccurate or broken, and any context that can assist us."
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            {/* Steps to Reproduce (For bugs) */}
            {category === 'bug' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Steps to Reproduce
                  </label>
                  <textarea
                    rows={3}
                    value={stepsToReproduce}
                    onChange={(e) => setStepsToReproduce(e.target.value)}
                    placeholder="1. Start timed drill&#10;2. Open scratchpad&#10;3. Click clear"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Expected Behavior
                  </label>
                  <textarea
                    rows={3}
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="What did you expect to happen?"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Actual Behavior
                  </label>
                  <textarea
                    rows={3}
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    placeholder="What actually occurred instead?"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Attachment Simulation */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Screenshot or Supporting File (Optional)
              </label>
              {attachment ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    {attachment.previewUrl ? (
                      <img
                        src={attachment.previewUrl}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-indigo-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        FILE
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-xs">{attachment.name}</div>
                      <div className="text-[11px] text-slate-500">{attachment.size}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all group">
                  <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors mb-1" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                    Click to attach screenshot or log
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or PDF up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Smart Diagnostics Banner */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  Smart Client Diagnostics
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeDiagnostics}
                    onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Attach Environment Data</span>
                </label>
              </div>

              {includeDiagnostics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block font-medium">Browser</span>
                    <span className="font-bold text-slate-800 truncate block">{diagnostics.browser}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block font-medium">OS</span>
                    <span className="font-bold text-slate-800 truncate block">{diagnostics.os}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block font-medium">Screen</span>
                    <span className="font-bold text-slate-800 truncate block">{diagnostics.screenResolution}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block font-medium">Build</span>
                    <span className="font-bold text-slate-800 truncate block">{diagnostics.appVersion}</span>
                  </div>
                </div>
              )}
            </div>

            {/* User contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarti Ravikumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Follow-Up Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Submitted tickets are logged to Firestore and your device
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !description.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-900/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Bug className="w-4 h-4" />
                <span>{isSubmitting ? 'Logging Ticket...' : 'Submit Issue Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
