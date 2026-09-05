import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  PlusCircle, 
  Layers, 
  BarChart3, 
  FileCheck2,
  X,
  Lock,
  FileText
} from 'lucide-react';
import { 
  Question, 
  UserProfile, 
  ADMIN_EMAILS, 
  isUserAdmin 
} from '../types';
import { AdminExtractor } from './admin/AdminExtractor';
import { AdminBuilder } from './admin/AdminBuilder';
import { AdminRepository } from './admin/AdminRepository';
import { AdminTelemetry } from './admin/AdminTelemetry';
import { AdminImportLogs } from './admin/AdminImportLogs';
import { ContentAuditorModal } from './admin/ContentAuditorModal';
import { usePractice } from '../context/PracticeContext';

export interface AdminPortalProps {
  user: UserProfile | null;
  allQuestions: Question[];
  onAddQuestion: (question: Question) => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (questions: Question[]) => void;
  onOpenPdfUpload?: () => void;
  onClose: () => void;
}

export type AdminTab = 'upload' | 'create' | 'manage' | 'auditor' | 'logs' | 'telemetry';

export const AdminPortal: React.FC<AdminPortalProps> = React.memo(({
  user,
  allQuestions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onOpenPdfUpload,
  onClose
}) => {
  const isAdmin = isUserAdmin(user?.email);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('upload');
  const { importLogs, handleClearImportLogs } = usePractice();

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Admin Access Required</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Only verified administrators ({ADMIN_EMAILS.join(', ')}) have upload and authoring permissions. Please sign in with an authorized account.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          Return to Question Bank
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Administrator
            </span>
            <span className="text-xs text-slate-400 font-mono">{user?.email}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Curriculum Authoring & AI Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Publish, OCR-extract, and manage official PSAT 8/9, PSAT 10, PSAT/NMSQT, and SAT questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenPdfUpload && (
            <button
              onClick={onOpenPdfUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Import PDF / Text</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Admin View</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>AI Question Extractor</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'create'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Interactive Builder</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('manage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'manage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Question Repository ({allQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('auditor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'auditor'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>100% Fidelity Auditor</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Import Logs ({importLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Coverage Telemetry</span>
        </button>
      </div>

      {/* Admin Tab Views */}
      {activeAdminTab === 'upload' && (
        <AdminExtractor
          userEmail={user?.email}
          onImportQuestions={(qs) => onImportQuestions(qs)}
          onOpenPdfUpload={onOpenPdfUpload}
        />
      )}

      {activeAdminTab === 'create' && (
        <AdminBuilder onAddQuestion={onAddQuestion} />
      )}

      {activeAdminTab === 'manage' && (
        <AdminRepository
          allQuestions={allQuestions}
          onUpdateQuestion={onUpdateQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onImportQuestions={(qs) => onImportQuestions(qs)}
          onOpenPdfUpload={onOpenPdfUpload}
        />
      )}

      {activeAdminTab === 'auditor' && (
        <ContentAuditorModal
          isOpen={true}
          onClose={() => setActiveAdminTab('manage')}
          questions={allQuestions}
          onUpdateQuestion={onUpdateQuestion}
        />
      )}

      {activeAdminTab === 'logs' && (
        <AdminImportLogs
          importLogs={importLogs}
          onClearLogs={handleClearImportLogs}
        />
      )}

      {activeAdminTab === 'telemetry' && (
        <AdminTelemetry allQuestions={allQuestions} />
      )}
    </div>
  );
});

AdminPortal.displayName = 'AdminPortal';
