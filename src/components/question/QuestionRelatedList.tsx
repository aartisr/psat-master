import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Question } from '../../types';
import { Badge } from '../common/Badge';

export interface QuestionRelatedListProps {
  relatedQuestions: Question[];
  onSelectQuestion: (question: Question) => void;
}

export const QuestionRelatedList: React.FC<QuestionRelatedListProps> = React.memo(({
  relatedQuestions,
  onSelectQuestion
}) => {
  if (relatedQuestions.length === 0) return null;

  return (
    <div className="border-t border-slate-100 pt-4 mt-2">
      <div className="flex items-center gap-2 mb-2.5">
        <Layers className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Recommended Next Practice
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {relatedQuestions.map((relatedQ) => (
          <button
            key={relatedQ.id}
            type="button"
            onClick={() => onSelectQuestion(relatedQ)}
            className="group flex flex-col justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left transition-all cursor-pointer"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-indigo-600">
                  #{relatedQ.id}
                </span>
                <Badge difficulty={relatedQ.difficulty} size="xs">
                  {relatedQ.difficulty}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 line-clamp-2 leading-snug">
                {relatedQ.prompt}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/50 text-[11px] text-slate-500">
              <span className="truncate max-w-[120px]">{relatedQ.skill}</span>
              <span className="flex items-center gap-1 font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Practice</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

QuestionRelatedList.displayName = 'QuestionRelatedList';
