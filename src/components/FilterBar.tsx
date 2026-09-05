import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Zap, Sparkles, Filter } from 'lucide-react';
import { FilterCriteria } from '../types';
import { DOMAINS_BY_TEST, SKILLS_BY_DOMAIN } from '../data/questions';

interface FilterBarProps {
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  totalMatches: number;
  totalQuestions: number;
  searchTimeMs: number;
  onLaunchFilteredDrill: () => void;
}

const POPULAR_CONCEPTS = [
  'Systems of equations',
  'Slope & rate of change',
  'Linear inequalities',
  'Y-intercept',
  'No solution',
  'Word problems',
  'Graph analysis'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
  totalQuestions,
  searchTimeMs,
  onLaunchFilteredDrill
}) => {
  const handleAssessmentChange = (val: string) => {
    setFilters((prev) => ({ ...prev, assessment: val }));
  };

  const handleTestChange = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      test: val,
      domain: 'all',
      skill: 'all'
    }));
  };

  const handleDomainChange = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      domain: val,
      skill: 'all'
    }));
  };

  const handleSkillChange = (val: string) => {
    setFilters((prev) => ({ ...prev, skill: val }));
  };

  const handleDifficultyChange = (val: string) => {
    setFilters((prev) => ({ ...prev, difficulty: val }));
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      assessment: 'all',
      test: 'all',
      domain: 'all',
      skill: 'all',
      difficulty: 'all',
      status: 'all',
      sortBy: 'relevance'
    });
  };

  // Determine available domains based on test
  const availableDomains = filters.test && filters.test !== 'all'
    ? DOMAINS_BY_TEST[filters.test] || []
    : Object.values(DOMAINS_BY_TEST).flat();

  // Determine available skills based on domain
  const availableSkills = filters.domain && filters.domain !== 'all'
    ? SKILLS_BY_DOMAIN[filters.domain] || []
    : [];

  const hasActiveFilters =
    filters.query ||
    filters.assessment !== 'all' ||
    filters.test !== 'all' ||
    filters.domain !== 'all' ||
    filters.skill !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.status !== 'all';

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-6 space-y-4 ring-1 ring-slate-900/5">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-indigo-500/80" />
        </div>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          placeholder="Intelligent concept search (e.g., 'slope-intercept word problem', 'systems no solution', 'inequality shaded region')..."
          className="w-full pl-11 pr-24 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-blue-600 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all shadow-inner"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {searchTimeMs !== undefined && (
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200/80 hidden sm:inline-block shadow-2xs">
              {searchTimeMs}ms
            </span>
          )}
          {filters.query && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
              className="text-xs text-slate-500 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Concept Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 flex items-center gap-1 font-bold text-[11px] shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Key Concepts:
        </span>
        {POPULAR_CONCEPTS.map((concept) => (
          <button
            key={concept}
            onClick={() => setFilters((prev) => ({ ...prev, query: concept }))}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filters.query.toLowerCase() === concept.toLowerCase()
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {concept}
          </button>
        ))}
      </div>

      {/* Granular Select Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
        {/* Assessment */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Assessment
          </label>
          <select
            value={filters.assessment}
            onChange={(e) => handleAssessmentChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">All Assessments</option>
            <option value="PSAT 8/9">PSAT 8/9</option>
            <option value="PSAT 10">PSAT 10</option>
            <option value="PSAT/NMSQT">PSAT/NMSQT</option>
            <option value="SAT">SAT</option>
          </select>
        </div>

        {/* Test */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Test Section
          </label>
          <select
            value={filters.test}
            onChange={(e) => handleTestChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">All Sections (Math & RW)</option>
            <option value="Math">Math</option>
            <option value="Reading and Writing">Reading & Writing</option>
          </select>
        </div>

        {/* Domain */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Domain
          </label>
          <select
            value={filters.domain}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">All Domains</option>
            {availableDomains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>

        {/* Skill */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Skill / Standard
          </label>
          <select
            value={filters.skill}
            onChange={(e) => handleSkillChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all truncate cursor-pointer"
          >
            <option value="all">All Specific Skills</option>
            {availableSkills.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Active Filter Metrics & Quick Drill Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-600 flex-wrap">
          <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{totalMatches}</span> questions matched
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{totalQuestions} total in database</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 ml-2 text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {totalMatches > 0 && (
          <button
            onClick={onLaunchFilteredDrill}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white" />
            <span>Launch Drill ({Math.min(totalMatches, 10)} Qs)</span>
          </button>
        )}
      </div>
    </div>
  );
};
