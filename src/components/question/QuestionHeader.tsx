import React from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Volume2, 
  VolumeX, 
  Edit3, 
  Calculator as CalcIcon, 
  BookOpen, 
  Clock,
  Flag
} from 'lucide-react';
import { Question } from '../../types';
import { Badge } from '../common/Badge';

export interface QuestionHeaderProps {
  question: Question;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  formattedTime?: string;
  isSpeaking?: boolean;
  onToggleSpeech?: () => void;
  onOpenScratchpad?: () => void;
  onOpenFormulaSheet?: () => void;
  onOpenCalculator?: () => void;
  onReportIssue?: (id: string) => void;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = React.memo(({
  question,
  isBookmarked,
  onToggleBookmark,
  formattedTime,
  isSpeaking = false,
  onToggleSpeech,
  onOpenScratchpad,
  onOpenFormulaSheet,
  onOpenCalculator,
  onReportIssue
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
      {/* Badges and classification */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Badge test={question.test} size="sm">
          {question.test}
        </Badge>
        <Badge difficulty={question.difficulty} size="sm">
          {question.difficulty}
        </Badge>
        <Badge variant="neutral" size="sm">
          {question.domain}
        </Badge>
        <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
          {question.skill}
        </Badge>
        <span className="text-[11px] font-mono text-slate-400 font-medium ml-1">
          #{question.id}
        </span>
      </div>

      {/* Action tool controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {formattedTime && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 font-semibold mr-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedTime}</span>
          </div>
        )}

        {/* Read Aloud TTS */}
        {onToggleSpeech && (
          <button
            type="button"
            onClick={onToggleSpeech}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
            aria-label="Text to speech"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Scratchpad */}
        {onOpenScratchpad && (
          <button
            type="button"
            onClick={onOpenScratchpad}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Open digital scratchpad"
            aria-label="Open scratchpad"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        {/* Math Tools */}
        {question.test === 'Math' && onOpenFormulaSheet && (
          <button
            type="button"
            onClick={onOpenFormulaSheet}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Math Formula Sheet"
            aria-label="Formula sheet"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        )}

        {question.test === 'Math' && onOpenCalculator && (
          <button
            type="button"
            onClick={onOpenCalculator}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Scientific Calculator"
            aria-label="Calculator"
          >
            <CalcIcon className="w-4 h-4" />
          </button>
        )}

        {/* Bookmark */}
        <button
          type="button"
          onClick={() => onToggleBookmark(question.id)}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isBookmarked
              ? 'bg-amber-50 border-amber-300 text-amber-600'
              : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-slate-50'
          }`}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
          aria-label="Bookmark"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Flag / Report Question Issue */}
        {onReportIssue && (
          <button
            type="button"
            onClick={() => onReportIssue(question.id)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
            title="Report question error, math flaw, or typo"
            aria-label="Report issue with question"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

QuestionHeader.displayName = 'QuestionHeader';
