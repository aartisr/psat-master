import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Flame, 
  FileText, 
  BarChart3, 
  Zap, 
  Target,
  User as UserIcon,
  Cloud,
  CloudOff,
  LogOut,
  LogIn,
  ShieldCheck,
  Calculator as CalcIcon,
  BookOpen,
  Edit3,
  RotateCcw,
  BookMarked,
  ChevronDown,
  MessageSquarePlus,
  Sparkles,
  Layers,
  MoreHorizontal,
  HelpCircle,
  Menu,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trophy,
  Keyboard,
  Calendar
} from 'lucide-react';
import { UserProfile, isUserAdmin } from '../types';
import { SyncStatusInfo } from '../lib/batchSync';

export type MainNavTab = 'bank' | 'smart_drills' | 'mistakes' | 'cheats' | 'analytics' | 'drill' | 'admin' | 'feedback';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  streak: number;
  bookmarkedCount: number;
  activeMistakesCount: number;
  user: UserProfile | null;
  isSyncing: boolean;
  syncStatus?: SyncStatusInfo;
  onForceSync?: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenQuickDrill: () => void;
  onOpenPdfExport: () => void;
  onOpenUpload: () => void;
  onOpenCalculator: () => void;
  onOpenFormulaSheet: () => void;
  onOpenScratchpad: () => void;
  onOpenShortcuts?: () => void;
  onOpenScoreSimulator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  streak,
  bookmarkedCount,
  activeMistakesCount,
  user,
  isSyncing,
  syncStatus,
  onForceSync,
  onOpenAuthModal,
  onLogout,
  onOpenQuickDrill,
  onOpenPdfExport,
  onOpenUpload,
  onOpenCalculator,
  onOpenFormulaSheet,
  onOpenScratchpad,
  onOpenShortcuts,
  onOpenScoreSimulator
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = isUserAdmin(user?.email);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = activeTab === 'cheats' || activeTab === 'feedback';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. BRAND IDENTITY */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('bank')}
              className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:bg-blue-700 transition-colors">
                P
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  PSAT Master
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70 rounded">
                  PRO
                </span>
              </div>
            </button>
          </div>

          {/* 2. SLEEK SEGMENTED NAVIGATION (DESKTOP) */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            
            {/* Questions Bank */}
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Questions</span>
            </button>

            {/* Smart Drills */}
            <button
              onClick={() => setActiveTab('smart_drills')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'smart_drills'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Drills</span>
            </button>

            {/* Mistakes */}
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'mistakes'
                  ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mistakes</span>
              {activeMistakesCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full border border-rose-200">
                  {activeMistakesCount}
                </span>
              )}
            </button>

            {/* Analytics */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            {/* More Menu Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isMoreActive
                    ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>More</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('cheats');
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'cheats' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold">Concept Cheat Sheets</div>
                      <div className="text-[10px] text-slate-400">Formulas &amp; rules</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('feedback');
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'feedback' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquarePlus className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold">Feedback &amp; Roadmap</div>
                      <div className="text-[10px] text-slate-400">Suggest new features</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Command Center Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-blue-400 shadow-xs'
                    : 'text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* 3. UNCLUTTERED RIGHT ACTION BAR & STUDY SUITE */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Minimal Streak Indicator */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 text-xs font-bold shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streak}d</span>
            </div>

            {/* Consolidated Study Suite Tools Menu */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showToolsMenu
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Tools</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-2">
                  {/* Exam Countdown Card */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target PSAT Exam</div>
                        <div className="text-xs font-bold text-slate-800">October 12th</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black font-mono rounded-md">
                      42 Days
                    </span>
                  </div>

                  {/* Math Suite Tools */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Digital Exam Suite
                    </div>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          onOpenCalculator();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CalcIcon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Scientific Calculator</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">C</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenFormulaSheet();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Math Formulas</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenScratchpad();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Digital Scratchpad</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">S</span>
                      </button>
                    </div>
                  </div>

                  {/* Projections & Utilities */}
                  <div className="pt-1 border-t border-slate-100">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Projections &amp; Output
                    </div>
                    <div className="space-y-0.5">
                      {onOpenScoreSimulator && (
                        <button
                          onClick={() => {
                            onOpenScoreSimulator();
                            setShowToolsMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">Score Simulator &amp; Merit Index</span>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenPdfExport();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Export Progress Report PDF</span>
                      </button>

                      {onOpenShortcuts && (
                        <button
                          onClick={() => {
                            onOpenShortcuts();
                            setShowToolsMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">Keyboard Shortcuts</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">?</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: Sprint */}
            <button
              onClick={onOpenQuickDrill}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Sprint</span>
            </button>

            {/* User Profile Pill */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer shrink-0"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AS'}
                  </div>
                )}
                
                <span className="hidden sm:inline text-xs font-medium text-slate-800 max-w-[90px] truncate">
                  {user?.displayName || 'Aarti'}
                </span>

                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user?.displayName || 'Guest Student'}
                      </p>
                      {isAdmin ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-600 text-white rounded">
                          ADMIN
                        </span>
                      ) : user && !user.isAnonymous ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                          STUDENT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-600 rounded">
                          GUEST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email || 'Guest Student · Session Mode'}</p>
                    
                    {user && !user.isAnonymous ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold truncate">
                            {isSyncing || syncStatus?.state === 'saving' ? (
                              <RefreshCw className="w-3 h-3 text-emerald-600 shrink-0 animate-spin" />
                            ) : syncStatus?.pendingCount && syncStatus.pendingCount > 0 ? (
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {isSyncing || syncStatus?.state === 'saving'
                                ? 'Writing batch...'
                                : syncStatus?.pendingCount && syncStatus.pendingCount > 0
                                ? `${syncStatus.pendingCount} queued in batch`
                                : 'Cloud synced'}
                            </span>
                          </div>
                          {onForceSync && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onForceSync();
                              }}
                              disabled={isSyncing}
                              title="Flush queue and sync with cloud"
                              className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 underline ml-1 cursor-pointer disabled:opacity-50"
                            >
                              Sync
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200/70 rounded-lg text-left text-[10px] text-amber-800">
                        <div className="flex items-center gap-1 font-bold">
                          <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Guest Mode Active</span>
                        </div>
                        Sign in to preserve cross-device history.
                      </div>
                    )}
                  </div>

                  {/* Admin Quick Link */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>Open Admin Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('feedback');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                    <span>Feedback &amp; Feature Roadmap</span>
                  </button>

                  {!user || user.isAnonymous ? (
                    <button
                      onClick={() => {
                        onOpenAuthModal();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Save Progress</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {showMobileMenu && (
          <div className="lg:hidden py-3 border-t border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('bank'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'bank' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Questions</span>
              </button>

              <button
                onClick={() => { setActiveTab('smart_drills'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'smart_drills' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Smart Drills</span>
              </button>

              <button
                onClick={() => { setActiveTab('mistakes'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'mistakes' ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Mistakes ({activeMistakesCount})</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'analytics' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab('cheats'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'cheats' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Cheat Sheets</span>
              </button>

              <button
                onClick={() => { setActiveTab('feedback'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-lg flex items-center gap-2 border ${
                  activeTab === 'feedback' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                <span>Feedback</span>
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => { setActiveTab('admin'); setShowMobileMenu(false); }}
                className="w-full p-2.5 rounded-lg bg-slate-900 text-blue-400 font-bold flex items-center justify-center gap-2 text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Admin Command Center</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

