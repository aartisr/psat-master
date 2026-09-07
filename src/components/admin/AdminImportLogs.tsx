import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User,
  Filter
} from 'lucide-react';
import { ImportLog } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface AdminImportLogsProps {
  importLogs: ImportLog[];
  onClearLogs?: () => void;
}

export const AdminImportLogs: React.FC<AdminImportLogsProps> = React.memo(({
  importLogs,
  onClearLogs
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(
    importLogs.length > 0 ? importLogs[0].id : null
  );

  const filteredLogs = importLogs.filter((log) => {
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = log.userEmail?.toLowerCase().includes(q);
      const matchMsg = log.summaryMessage?.toLowerCase().includes(q);
      const matchSource = log.source?.toLowerCase().includes(q);
      const matchDetails = log.details?.some(
        (d) => d.prompt.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      );
      if (!matchEmail && !matchMsg && !matchSource && !matchDetails) return false;
    }
    return true;
  });

  const totalOps = importLogs.length;
  const totalAdded = importLogs.reduce((acc, l) => acc + (l.addedCount || 0), 0);
  const totalDuplicates = importLogs.reduce((acc, l) => acc + (l.duplicateCount || 0), 0);
  const totalReceived = importLogs.reduce((acc, l) => acc + (l.totalReceived || 0), 0);

  const handleExportAuditJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(importLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `psat_import_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Total Import Runs</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalOps}</div>
          <p className="text-[11px] text-slate-400">Recorded audit events</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Questions Added</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalAdded}</div>
          <p className="text-[11px] text-slate-400">Unique items in question bank</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Duplicates Filtered</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{totalDuplicates}</div>
          <p className="text-[11px] text-slate-400">Duplicates prevented</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Processed Items</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalReceived}</div>
          <p className="text-[11px] text-slate-400">Total raw items received</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admin email, prompt keyword, or ID..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditJson}
              disabled={importLogs.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Logs
            </Button>

            {onClearLogs && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearLogs}
                disabled={importLogs.length === 0}
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="AI Extractor / OCR">AI Extractor / OCR</option>
            <option value="JSON File Upload">JSON File Upload</option>
            <option value="PDF / Text Importer">PDF / Text Importer</option>
            <option value="Manual Question Builder">Manual Builder</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">Success (All Added)</option>
            <option value="PARTIAL">Partial (Duplicates Detected)</option>
            <option value="FAILED">Failed</option>
          </select>

          <div className="text-slate-400 text-[11px] ml-auto">
            Showing {filteredLogs.length} of {importLogs.length} log entry(s)
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Import Audit Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {importLogs.length === 0 
              ? 'When questions are imported via AI OCR, JSON upload, or text parse, detailed audit trails will appear here.'
              : 'No import logs match your search filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div 
                key={log.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Log Header Row */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Status Icon */}
                    <div className="mt-0.5 sm:mt-0">
                      {log.status === 'SUCCESS' && (
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {log.status === 'PARTIAL' && (
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      {log.status === 'FAILED' && (
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {log.source}
                        </span>

                        {log.status === 'SUCCESS' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            SUCCESS
                          </span>
                        )}
                        {log.status === 'PARTIAL' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                            DUPLICATES DETECTED
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold">
                            FAILED
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {log.formattedDate || log.timestamp}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.userEmail || 'System Admin'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges & Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        +{log.addedCount} Added
                      </span>

                      {log.duplicateCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                          {log.duplicateCount} Duplicates Skipped
                        </span>
                      )}

                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {log.totalReceived} Received
                      </span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4 animate-in fade-in">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                      <div className="font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Execution Summary</span>
                      </div>
                      {log.summaryMessage}
                      {log.errorMessage && (
                        <div className="mt-2 p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-mono text-[11px]">
                          Error Details: {log.errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Question Breakdown List */}
                    {log.details && log.details.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Itemized Questions Audit ({log.details.length})</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Strict deduplication verified by ID and normalized prompt matching
                          </span>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                          {log.details.map((item, idx) => (
                            <div 
                              key={idx}
                              className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                item.status === 'ADDED'
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : 'bg-amber-50/40 border-amber-200'
                              }`}
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-bold text-slate-800 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                                    ID: {item.id}
                                  </span>
                                  {item.domain && (
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {item.domain} {item.skill ? `• ${item.skill}` : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-800 line-clamp-2 font-medium">
                                  {item.prompt}
                                </p>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {item.status === 'ADDED' ? (
                                  <span className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    ADDED
                                  </span>
                                ) : (
                                  <div className="text-right">
                                    <span className="px-2 py-1 rounded-md bg-amber-600 text-white text-[11px] font-extrabold flex items-center gap-1 inline-flex">
                                      <AlertTriangle className="w-3 h-3" />
                                      DUPLICATE SKIPPED
                                    </span>
                                    {item.reason && (
                                      <div className="text-[10px] text-amber-800 font-medium mt-0.5 max-w-xs">
                                        {item.reason}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

AdminImportLogs.displayName = 'AdminImportLogs';
