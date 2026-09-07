import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bug, 
  FileQuestion, 
  Lightbulb, 
  HelpCircle, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Monitor, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { FeedbackReport, FeatureRequest, Question } from '../../types';
import { loadLocalFeedbackReports, fetchFeatureRequests } from '../../lib/firebase';

interface AdminTicketsQueueProps {
  allQuestions: Question[];
}

export const AdminTicketsQueue: React.FC<AdminTicketsQueueProps> = ({ allQuestions }) => {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'features'>('tickets');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reloadData = async () => {
    setIsLoading(true);
    // Load local feedback reports
    const localReports = loadLocalFeedbackReports();
    setReports(localReports);

    // Load feature requests
    try {
      const feats = await fetchFeatureRequests(true);
      setFeatureRequests(feats);
    } catch {
      // ignore
    }
    setIsLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleDeleteTicket = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    try {
      localStorage.setItem('psat_user_feedback_history', JSON.stringify(updated));
    } catch {}
  };

  const filteredReports = reports.filter((r) => {
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesSearch = 
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
              Admin Support Desk
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {reports.length} Tickets &bull; {featureRequests.length} Feature Ideas
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            User Bug Reports &amp; Feature Requests Queue
          </h2>
          <p className="text-slate-600 text-xs mt-0.5">
            Review user-submitted tickets, question corrections, client diagnostics, and community feature votes.
          </p>
        </div>

        <button
          onClick={reloadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Primary Sub-Tabs: Tickets vs Features */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-white text-indigo-950 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bug className="w-4 h-4 text-rose-600" />
          <span>Bug Reports &amp; Issues ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'features'
              ? 'bg-white text-indigo-950 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Community Feature Ideas ({featureRequests.length})</span>
        </button>
      </div>

      {/* TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Controls: Search & Category Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, email, or subject..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'bug', 'question_issue', 'general', 'feature'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'All Tickets' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Tickets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets match your filter criteria or no user tickets have been submitted locally yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const isExpanded = expandedId === report.id;
                const relatedQ = report.questionId ? allQuestions.find((q) => q.id === report.questionId) : null;

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          report.category === 'bug' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                          report.category === 'question_issue' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {report.category === 'bug' ? <Bug className="w-4 h-4" /> :
                           report.category === 'question_issue' ? <FileQuestion className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {report.ticketNumber}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              report.severity === 'critical' ? 'bg-rose-100 text-rose-800 font-extrabold' :
                              report.severity === 'high' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {report.severity} severity
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm">{report.subject}</h4>
                          <p className="text-xs text-slate-600 line-clamp-1">{report.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-semibold text-slate-500">
                          {report.userName || report.userEmail || 'Guest Student'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Full Issue Description</h5>
                            <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                              {report.description}
                            </p>
                          </div>

                          {report.stepsToReproduce && (
                            <div className="space-y-2">
                              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Steps to Reproduce</h5>
                              <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {report.stepsToReproduce}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Linked Question Details if Question Issue */}
                        {relatedQ && (
                          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                              <FileQuestion className="w-4 h-4 text-indigo-600" />
                              Linked Question: ID {relatedQ.id} ({relatedQ.test} &bull; {relatedQ.domain})
                            </span>
                            <p className="text-slate-800 bg-white p-3 rounded-xl border border-indigo-100 italic">
                              "{relatedQ.question}"
                            </p>
                          </div>
                        )}

                        {/* Client Diagnostics */}
                        {report.diagnostics && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Monitor className="w-3.5 h-3.5 text-slate-600" />
                              Client Diagnostics
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-700">
                              <div><strong>Browser:</strong> {report.diagnostics.browser}</div>
                              <div><strong>OS:</strong> {report.diagnostics.os}</div>
                              <div><strong>Res:</strong> {report.diagnostics.screenResolution}</div>
                              <div><strong>Version:</strong> {report.diagnostics.appVersion}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleDeleteTicket(report.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Ticket</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FEATURES TAB */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureRequests.map((feat) => (
            <div
              key={feat.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    feat.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    feat.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {feat.status.replace('_', ' ')}
                  </span>

                  <span className="font-extrabold text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    👍 {feat.upvotes} Upvotes
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{feat.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>By {feat.authorName || 'Community Member'}</span>
                <span>{new Date(feat.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
