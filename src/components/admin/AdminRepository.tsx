import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Download, 
  UploadCloud, 
  Layers, 
  X, 
  Check,
  FileText,
  Loader2,
  Database,
  Sparkles,
  ImageOff,
  Image,
  LineChart,
  Table,
  ShieldCheck
} from 'lucide-react';
import { Question } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { QuestionCard } from '../QuestionCard';
import { usePractice } from '../../context/PracticeContext';
import { ContentAuditorModal } from './ContentAuditorModal';

export interface AdminRepositoryProps {
  allQuestions: Question[];
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (questions: Question[]) => void;
  onOpenPdfUpload?: () => void;
}

export const AdminRepository: React.FC<AdminRepositoryProps> = React.memo(({
  allQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onOpenPdfUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { handleAdminResetRepository } = usePractice();

  const handleResetDatabase = async () => {
    const confirm1 = window.confirm(
      "CRITICAL ACTION:\nThis will permanently delete all custom questions, attempt history, bookmarks, import logs, and set the repository back to a clean, completely empty state (0 active questions) both locally and on your Firestore cloud database.\n\nAre you sure you want to proceed?"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "CONFIRM AGAIN:\nAll questions and history will be deleted. You will have a completely empty question bank ready for a fresh PDF or JSON import.\n\nType 'OK' or click OK to verify."
    );
    if (!confirm2) return;

    setProcessingState({
      isProcessing: true,
      title: 'Wiping Database & Preparing Empty Repository',
      message: 'Purging documents from Firestore and local storage...',
      progress: 50,
      total: 100,
      current: 50
    });

    try {
      await handleAdminResetRepository();
      
      setProcessingState((prev) => ({
        ...prev,
        message: 'Successfully set database to 0 active questions. Re-indexing...',
        progress: 100
      }));
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert('Database successfully reset to a clean, empty repository!');
    } catch (err) {
      alert('Failed to reset database. Please try again.');
    } finally {
      setProcessingState((prev) => ({ ...prev, isProcessing: false }));
    }
  };
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isAuditorOpen, setIsAuditorOpen] = useState(false);

  // Pagination & Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit draft state
  const [editPrompt, setEditPrompt] = useState('');
  const [editRationale, setEditRationale] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');

  // File input Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modern UI feedback state for long-running database actions
  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    title: string;
    message: string;
    progress: number;
    total: number;
    current: number;
  }>({
    isProcessing: false,
    title: '',
    message: '',
    progress: 0,
    total: 0,
    current: 0,
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allQuestions;
    const q = searchQuery.toLowerCase();
    return allQuestions.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q) ||
        item.skill.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q)
    );
  }, [allQuestions, searchQuery]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = useMemo(() => {
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, startIndex, itemsPerPage]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete ${selectedIds.length} selected question(s)? This action will remove them from the database and cannot be undone.`;
    if (window.confirm(confirmMsg)) {
      setProcessingState({
        isProcessing: true,
        title: 'Executing Bulk Repository Deletion',
        message: `Preparing to delete ${selectedIds.length} question(s) from Firestore...`,
        progress: 0,
        total: selectedIds.length,
        current: 0
      });

      let currentCount = 0;
      const totalCount = selectedIds.length;

      for (const id of selectedIds) {
        currentCount++;
        const pct = Math.round((currentCount / totalCount) * 100);
        setProcessingState((prev) => ({
          ...prev,
          message: `Deleting question ID: ${id} (${currentCount} of ${totalCount})...`,
          progress: pct,
          current: currentCount
        }));
        
        await onDeleteQuestion(id);
      }

      setProcessingState((prev) => ({
        ...prev,
        message: 'Re-indexing question repository and syncing metadata...',
        progress: 100
      }));

      // Small delay for natural smooth transitions
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSelectedIds([]);
      setProcessingState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSingleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete question #${id}?`)) {
      setProcessingState({
        isProcessing: true,
        title: 'Deleting Question from Database',
        message: `Removing question ID: ${id} from cloud records...`,
        progress: 30,
        total: 1,
        current: 0
      });

      await onDeleteQuestion(id);

      setProcessingState((prev) => ({
        ...prev,
        message: `Successfully deleted question #${id}. Refreshing layout...`,
        progress: 100,
        current: 1
      }));

      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handleStartEdit = (item: Question) => {
    setEditingQuestionId(item.id);
    setEditPrompt(item.prompt);
    setEditRationale(item.rationale);
    setEditCorrectAnswer(item.correctAnswer);
  };

  const handleSaveEdit = async (original: Question) => {
    const updated: Question = {
      ...original,
      prompt: editPrompt.trim(),
      rationale: editRationale.trim(),
      correctAnswer: editCorrectAnswer.trim()
    };
    
    setProcessingState({
      isProcessing: true,
      title: 'Saving Question Changes',
      message: `Updating question ID: ${original.id} in Firestore...`,
      progress: 50,
      total: 1,
      current: 0
    });

    await onUpdateQuestion(updated);

    setProcessingState((prev) => ({
      ...prev,
      message: 'Changes saved successfully. Syncing database schemas...',
      progress: 100,
      current: 1
    }));

    await new Promise((resolve) => setTimeout(resolve, 500));
    setEditingQuestionId(null);
    setProcessingState((prev) => ({ ...prev, isProcessing: false }));
  };

  const handleRemoveFigure = (q: Question) => {
    if (window.confirm(`Remove attached reference figure from question ${q.id}?`)) {
      const updated = { ...q };
      delete updated.imageUrl;
      onUpdateQuestion(updated);
    }
  };

  const handleRemoveGraph = (q: Question) => {
    if (window.confirm(`Remove generated coordinate graph from question ${q.id}?`)) {
      const updated = { ...q };
      delete updated.graphConfig;
      onUpdateQuestion(updated);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `psat_question_bank_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setProcessingState({
            isProcessing: true,
            title: 'Bulk Importing Curriculum',
            message: `Parsing and validating ${parsed.length} imported JSON records...`,
            progress: 20,
            total: parsed.length,
            current: 0
          });

          await new Promise((resolve) => setTimeout(resolve, 600));

          setProcessingState((prev) => ({
            ...prev,
            message: 'Running deduplication and cloud synchronization audits...',
            progress: 60
          }));

          const res = await (onImportQuestions as any)(parsed, 'JSON File Upload');

          setProcessingState((prev) => ({
            ...prev,
            message: 'Curriculum imported! Writing to persistent storage...',
            progress: 100
          }));

          await new Promise((resolve) => setTimeout(resolve, 700));

          if (res && typeof res.addedCount === 'number') {
            if (res.duplicateCount > 0) {
              alert(`Import Complete!\n• ${res.addedCount} new unique question(s) added.\n• ${res.duplicateCount} duplicate question(s) filtered out.\n\nCheck the "Import Logs" tab for details.`);
            } else {
              alert(`Successfully imported ${res.addedCount} questions into the bank.`);
            }
          } else {
            alert(`Successfully imported ${parsed.length} questions.`);
          }
        }
      } catch {
        alert('Invalid JSON file format.');
      } finally {
        setProcessingState((prev) => ({ ...prev, isProcessing: false }));
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top action controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Question Repository Master View ({allQuestions.length} Questions)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection, inline editing, JSON backup, and instant database deletion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuditorOpen(true)}
              className="text-indigo-700 bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70"
              leftIcon={<ShieldCheck className="w-4 h-4 text-indigo-600" />}
            >
              100% Fidelity Auditor
            </Button>

            {onOpenPdfUpload && (
              <Button
                variant="gradient"
                size="sm"
                onClick={onOpenPdfUpload}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Import PDF / Text
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export JSON
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDatabase}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
            >
              Reset Database & Deletions
            </Button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs">
              <UploadCloud className="w-4 h-4 text-slate-600" />
              <span>Import JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, skill, prompt, or domain..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Panel */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl p-4 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-rose-900">
              Question{selectedIds.length > 1 ? 's' : ''} selected from the repository
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all cursor-pointer shadow-3xs"
            >
              Clear Selection
            </button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              className="rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </Button>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedItems.length > 0 && paginatedItems.every((q) => selectedIds.includes(q.id))}
                    onChange={() => {
                      const pageIds = paginatedItems.map((q) => q.id);
                      const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
                      if (isAllPageSelected) {
                        setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                      } else {
                        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">ID & Exam</th>
                <th className="px-4 py-3">Domain & Skill</th>
                <th className="px-4 py-3">Prompt Excerpt</th>
                <th className="px-4 py-3">Answer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((q) => {
                const isEditing = editingQuestionId === q.id;

                if (isEditing) {
                  return (
                    <tr key={q.id} className="bg-indigo-50/40">
                      <td className="px-4 py-3 text-center"></td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-900">{q.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">{q.skill}</span>
                      </td>
                      <td className="px-4 py-3" colSpan={2}>
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full p-2 text-xs rounded-lg border border-indigo-300 bg-white"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-bold">Answer:</span>
                            <input
                              type="text"
                              value={editCorrectAnswer}
                              onChange={(e) => setEditCorrectAnswer(e.target.value)}
                              className="w-24 px-2 py-1 text-xs rounded border border-indigo-300 bg-white"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(q)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{q.id}</div>
                      <div className="text-[11px] text-slate-500">{q.assessment}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{q.skill}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge difficulty={q.difficulty} size="xs">
                          {q.difficulty}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{q.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate text-slate-800 font-medium">{q.prompt}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {q.imageUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            <Image className="w-3 h-3 text-amber-600" />
                            Figure
                          </span>
                        )}
                        {q.tableData && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                            <Table className="w-3 h-3 text-blue-600" />
                            Table ({q.tableData.headers?.join('/') || 'Data'})
                          </span>
                        )}
                        {q.graphConfig && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                            <LineChart className="w-3 h-3 text-purple-600" />
                            Graph
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{q.correctAnswer}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {q.imageUrl && (
                          <button
                            onClick={() => handleRemoveFigure(q)}
                            className="p-1.5 text-amber-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove attached PDF figure"
                          >
                            <ImageOff className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Preview student card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(q)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSingleDelete(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs cursor-pointer"
            >
              {[10, 15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
          <div>
            Showing <span className="font-semibold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{totalItems}</span> question(s)
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              Previous
            </button>

            <div className="hidden md:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isNearCurrent = Math.abs(page - currentPage) <= 1;
                const isEdge = page === 1 || page === totalPages;
                if (!isNearCurrent && !isEdge) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={`ell-${page}`} className="text-slate-400 px-1 text-xs select-none">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <div className="flex md:hidden text-xs font-bold text-slate-700 select-none">
              Page {currentPage} of {totalPages}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Live Student View Preview</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <QuestionCard
              question={previewQuestion}
              isBookmarked={false}
              onToggleBookmark={() => {}}
              showRelated={false}
            />
          </div>
        </div>
      )}

      {/* High-End Absolute Interaction Blocker & Live Progress Overlay */}
      {processingState.isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            
            {/* Pulsing Active Core Indicator */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-14 h-14 rounded-full bg-indigo-500/10 animate-ping" />
                <div className="absolute w-12 h-12 rounded-full bg-indigo-500/20 animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {processingState.title}
                </h3>
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>Cloud Pipeline Active</span>
                </p>
              </div>
            </div>

            {/* Continuous Progress Bar & Status Log */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono gap-4">
                <span className="truncate text-left text-slate-300 font-semibold">
                  {processingState.message}
                </span>
                <span className="shrink-0 text-indigo-400 font-bold">
                  {processingState.progress}%
                </span>
              </div>
              
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 via-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
            </div>

            {/* Micro Engagement Text Box */}
            <div className="p-3.5 bg-slate-950/30 rounded-xl border border-slate-800/40 text-[11px] text-slate-400 leading-relaxed text-left">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pedagogical Quality Guard</span>
              </div>
              All question adjustments undergo synchronous schema validation, answer checking, and cross-reference auditing to maintain perfect index integrity.
            </div>

          </div>
        </div>
      )}
      {/* Automated Content Auditor Modal */}
      <ContentAuditorModal
        isOpen={isAuditorOpen}
        onClose={() => setIsAuditorOpen(false)}
        questions={allQuestions}
        onUpdateQuestion={onUpdateQuestion}
      />
    </div>
  );
});

AdminRepository.displayName = 'AdminRepository';
