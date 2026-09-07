import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Bug, 
  FileQuestion, 
  MessageSquare, 
  Lightbulb, 
  Inbox 
} from 'lucide-react';
import { FeedbackReport } from '../../types';
import { loadLocalFeedbackReports } from '../../lib/firebase';

interface TicketsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketsHistoryModal: React.FC<TicketsHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [tickets, setTickets] = useState<FeedbackReport[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTickets(loadLocalFeedbackReports());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyTicketId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug':
        return <Bug className="w-4 h-4 text-rose-600" />;
      case 'question_issue':
        return <FileQuestion className="w-4 h-4 text-amber-600" />;
      case 'feature_idea':
        return <Lightbulb className="w-4 h-4 text-indigo-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>My Submitted Reports &amp; Tickets</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Logs of contact inquiries, bug reports, and question flags sent from this device.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {tickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Tickets Logged Yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you submit a contact note, question flaw report, or bug, its reference ID and resolution progress will appear here.
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      {getCategoryIcon(t.category)}
                    </div>
                    <span className="font-mono font-black text-xs text-slate-900">
                      {t.ticketNumber}
                    </span>
                    <button
                      onClick={() => copyTicketId(t.ticketNumber)}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                      title="Copy ticket code"
                    >
                      {copiedId === t.ticketNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.status === 'received' ? 'Received & Queued' : t.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="font-bold text-xs sm:text-sm text-slate-900">{t.subject}</div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{t.description}</p>

                {t.questionId && (
                  <div className="text-[11px] text-indigo-700 font-bold pt-1">
                    Linked Question: #{t.questionId}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">
            Tickets stored locally &amp; synced with Firestore
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
