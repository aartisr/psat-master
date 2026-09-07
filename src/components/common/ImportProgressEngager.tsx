import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Database, 
  Brain, 
  FileSearch, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  Zap,
  ShieldCheck,
  Award
} from 'lucide-react';

export interface ImportStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export interface ImportProgressEngagerProps {
  title?: string;
  subtitle?: string;
  currentStepIndex: number;
  totalSteps?: number;
  itemCount?: number;
  statusMessage?: string;
  logs?: string[];
  isComplete?: boolean;
}

const SAT_TIPS = [
  {
    category: 'Desmos Hack',
    title: 'Finding System Intersections Instantly',
    tip: 'In Digital SAT Math, type both system equations directly into Desmos. Tap the intersection point on the graph to get the exact (x, y) solution in under 5 seconds!'
  },
  {
    category: 'Reading Strategy',
    title: 'The "Main Idea" First Pass',
    tip: 'For Reading & Writing passages, read the first and last sentence of each paragraph first. Digital SAT passages are concise and state their primary thesis near the transitions.'
  },
  {
    category: 'Math Rule',
    title: 'Discriminant Shortcut for $ax^2 + bx + c = 0$',
    tip: 'If $b^2 - 4ac > 0$, there are 2 real solutions. If $= 0$, exactly 1 real solution. If $< 0$, no real solutions. College Board tests this on almost every Module 2!'
  },
  {
    category: 'Pacing Secret',
    title: 'The Flag & Move Protocol',
    tip: 'Never spend more than 75 seconds on a single question on your first pass. Flag difficult questions immediately and come back after completing all straightforward items.'
  },
  {
    category: 'Grammar Rule',
    title: 'Semicolons vs. Periods on the SAT',
    tip: 'On the SAT, a semicolon (;) and a period (.) perform the exact same grammatical function: joining two independent clauses. If both are choices with identical wording, eliminate both!'
  }
];

const MICRO_DRILLS = [
  {
    question: 'Quick Math: If $2x + 6 = 18$, what is the value of $x + 3$?',
    options: ['6', '9', '12', '15'],
    correct: 1, // '9' -> (2x+6=18 => 2(x+3)=18 => x+3=9)
    explanation: 'Divide the entire equation $2x + 6 = 18$ by 2 directly: $x + 3 = 9$. No need to solve for $x$ first!'
  },
  {
    question: 'Quick Vocab: Which transition best indicates a contrast?',
    options: ['Furthermore', 'Conversely', 'Consequently', 'Likewise'],
    correct: 1, // 'Conversely'
    explanation: '"Conversely" introduces an opposing or contrasting perspective, unlike "Furthermore" (addition) or "Consequently" (result).'
  }
];

export const ImportProgressEngager: React.FC<ImportProgressEngagerProps> = ({
  title = 'Processing & Persisting PSAT Curriculum',
  subtitle = 'Extracting metadata, running pedagogical validation, and saving to Firestore',
  currentStepIndex,
  itemCount = 1,
  statusMessage = 'Analyzing question structures and formatting...',
  logs = [],
  isComplete = false
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState<number | null>(null);
  const [drillIndex, setDrillIndex] = useState(0);

  const steps: ImportStep[] = [
    { id: 'analyze', label: 'Document Analysis', description: 'Extracting text blocks & LaTeX equations', icon: FileSearch },
    { id: 'extract', label: 'Pattern Extraction', description: 'Identifying prompts, choices & correct keys', icon: Brain },
    { id: 'tag', label: 'Pedagogical Tagging', description: 'Categorizing SAT domains, skills & difficulty', icon: Sparkles },
    { id: 'dedup', label: 'Deduplication', description: 'Checking question bank for duplicate entries', icon: Zap },
    { id: 'store', label: 'Firestore Sync', description: 'Persisting clean records to Cloud Database', icon: Database },
  ];

  const currentPercent = isComplete 
    ? 100 
    : Math.min(Math.round(((currentStepIndex + 1) / steps.length) * 100), 95);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SAT_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activeTip = SAT_TIPS[tipIndex];
  const activeDrill = MICRO_DRILLS[drillIndex];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {/* Header with Live Ring Pulse */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sync Complete</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Live Pipeline Active</span>
                </>
              )}
            </span>
            {itemCount > 0 && (
              <span className="text-[11px] text-slate-400 font-mono">
                {itemCount} question(s) in batch
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white pt-1">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* Progress Gauge */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono leading-none">
              {currentPercent}%
            </div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Progress</div>
          </div>
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500 transition-all duration-500 ease-out"
                strokeDasharray={`${currentPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Zap className="w-3.5 h-3.5 text-indigo-300 absolute" />
          </div>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${currentPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
          <span className="truncate max-w-md">{statusMessage}</span>
          <span className="shrink-0">{isComplete ? '100% Done' : `Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`}</span>
        </div>
      </div>

      {/* Stepper Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = isComplete || idx < currentStepIndex;
          const isCurrent = !isComplete && idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : isCurrent
                  ? 'bg-indigo-950/60 border-indigo-500/60 text-white ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-lg ${
                  isDone ? 'bg-emerald-500/20 text-emerald-300' : isCurrent ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <span className="text-[10px] font-mono opacity-50">0{idx + 1}</span>
                )}
              </div>
              <div className="text-xs font-bold tracking-tight truncate">{step.label}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{step.description}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Engagement Area (SAT Pro Tips & Quick Warmup Drill) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Pro Tip Card */}
        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-950/90 rounded-2xl p-4 border border-indigo-500/20 space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>SAT Strategy Insight</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTipIndex((prev) => (prev - 1 + SAT_TIPS.length) % SAT_TIPS.length)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400">{tipIndex + 1}/{SAT_TIPS.length}</span>
              <button
                onClick={() => setTipIndex((prev) => (prev + 1) % SAT_TIPS.length)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-200 text-[10px] font-bold rounded-md border border-indigo-500/30">
              {activeTip.category}
            </span>
            <h4 className="text-sm font-extrabold text-white">{activeTip.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{activeTip.tip}</p>
          </div>
        </div>

        {/* Quick Warmup Drill Card */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Quick Warmup Micro-Drill</span>
            </div>
            <button
              onClick={() => {
                setDrillIndex((prev) => (prev + 1) % MICRO_DRILLS.length);
                setDrillAnswer(null);
              }}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Next Question
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-200">
            {activeDrill.question}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {activeDrill.options.map((opt, idx) => {
              const isSelected = drillAnswer === idx;
              const isCorrect = idx === activeDrill.correct;
              let btnClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';

              if (drillAnswer !== null) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-950/80 border-rose-500/60 text-rose-200';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => setDrillAnswer(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${btnClass}`}
                >
                  <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{String.fromCharCode(65 + idx)}]</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {drillAnswer !== null && (
            <div className="text-[11px] text-slate-300 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl leading-relaxed animate-in fade-in">
              <span className="font-bold text-indigo-300 mr-1">Explanation:</span>
              {activeDrill.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Live Stream Console Log Ticker */}
      {logs.length > 0 && (
        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1 font-mono text-[11px]">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>System Telemetry Log</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-0.5 text-slate-400 pr-1">
            {logs.slice(-4).map((log, i) => (
              <div key={i} className="truncate">
                <span className="text-indigo-400 mr-1.5">&gt;</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
