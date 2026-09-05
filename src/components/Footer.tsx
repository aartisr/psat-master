import React from 'react';
import { Heart, MessageSquare, Bug, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenFeedback?: (tab?: 'contact' | 'report' | 'features') => void;
}

export const Footer: React.FC<FooterProps> = React.memo(({ onOpenFeedback }) => {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white/60 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p className="flex items-center gap-1.5 font-normal flex-wrap justify-center md:justify-start">
          <span>Dedicated to</span>
          <a
            href="https://saugus.pioneercss.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-800 hover:text-indigo-600 underline decoration-slate-300 hover:decoration-indigo-500 underline-offset-2 transition-colors"
          >
            PCSS II
          </a>
          <span>by</span>
          <a
            href="https://ai-aarti.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-800 hover:text-indigo-600 underline decoration-slate-300 hover:decoration-indigo-500 underline-offset-2 transition-colors inline-flex items-center gap-1"
          >
            Aarti S Ravikumar
          </a>
        </p>

        {/* Quick Help & Support Links */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold flex-wrap justify-center">
          <button
            onClick={() => onOpenFeedback?.('contact')}
            className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 py-1 px-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Contact Us</span>
          </button>
          <span className="text-slate-300 hidden sm:inline select-none">•</span>
          <button
            onClick={() => onOpenFeedback?.('report')}
            className="text-slate-600 hover:text-rose-600 flex items-center gap-1.5 py-1 px-1.5 transition-colors cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Report Bug or Question Issue</span>
          </button>
          <span className="text-slate-300 hidden sm:inline select-none">•</span>
          <button
            onClick={() => onOpenFeedback?.('features')}
            className="text-slate-600 hover:text-amber-600 flex items-center gap-1.5 py-1 px-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Feature Requests</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          PSAT® &amp; SAT® are registered trademarks of the College Board.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
