import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Eye, 
  Code,
  BookOpen
} from 'lucide-react';
import { 
  Question, 
  AssessmentType, 
  TestType, 
  DomainType, 
  DifficultyType, 
  QuestionOption, 
  QuestionHint 
} from '../../types';
import { DOMAINS_BY_TEST, SKILLS_BY_DOMAIN } from '../../data/questions';
import { Button } from '../common/Button';
import { formatMathText } from '../question/QuestionPrompt';

export interface AdminBuilderProps {
  onAddQuestion: (question: Question) => void;
}

export const AdminBuilder: React.FC<AdminBuilderProps> = React.memo(({ onAddQuestion }) => {
  const [prompt, setPrompt] = useState('');
  const [stimulus, setStimulus] = useState('');
  const [assessment, setAssessment] = useState<AssessmentType>('PSAT/NMSQT');
  const [test, setTest] = useState<TestType>('Math');
  const [domain, setDomain] = useState<DomainType>('Algebra');
  const [skill, setSkill] = useState('Linear equations in two variables');
  const [difficulty, setDifficulty] = useState<DifficultyType>('Medium');
  const [type, setType] = useState<'multiple_choice' | 'free_response'>('multiple_choice');
  const [options, setOptions] = useState<QuestionOption[]>([
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [rationale, setRationale] = useState('');
  const [hints, setHints] = useState<QuestionHint[]>([
    { level: 1, title: 'Concept Identification', hint: '' },
    { level: 2, title: 'Algebraic Setup', hint: '' },
    { level: 3, title: 'Tactical Execution', hint: '' }
  ]);
  const [concepts, setConcepts] = useState('');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Sync available skills when domain changes
  useEffect(() => {
    const availableSkills = SKILLS_BY_DOMAIN[domain] || [];
    if (availableSkills.length > 0 && !availableSkills.includes(skill)) {
      setSkill(availableSkills[0]);
    }
  }, [domain, skill]);

  // Sync domain when test changes
  useEffect(() => {
    const availableDomains = DOMAINS_BY_TEST[test] || [];
    if (availableDomains.length > 0 && !availableDomains.includes(domain)) {
      setDomain(availableDomains[0] as DomainType);
    }
  }, [test, domain]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !rationale.trim()) return;

    const newQ: Question = {
      id: `psat-custom-${Date.now().toString().slice(-6)}`,
      assessment,
      test,
      domain,
      skill,
      difficulty,
      type,
      prompt: prompt.trim(),
      stimulus: stimulus.trim() || undefined,
      options: type === 'multiple_choice' ? options : undefined,
      correctAnswer: correctAnswer.trim(),
      acceptedAnswers: type === 'free_response' ? [correctAnswer.trim()] : undefined,
      rationale: rationale.trim(),
      hints: hints.filter((h) => h.hint.trim().length > 0),
      concepts: concepts
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    };

    onAddQuestion(newQ);
    setCreateSuccess(`Question #${newQ.id} created and published successfully!`);

    // Reset fields
    setPrompt('');
    setStimulus('');
    setRationale('');
    setConcepts('');
    setOptions([
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' }
    ]);
    setHints([
      { level: 1, title: 'Concept Identification', hint: '' },
      { level: 2, title: 'Algebraic Setup', hint: '' },
      { level: 3, title: 'Tactical Execution', hint: '' }
    ]);
  };

  return (
    <form onSubmit={handleCreate} className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Interactive PSAT Question Builder</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author high-fidelity questions with LaTeX math support (e.g. $3x + 2 = 14$), Socratic hints, and step-by-step rationales.
          </p>
        </div>

        {createSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{createSuccess}</span>
          </div>
        )}

        {/* Classification Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assessment</label>
            <select
              value={assessment}
              onChange={(e) => setAssessment(e.target.value as AssessmentType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="PSAT 8/9">PSAT 8/9</option>
              <option value="PSAT 10">PSAT 10</option>
              <option value="PSAT/NMSQT">PSAT/NMSQT</option>
              <option value="SAT">SAT</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Test Section</label>
            <select
              value={test}
              onChange={(e) => setTest(e.target.value as TestType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="Math">Math</option>
              <option value="Reading and Writing">Reading & Writing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as DomainType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              {(DOMAINS_BY_TEST[test] || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Specific Skill Standard</label>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
          >
            {(SKILLS_BY_DOMAIN[domain] || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Reading Stimulus (Optional) */}
        {test === 'Reading and Writing' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Passage / Stimulus Text (Optional)
            </label>
            <textarea
              rows={3}
              value={stimulus}
              onChange={(e) => setStimulus(e.target.value)}
              placeholder="Paste reading passage or background context..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 font-serif leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Prompt */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Question Prompt (Use $...$ for Math formulas)
          </label>
          <textarea
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. If $2x + 5 = 17$, what is the value of $4x - 1$?"
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {prompt.includes('$') && (
            <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 mr-2">LaTeX Preview:</span>
              <span>{formatMathText(prompt)}</span>
            </div>
          )}
        </div>

        {/* Question Type */}
        <div className="flex items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="qtype"
              checked={type === 'multiple_choice'}
              onChange={() => setType('multiple_choice')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Multiple Choice (4 Options)</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="qtype"
              checked={type === 'free_response'}
              onChange={() => setType('free_response')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Student-Produced Response (Grid-In)</span>
          </label>
        </div>

        {/* Options */}
        {type === 'multiple_choice' ? (
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">Answer Choices</label>
            {options.map((opt, idx) => (
              <div key={opt.label} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                  {opt.label}
                </span>
                <input
                  type="text"
                  required
                  value={opt.text}
                  onChange={(e) => {
                    const nextOpts = [...options];
                    nextOpts[idx].text = e.target.value;
                    setOptions(nextOpts);
                  }}
                  placeholder={`Option ${opt.label} text or formula (e.g. $x = 6$)`}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(opt.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    correctAnswer === opt.label
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {correctAnswer === opt.label ? 'Correct Answer' : 'Mark Correct'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correct Numeric Value (Fraction or Decimal)
            </label>
            <input
              type="text"
              required
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g. 23 or 7/2 or 3.5"
              className="w-full max-w-xs px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        )}

        {/* Rationale */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Step-by-Step Rationale & Solution Explanation
          </label>
          <textarea
            rows={4}
            required
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Explain step-by-step why the correct answer is valid..."
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* 3 Socratic Hints */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700">
            3-Tier Socratic Progressive Hints
          </label>
          {hints.map((hint, idx) => (
            <div key={hint.level} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={hint.title}
                onChange={(e) => {
                  const nextH = [...hints];
                  nextH[idx].title = e.target.value;
                  setHints(nextH);
                }}
                className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-700"
              />
              <input
                type="text"
                value={hint.hint}
                onChange={(e) => {
                  const nextH = [...hints];
                  nextH[idx].hint = e.target.value;
                  setHints(nextH);
                }}
                placeholder={`Hint ${hint.level} content...`}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Concepts */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tested Concepts (Comma-separated)
          </label>
          <input
            type="text"
            value={concepts}
            onChange={(e) => setConcepts(e.target.value)}
            placeholder="e.g. Linear equations, Isolation of variables, Substitution"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create & Save Question
          </Button>
        </div>
      </div>
    </form>
  );
});

AdminBuilder.displayName = 'AdminBuilder';
