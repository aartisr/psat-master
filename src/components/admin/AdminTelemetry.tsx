import React from 'react';
import { BarChart3, PieChart, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Question } from '../../types';
import { Badge } from '../common/Badge';

export interface AdminTelemetryProps {
  allQuestions: Question[];
}

export const AdminTelemetry: React.FC<AdminTelemetryProps> = React.memo(({ allQuestions }) => {
  const total = allQuestions.length;
  const mathCount = allQuestions.filter((q) => q.test === 'Math').length;
  const rwCount = allQuestions.filter((q) => q.test === 'Reading and Writing').length;

  const easyCount = allQuestions.filter((q) => q.difficulty === 'Easy').length;
  const medCount = allQuestions.filter((q) => q.difficulty === 'Medium').length;
  const hardCount = allQuestions.filter((q) => q.difficulty === 'Hard').length;

  // Domain breakdown
  const domainCounts: Record<string, number> = {};
  allQuestions.forEach((q) => {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bank Size</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{total}</div>
          <div className="text-xs text-slate-500 mt-1">Active verified PSAT/SAT items</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Math Coverage</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {mathCount} <span className="text-sm font-normal text-slate-400">({Math.round((mathCount / (total || 1)) * 100)}%)</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Algebra, Advanced Math & Geometry</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reading & Writing Coverage</div>
          <div className="text-3xl font-extrabold text-purple-600 mt-1">
            {rwCount} <span className="text-sm font-normal text-slate-400">({Math.round((rwCount / (total || 1)) * 100)}%)</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Craft, Structure, Ideas & Conventions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Difficulty Tier Distribution</span>
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">Easy ({easyCount})</span>
                <span className="text-slate-500">{Math.round((easyCount / (total || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(easyCount / (total || 1)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">Medium ({medCount})</span>
                <span className="text-slate-500">{Math.round((medCount / (total || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(medCount / (total || 1)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-700">Hard ({hardCount})</span>
                <span className="text-slate-500">{Math.round((hardCount / (total || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(hardCount / (total || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Domain Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Domain Coverage Breakdown</span>
          </h4>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {Object.entries(domainCounts).map(([domain, count]) => (
              <div key={domain} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-semibold text-slate-800">{domain}</span>
                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {count} Qs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

AdminTelemetry.displayName = 'AdminTelemetry';
