import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bug, 
  Sparkles, 
  Inbox, 
  ArrowLeft, 
  HelpCircle, 
  ShieldCheck, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { UserProfile, Question } from '../types';
import { ContactUsView } from './feedback/ContactUsView';
import { IssueReportView } from './feedback/IssueReportView';
import { FeatureRequestsView } from './feedback/FeatureRequestsView';
import { TicketsHistoryModal } from './feedback/TicketsHistoryModal';

export type SupportSubTab = 'contact' | 'report' | 'features';

interface SupportFeedbackHubProps {
  currentUser: UserProfile | null;
  allQuestions: Question[];
  initialTab?: SupportSubTab;
  initialQuestionId?: string | null;
  onClose?: () => void;
  onClearInitialQuestion?: () => void;
}

export const SupportFeedbackHub: React.FC<SupportFeedbackHubProps> = ({
  currentUser,
  allQuestions,
  initialTab = 'contact',
  initialQuestionId,
  onClose,
  onClearInitialQuestion
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SupportSubTab>(
    initialQuestionId ? 'report' : initialTab
  );
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);

  // Sync if initial props change
  useEffect(() => {
    if (initialQuestionId) {
      setActiveSubTab('report');
    } else if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab, initialQuestionId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Navigation & Segmented Switcher */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Community &amp; Support Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Feedback, Issues &amp; Feature Requests
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Dedicated to students and faculty at Pioneer Charter School of Science II (PCSS II) and PSAT learners worldwide.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setIsTicketsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-200"
            >
              <Inbox className="w-4 h-4 text-indigo-600" />
              <span>My Logged Tickets</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Practice</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Pill Interactive Navigation Tabs */}
        <div className="flex p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/60">
          <button
            onClick={() => setActiveSubTab('contact')}
            className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'contact'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeSubTab === 'contact' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Contact Us</span>
          </button>

          <button
            onClick={() => setActiveSubTab('report')}
            className={`flex items-center justify-center gap-2 flex-1 min-w-[170px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'report'
                ? 'bg-white text-rose-950 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Bug className={`w-4 h-4 ${activeSubTab === 'report' ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>Bug, Issue or Idea Reporting</span>
            {initialQuestionId && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('features')}
            className={`flex items-center justify-center gap-2 flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'features'
                ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeSubTab === 'features' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Feature Requests &amp; Roadmap</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Contact Us */}
      {activeSubTab === 'contact' && (
        <ContactUsView
          currentUser={currentUser}
          onViewTickets={() => setIsTicketsOpen(true)}
          onSwitchToBugReport={(cat) => {
            setActiveSubTab('report');
          }}
        />
      )}

      {/* Tab 2: Bug & Issue Reporting */}
      {activeSubTab === 'report' && (
        <IssueReportView
          currentUser={currentUser}
          allQuestions={allQuestions}
          prefilledQuestionId={initialQuestionId}
          onViewTickets={() => setIsTicketsOpen(true)}
          onClearPrefilledQuestion={onClearInitialQuestion}
        />
      )}

      {/* Tab 3: Feature Requests & Community Roadmap */}
      {activeSubTab === 'features' && (
        <FeatureRequestsView currentUser={currentUser} />
      )}

      {/* My Submitted Tickets Modal */}
      <TicketsHistoryModal
        isOpen={isTicketsOpen}
        onClose={() => setIsTicketsOpen(false)}
      />
    </div>
  );
};
