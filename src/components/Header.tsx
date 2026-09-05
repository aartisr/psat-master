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
  Trophy
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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* 1. BRAND LOGO */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('bank')}
              className="group flex items-center gap-2 text-left focus:outline-none cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800/60 group-hover:ring-indigo-500/40 transition-all">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                    PSAT Master<span className="text-indigo-600">.</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 rounded-md shadow-2xs">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden xl:block font-medium">99th Percentile Practice Engine</p>
              </div>
            </button>
          </div>

          {/* 2. CENTERED PRIMARY NAVIGATION TABS (DESKTOP) */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-inner">
            
            {/* Questions Bank */}
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Questions</span>
            </button>

            {/* Smart Drills */}
            <button
              onClick={() => setActiveTab('smart_drills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'smart_drills'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Drills</span>
            </button>

            {/* Mistake Notebook */}
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'mistakes'
                  ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mistakes</span>
              {activeMistakesCount > 0 && (
                <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full border border-rose-200/70">
                  {activeMistakesCount}
                </span>
              )}
            </button>

            {/* Analytics */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            {/* Resources / More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isMoreActive
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>Resources</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute left-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 ring-1 ring-slate-900/10 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('cheats');
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'cheats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <div>Cheat Sheets</div>
                      <div className="text-[10px] text-slate-400 font-normal">Math &amp; Reading formula notes</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('feedback');
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'feedback' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <MessageSquarePlus className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <div>Feedback &amp; Roadmap</div>
                      <div className="text-[10px] text-slate-400 font-normal">Report issues or request features</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Command Center Tab (Highlighted for Admins) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-indigo-300 shadow-xs ring-1 ring-slate-950'
                    : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Admin Center</span>
              </button>
            )}
          </nav>

          {/* 3. RIGHT ACTION BAR & POWER TOOLS */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Consolidated Student Math Tools Menu */}
            <div className="relative" ref={toolsMenuRef}>
              <div className="hidden sm:flex items-center gap-0.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
                <button
                  onClick={onOpenCalculator}
                  title="Scientific Calculator"
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <CalcIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenFormulaSheet}
                  title="PSAT / SAT Math Formulas"
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <BookMarked className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenScratchpad}
                  title="Digital Whiteboard & Scratchpad"
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Tools Dropdown Trigger */}
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="sm:hidden p-2 text-slate-600 hover:text-indigo-600 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Student Math Tools"
              >
                <CalcIcon className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onOpenCalculator();
                      setShowToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    <CalcIcon className="w-4 h-4 text-indigo-600" />
                    <span>Scientific Calculator</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenFormulaSheet();
                      setShowToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    <BookMarked className="w-4 h-4 text-indigo-600" />
                    <span>Math Formula Sheet</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenScratchpad();
                      setShowToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>Digital Scratchpad</span>
                  </button>
                </div>
              )}
            </div>

            {/* Score Goal / Projector */}
            {onOpenScoreSimulator && (
              <button
                onClick={onOpenScoreSimulator}
                title="PSAT / SAT Score Goal & National Merit Index Simulator"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs font-black shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span className="hidden lg:inline">Score Goal</span>
              </button>
            )}

            {/* Keyboard Shortcuts Hint */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (?)"
                className="hidden xl:flex items-center justify-center w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-mono font-bold shadow-2xs transition-all cursor-pointer"
              >
                ?
              </button>
            )}

            {/* Daily Streak */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl text-amber-950 text-xs font-bold shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{streak}d</span>
            </div>

            {/* Sprint CTA */}
            <button
              onClick={onOpenQuickDrill}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-bold shadow-xs shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Sprint</span>
            </button>

            {/* Export Report PDF */}
            <button
              onClick={onOpenPdfExport}
              title="Export PSAT Progress Report PDF"
              className="p-2 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-all shadow-2xs hidden md:block cursor-pointer"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* User Profile & Account Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer ring-1 ring-slate-900/5 shrink-0"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-700 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                
                <span className="hidden xl:inline font-bold text-slate-800 max-w-[80px] truncate">
                  {user?.displayName || (isAdmin ? 'Admin' : 'Guest')}
                </span>

                <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 ring-1 ring-slate-900/10">
                  <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {user?.displayName || 'Guest Student'}
                      </p>
                      {isAdmin ? (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-md shadow-2xs">
                          ADMIN
                        </span>
                      ) : user && !user.isAnonymous ? (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                          STUDENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-600 rounded-md">
                          GUEST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email || 'Guest Student · Session Mode'}</p>
                    
                    {user && !user.isAnonymous ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] bg-emerald-50/90 px-2.5 py-1.5 rounded-lg border border-emerald-200/70">
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
                              Sync Now
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-amber-50/90 border border-amber-200/70 rounded-xl text-left text-[10px] text-amber-800">
                        <div className="flex items-center gap-1 font-bold">
                          <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Guest Mode Active</span>
                        </div>
                        Sign in to preserve cross-device history.
                      </div>
                    )}
                  </div>

                  {/* Admin Command Center Quick Link */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Open Admin Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('feedback');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-indigo-600" />
                    <span>Feedback &amp; Feature Roadmap</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenPdfExport();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-colors md:hidden cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Export Progress PDF</span>
                  </button>

                  {!user || user.isAnonymous ? (
                    <button
                      onClick={() => {
                        onOpenAuthModal();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-xs cursor-pointer"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
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
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* MOBILE NAVIGATION BAR & DRAWER */}
        {showMobileMenu && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => { setActiveTab('bank'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'bank' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Question Bank</span>
              </button>

              <button
                onClick={() => { setActiveTab('smart_drills'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'smart_drills' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Smart Drills</span>
              </button>

              <button
                onClick={() => { setActiveTab('mistakes'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'mistakes' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Mistakes ({activeMistakesCount})</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'analytics' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab('cheats'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'cheats' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Cheat Sheets</span>
              </button>

              <button
                onClick={() => { setActiveTab('feedback'); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl flex items-center gap-2 border ${
                  activeTab === 'feedback' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <MessageSquarePlus className="w-4 h-4 text-indigo-600" />
                <span>Feedback</span>
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => { setActiveTab('admin'); setShowMobileMenu(false); }}
                className="w-full p-2.5 rounded-xl bg-slate-900 text-indigo-300 font-extrabold flex items-center justify-center gap-2 text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Admin Command Center</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

