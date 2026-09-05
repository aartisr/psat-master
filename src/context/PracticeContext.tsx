import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Question, 
  FilterCriteria, 
  UserAttempt, 
  UserProfile, 
  OverallAnalytics,
  DrillSession,
  isUserAdmin,
  ImportLog
} from '../types';
import { initialQuestions, searchQuestions } from '../data/questions';
import { 
  getStoredAttempts, 
  saveAttempt, 
  getBookmarks, 
  toggleBookmark, 
  getStreakInfo, 
  calculateAnalytics,
  getStoredCustomQuestions,
  saveStoredCustomQuestions
} from '../utils/storage';
import { 
  processQuestionDeduplication, 
  getStoredImportLogs, 
  saveImportLog, 
  clearStoredImportLogs, 
  DeduplicationResult 
} from '../utils/deduplication';
import { shouldAttachVisualReference } from '../utils/pdfExtractor';
import { extractTableData } from '../utils/tableParser';
import { 
  auth, 
  logoutUser, 
  getLocalGuestProfile,
  syncAttemptToFirestore, 
  loadAttemptsFromFirestore,
  syncBookmarkToFirestore,
  loadBookmarksFromFirestore,
  syncAnalyticsSummaryToFirestore,
  loadCustomQuestionsFromFirestore,
  syncCustomQuestionToFirestore,
  deleteCustomQuestionFromFirestore,
  syncImportLogToFirestore,
  loadImportLogsFromFirestore,
  wipeUserCloudDatabase,
  formatUserProfile,
  registerQuotaExceededCallback,
  triggerFirebaseQuotaExceeded,
  bulkSyncCustomQuestionsToFirestore
} from '../lib/firebase';
import {
  queueAttemptSync,
  queueBookmarksSync,
  queueAnalyticsSync,
  queueCustomQuestionSync,
  queueCustomQuestionDeletionSync,
  queueImportLogSync,
  flushBatchSyncNow,
  subscribeToSyncStatus,
  loadAttemptsOptimized,
  loadBookmarksOptimized,
  loadCustomQuestionsOptimized,
  SyncStatusInfo
} from '../lib/batchSync';
import { onAuthStateChanged } from 'firebase/auth';

export interface PracticeContextType {
  // Questions & Filtering
  allQuestions: Question[];
  filteredQuestions: Question[];
  searchTimeMs: number;
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;

  // Student Progress
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isSyncing: boolean;
  isCloudQuotaExceeded: boolean;
  syncStatus: SyncStatusInfo;
  flushPendingSync: () => Promise<void>;
  forceCloudSync: () => Promise<void>;
  attempts: UserAttempt[];
  bookmarks: string[];
  streak: number;
  analytics: OverallAnalytics;
  activeMistakesCount: number;

  // Handlers
  handleQuestionAttempt: (questionId: string, isCorrect: boolean, timeSpent: number, hintsUsed: number) => void;
  handleToggleBookmark: (id: string) => void;
  handleLogout: () => Promise<void>;
  
  // Admin Question Operations & Audit Logs
  importLogs: ImportLog[];
  handleClearImportLogs: () => void;
  handleAdminAddQuestion: (question: Question) => Promise<void>;
  handleAdminUpdateQuestion: (question: Question) => Promise<void>;
  handleAdminDeleteQuestion: (id: string) => Promise<void>;
  handleAdminResetRepository: () => Promise<void>;
  handleAdminImportQuestions: (
    questions: Question[],
    source?: 'AI Extractor / OCR' | 'JSON File Upload' | 'PDF / Text Importer' | 'Manual Question Builder'
  ) => DeduplicationResult;

  // Modals and Student Tools
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;
  isFormulaSheetOpen: boolean;
  setIsFormulaSheetOpen: (open: boolean) => void;
  scratchpadData: { isOpen: boolean; prompt?: string };
  setScratchpadData: (data: { isOpen: boolean; prompt?: string }) => void;
  isPdfExportOpen: boolean;
  setIsPdfExportOpen: (open: boolean) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isScoreSimulatorOpen: boolean;
  setIsScoreSimulatorOpen: (open: boolean) => void;

  // Active Drill Session
  activeDrill: {
    questions: Question[];
    title: string;
    mode: 'daily' | 'skill' | 'weakness' | 'custom';
  } | null;
  setActiveDrill: React.Dispatch<React.SetStateAction<{
    questions: Question[];
    title: string;
    mode: 'daily' | 'skill' | 'weakness' | 'custom';
  } | null>>;
  launchDailyDrill: () => void;
  launchFilteredDrill: () => void;
  launchSkillDrill: (skillName: string) => void;
  launchWeaknessDrill: () => void;
  launchMissedDrill: (customIds?: string[]) => void;
  launchTimedDrill: (test: 'Math' | 'Reading and Writing') => void;
  launchHardDrill: () => void;
}

const PracticeContext = createContext<PracticeContextType | null>(null);

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterCriteria>({
    query: '',
    assessment: 'all',
    test: 'all',
    domain: 'all',
    skill: 'all',
    difficulty: 'all',
    status: 'all',
    sortBy: 'relevance'
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Auth & Sync state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCloudQuotaExceeded, setIsCloudQuotaExceeded] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>({
    state: 'saved',
    pendingCount: 0,
    lastSyncedAt: null,
    message: 'All changes saved'
  });

  // Subscribe to real-time batch sync status
  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  // Local state for interactive persistence
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(1);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);

  // Active Drill session state
  const [activeDrill, setActiveDrill] = useState<{
    questions: Question[];
    title: string;
    mode: 'daily' | 'skill' | 'weakness' | 'custom';
  } | null>(null);

  // Student Tool Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState(false);
  const [scratchpadData, setScratchpadData] = useState<{ isOpen: boolean; prompt?: string }>({
    isOpen: false
  });
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isScoreSimulatorOpen, setIsScoreSimulatorOpen] = useState(false);

  // Global Keyboard Shortcuts (Press '?' to open shortcuts, Esc to close modals, 'C'/'F'/'S' for tools)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsScoreSimulatorOpen(false);
        setIsCalculatorOpen(false);
        setIsFormulaSheetOpen(false);
        setScratchpadData({ isOpen: false });
        setIsPdfExportOpen(false);
        setIsUploadOpen(false);
        setIsAuthModalOpen(false);
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsCalculatorOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsFormulaSheetOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setScratchpadData((prev) => ({ isOpen: !prev.isOpen }));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Initial local load
  useEffect(() => {
    setAttempts(getStoredAttempts());
    setBookmarks(getBookmarks());
    setStreak(getStreakInfo().currentStreak);
    setImportLogs(getStoredImportLogs());

    const storedCustom = getStoredCustomQuestions();
    // Generic sanitization: ensure any custom question without visual references does not hold orphan image URLs, and recover any missing tables
    const sanitized = storedCustom.map((q) => {
      let updated = { ...q };

      // 1. If a question doesn't reference any visual figure, clean any erroneous attached imageUrl
      if (updated.imageUrl && !shouldAttachVisualReference(updated.prompt)) {
        delete updated.imageUrl;
      }

      // 2. If tableData is missing but prompt text contains tabular data, auto-extract it generically
      if (!updated.tableData && updated.prompt) {
        const extracted = extractTableData(updated.prompt);
        if (extracted) {
          updated.tableData = extracted;
        }
      }

      return updated;
    });

    setCustomQuestions(sanitized);
    
    registerQuotaExceededCallback((exceeded) => {
      setIsCloudQuotaExceeded(exceeded);
    });
  }, []);

  // Whenever customQuestions state changes, synchronize to localStorage to guarantee local-first resilience
  useEffect(() => {
    saveStoredCustomQuestions(customQuestions);
  }, [customQuestions]);

  // Firebase Auth Listener with Optimized Delta & Single-Read Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = formatUserProfile(user);
        setCurrentUser(profile);
        setIsSyncing(true);

        try {
          // Optimized loaders: delta attempts, consolidated single-read bookmarks, cached custom questions
          const [cloudAttempts, cloudBookmarks, cloudCustomQs, cloudLogs] = await Promise.all([
            loadAttemptsOptimized(user.uid, getStoredAttempts()),
            loadBookmarksOptimized(user.uid, getBookmarks()),
            loadCustomQuestionsOptimized(user.uid, getStoredCustomQuestions()),
            loadImportLogsFromFirestore(user.uid)
          ]);

          if (cloudAttempts.length > 0) {
            setAttempts((prev) => {
              const map = new Map<string, UserAttempt>();
              prev.forEach((a) => map.set(a.id, a));
              cloudAttempts.forEach((a) => map.set(a.id, a));
              return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
            });
          }

          if (cloudBookmarks.length > 0) {
            setBookmarks((prev) => Array.from(new Set([...prev, ...cloudBookmarks])));
          }

          if (cloudCustomQs.length > 0) {
            setCustomQuestions((prev) => {
              const map = new Map<string, Question>();
              prev.forEach((q) => map.set(q.id, q));
              cloudCustomQs.forEach((q) => map.set(q.id, q));
              return Array.from(map.values());
            });
          }

          if (cloudLogs.length > 0) {
            setImportLogs((prev) => {
              const map = new Map<string, ImportLog>();
              prev.forEach((l) => map.set(l.id, l));
              cloudLogs.forEach((l) => map.set(l.id, l));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        } catch (e) {
          console.warn('Sync on auth change failed:', e);
        } finally {
          setIsSyncing(false);
        }
      } else {
        const guest = getLocalGuestProfile();
        setCurrentUser(guest);
      }
    });

    return () => unsubscribe();
  }, []);

  // Combine static repository and custom questions, excluding deleted ones
  const allQuestions = useMemo(() => {
    const deletedIds = new Set<string>();
    
    // Extract deleted question IDs from customQuestions
    customQuestions.forEach((q) => {
      if (q.isDeleted) {
        deletedIds.add(q.id);
      }
    });

    // LocalStorage fallback for deleted IDs
    try {
      const stored = localStorage.getItem('psat_deleted_question_ids');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          ids.forEach((id) => deletedIds.add(id));
        }
      }
    } catch (e) {
      console.warn('Failed to parse deleted question IDs from local storage:', e);
    }

    const map = new Map<string, Question>();

    // Add initial questions if they aren't marked as deleted
    initialQuestions.forEach((q: Question) => {
      if (!deletedIds.has(q.id)) {
        map.set(q.id, q);
      }
    });

    // Add custom questions if they aren't marked as deleted
    customQuestions.forEach((q: Question) => {
      if (!deletedIds.has(q.id) && !q.isDeleted) {
        const base = map.get(q.id);
        if (base) {
          // If custom question lacks tableData or graphConfig, inherit from base
          const merged: Question = {
            ...base,
            ...q,
            tableData: q.tableData || base.tableData,
            graphConfig: q.graphConfig !== undefined ? q.graphConfig : base.graphConfig,
            imageUrl: q.imageUrl
          };
          map.set(q.id, merged);
        } else {
          map.set(q.id, q);
        }
      }
    });

    return Array.from(map.values());
  }, [customQuestions]);

  // High-performance search & filter pipeline
  const { results: filteredQuestions, searchTimeMs } = useMemo(() => {
    return searchQuestions(allQuestions, filters);
  }, [allQuestions, filters]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const analytics = useMemo(() => {
    const res = calculateAnalytics(attempts, allQuestions.length);
    if (currentUser?.uid && !currentUser.isAnonymous) {
      queueAnalyticsSync(currentUser.uid, res);
    }
    return res;
  }, [attempts, allQuestions.length, currentUser?.uid, currentUser?.isAnonymous]);

  // Compute active mistakes count
  const lastAttemptByQuestion = useMemo<Record<string, UserAttempt>>(() => {
    const map: Record<string, UserAttempt> = {};
    attempts.forEach((a) => {
      map[a.questionId] = a;
    });
    return map;
  }, [attempts]);

  const activeMistakesCount = useMemo(() => {
    return (Object.values(lastAttemptByQuestion) as UserAttempt[]).filter((a) => !a.isCorrect).length;
  }, [lastAttemptByQuestion]);

  const handleToggleBookmark = useCallback((id: string) => {
    toggleBookmark(id);
    const updated = getBookmarks();
    setBookmarks(updated);
    if (currentUser?.uid && !currentUser.isAnonymous) {
      // Queues single consolidated bookmark list into batch sync (1 document write instead of N!)
      queueBookmarksSync(currentUser.uid, updated);
    }
  }, [currentUser]);

  const handleQuestionAttempt = useCallback((
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
    hintsUsed: number
  ) => {
    const q = allQuestions.find((item: Question) => item.id === questionId);
    if (!q) return;

    const newAttempt = saveAttempt({
      questionId,
      userAnswer: '',
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      isCorrect,
      timeSpentSeconds: timeSpent,
      hintsRevealed: hintsUsed
    });

    const updatedAttempts = getStoredAttempts();
    setAttempts(updatedAttempts);
    setStreak(getStreakInfo().currentStreak);

    if (currentUser?.uid && !currentUser.isAnonymous) {
      // Queue attempt into batch sync (auto-flushed after debounce or drill completion)
      queueAttemptSync(currentUser.uid, newAttempt);
    }
  }, [allQuestions, currentUser]);

  const flushPendingSync = useCallback(async () => {
    if (currentUser?.uid && !currentUser.isAnonymous) {
      await flushBatchSyncNow(currentUser.uid);
    }
  }, [currentUser]);

  const forceCloudSync = useCallback(async () => {
    if (!currentUser?.uid || currentUser.isAnonymous) return;
    setIsSyncing(true);
    try {
      await flushBatchSyncNow(currentUser.uid);
      const [cloudAttempts, cloudBookmarks, cloudCustomQs] = await Promise.all([
        loadAttemptsOptimized(currentUser.uid, attempts, true),
        loadBookmarksOptimized(currentUser.uid, bookmarks, true),
        loadCustomQuestionsOptimized(currentUser.uid, customQuestions, true)
      ]);
      setAttempts(cloudAttempts);
      setBookmarks(cloudBookmarks);
      setCustomQuestions(cloudCustomQs);
    } catch (e) {
      console.warn('Manual cloud sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, attempts, bookmarks, customQuestions]);

  const handleLogout = useCallback(async () => {
    if (currentUser?.uid && !currentUser.isAnonymous) {
      await flushBatchSyncNow(currentUser.uid);
    }
    try {
      await logoutUser();
      setCurrentUser(getLocalGuestProfile());
    } catch (e) {
      console.warn('Logout fallback:', e);
      setCurrentUser(getLocalGuestProfile());
    }
  }, [currentUser]);

  // Admin Question Handlers
  const undeleteQuestionIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);

    // 1. Remove from localStorage
    try {
      const stored = localStorage.getItem('psat_deleted_question_ids');
      if (stored) {
        const deletedIds = JSON.parse(stored);
        if (Array.isArray(deletedIds)) {
          const updated = deletedIds.filter((id) => !idSet.has(id));
          localStorage.setItem('psat_deleted_question_ids', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('Failed to clear deleted question IDs from local storage:', e);
    }

    // 2. Remove placeholder isDeleted questions from customQuestions
    setCustomQuestions((prev) => {
      return prev.filter((q) => !(q.isDeleted && idSet.has(q.id)));
    });
  }, []);

  const handleAdminAddQuestion = useCallback(async (newQ: Question) => {
    undeleteQuestionIds([newQ.id]);
    setCustomQuestions((prev) => [newQ, ...prev]);
    if (currentUser?.uid) {
      queueCustomQuestionSync(currentUser.uid, newQ);
    }
    try {
      await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(newQ)
      });
    } catch (e) {
      console.warn('Server sync failed:', e);
    }
  }, [currentUser, undeleteQuestionIds]);

  const handleAdminUpdateQuestion = useCallback(async (updatedQ: Question) => {
    undeleteQuestionIds([updatedQ.id]);
    setCustomQuestions((prev) => {
      const exists = prev.some((q) => q.id === updatedQ.id);
      if (exists) {
        return prev.map((q) => (q.id === updatedQ.id ? updatedQ : q));
      }
      return [updatedQ, ...prev];
    });
    if (currentUser?.uid) {
      queueCustomQuestionSync(currentUser.uid, updatedQ);
    }
    try {
      await fetch(`/api/admin/questions/${updatedQ.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(updatedQ)
      });
    } catch (e) {
      console.warn('Server sync failed:', e);
    }
  }, [currentUser, undeleteQuestionIds]);

  const handleAdminDeleteQuestion = useCallback(async (id: string) => {
    // Determine if it is a static/initial question or a custom/imported question
    const isInitial = initialQuestions.some((q) => q.id === id);

    if (isInitial) {
      // Mark static question as deleted by saving a deletion placeholder
      const deletedPlaceholder: Question = {
        id,
        isDeleted: true,
        assessment: 'PSAT 8/9',
        test: 'Math',
        domain: 'Algebra',
        skill: 'Placeholder',
        difficulty: 'Easy',
        type: 'multiple_choice',
        prompt: 'DELETED',
        correctAnswer: 'X',
        rationale: 'DELETED',
        hints: [],
        concepts: []
      };

      setCustomQuestions((prev) => {
        const filtered = prev.filter((q) => q.id !== id);
        return [deletedPlaceholder, ...filtered];
      });

      if (currentUser?.uid) {
        queueCustomQuestionSync(currentUser.uid, deletedPlaceholder);
      }
    } else {
      // For custom/imported questions, we mark them as deleted in state and batch queue deletion
      const deletedPlaceholder: Question = {
        id,
        isDeleted: true,
        assessment: 'PSAT 8/9',
        test: 'Math',
        domain: 'Algebra',
        skill: 'Placeholder',
        difficulty: 'Easy',
        type: 'multiple_choice',
        prompt: 'DELETED',
        correctAnswer: 'X',
        rationale: 'DELETED',
        hints: [],
        concepts: []
      };

      setCustomQuestions((prev) => {
        const filtered = prev.filter((q) => q.id !== id);
        return [deletedPlaceholder, ...filtered];
      });

      if (currentUser?.uid) {
        queueCustomQuestionSync(currentUser.uid, deletedPlaceholder);
      }
    }

    // LocalStorage tracking for immediate guest & offline fallback
    try {
      const stored = localStorage.getItem('psat_deleted_question_ids');
      const deletedIds = stored ? JSON.parse(stored) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('psat_deleted_question_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('Failed to save deleted question ID to local storage:', e);
    }

    try {
      await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser?.email || ''
        }
      });
    } catch (e) {
      console.warn('Server sync failed:', e);
    }
  }, [currentUser]);

  const handleAdminResetRepository = useCallback(async () => {
    // 1. Mark all 36 initial questions as deleted so the database is completely empty (0 questions)
    const initialIds = initialQuestions.map((q) => q.id);
    try {
      localStorage.setItem('psat_deleted_question_ids', JSON.stringify(initialIds));
    } catch (e) {
      console.warn('Failed to save initial question deleted IDs to local storage:', e);
    }

    // Create deletion placeholders for all 36 initial questions to sync to state and Firestore
    const initialDeletePlaceholders: Question[] = initialQuestions.map((q) => ({
      id: q.id,
      isDeleted: true,
      assessment: q.assessment,
      test: q.test,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      type: q.type,
      prompt: 'DELETED',
      correctAnswer: 'X',
      rationale: 'DELETED',
      hints: [],
      concepts: []
    }));

    // 2. Clear state with initial deletion placeholders to keep the 36 questions hidden
    setCustomQuestions(initialDeletePlaceholders);
    setAttempts([]);
    setBookmarks([]);
    setImportLogs([]);

    // 3. Clear cloud database if logged in, then sync the initial deletion placeholders
    if (currentUser?.uid) {
      try {
        if (!isCloudQuotaExceeded) {
          const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Cloud wipe timeout')), 3000));
          await Promise.race([wipeUserCloudDatabase(currentUser.uid), timeout]).catch(e => {
            console.warn('Wipe timeout or error, continuing local reset:', e);
            if (e && e.message === 'Cloud wipe timeout') {
               setIsCloudQuotaExceeded(true);
               triggerFirebaseQuotaExceeded();
            }
          });
        }
        // Sync initial deletion placeholders to Firestore in bulk so they are hidden on all devices (atomic)
        if (initialDeletePlaceholders.length > 0) {
          await bulkSyncCustomQuestionsToFirestore(currentUser.uid, initialDeletePlaceholders);
        }
      } catch (e) {
        console.warn('Wipe and sync cloud database failed during reset:', e);
      }
    }
  }, [currentUser, isCloudQuotaExceeded]);

  const handleClearImportLogs = useCallback(() => {
    clearStoredImportLogs();
    setImportLogs([]);
  }, []);

  const handleAdminImportQuestions = useCallback((
    newQs: Question[],
    source: 'AI Extractor / OCR' | 'JSON File Upload' | 'PDF / Text Importer' | 'Manual Question Builder' = 'JSON File Upload'
  ): DeduplicationResult => {
    // Undelete any of these IDs first so they are no longer hidden by any deletion blacklist
    const incomingIds = newQs.map((q) => q.id);
    undeleteQuestionIds(incomingIds);

    // 1. Deduplicate against existing question bank
    const dedupResult = processQuestionDeduplication(newQs, allQuestions);

    // 2. Persist new unique questions
    if (dedupResult.addedQuestions.length > 0) {
      setCustomQuestions((prev) => {
        // Ensure we filter out any lingering deleted placeholders for these IDs
        const idSet = new Set(dedupResult.addedQuestions.map((q) => q.id));
        const filtered = prev.filter((q) => !(q.isDeleted && idSet.has(q.id)));
        return [...dedupResult.addedQuestions, ...filtered];
      });
      if (currentUser?.uid) {
        bulkSyncCustomQuestionsToFirestore(currentUser.uid, dedupResult.addedQuestions).catch(() => {});
      }
    }

    // 3. Create Audit Log
    const logStatus = dedupResult.duplicateCount === 0
      ? 'SUCCESS'
      : dedupResult.addedCount > 0
      ? 'PARTIAL'
      : 'FAILED';

    const summaryMessage = dedupResult.duplicateCount > 0
      ? `Received ${dedupResult.totalReceived} question(s). Added ${dedupResult.addedCount} new unique question(s) and prevented ${dedupResult.duplicateCount} duplicate entry(s).`
      : `Successfully added ${dedupResult.addedCount} new question(s) into the Question Bank.`;

    const newLog = saveImportLog({
      source,
      userEmail: currentUser?.email || 'Admin User',
      totalReceived: dedupResult.totalReceived,
      addedCount: dedupResult.addedCount,
      duplicateCount: dedupResult.duplicateCount,
      status: logStatus,
      summaryMessage,
      details: dedupResult.details
    });

    setImportLogs((prev) => [newLog, ...prev]);

    if (currentUser?.uid) {
      queueImportLogSync(currentUser.uid, newLog);
    }

    return dedupResult;
  }, [allQuestions, currentUser, undeleteQuestionIds]);

  // Drill Launches
  const launchDailyDrill = useCallback(() => {
    const drillQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
    setActiveDrill({
      questions: drillQuestions,
      title: 'Daily PSAT Concept Sprint',
      mode: 'daily'
    });
  }, [allQuestions]);

  const launchFilteredDrill = useCallback(() => {
    const drillQuestions = filteredQuestions.slice(0, 10);
    setActiveDrill({
      questions: drillQuestions,
      title: `Targeted Drill: ${filters.skill !== 'all' ? filters.skill : filters.domain !== 'all' ? filters.domain : 'Filtered Selection'}`,
      mode: 'custom'
    });
  }, [filteredQuestions, filters]);

  const launchSkillDrill = useCallback((skillName: string) => {
    const skillQuestions = allQuestions.filter((q: Question) => 
      q.skill.toLowerCase().includes(skillName.toLowerCase()) || 
      skillName.toLowerCase().includes(q.skill.toLowerCase())
    );
    const questionsToUse = skillQuestions.length > 0 ? skillQuestions : allQuestions.slice(0, 5);

    setActiveDrill({
      questions: questionsToUse,
      title: `Topic Mastery Drill: ${skillName}`,
      mode: 'skill'
    });
  }, [allQuestions]);

  const launchWeaknessDrill = useCallback(() => {
    const weakSkill = analytics.weakestSkills[0]?.skill;
    if (weakSkill) {
      launchSkillDrill(weakSkill);
    } else {
      launchDailyDrill();
    }
  }, [analytics.weakestSkills, launchSkillDrill, launchDailyDrill]);

  const launchMissedDrill = useCallback((customIds?: string[]) => {
    const missedIds = customIds || (Object.values(lastAttemptByQuestion) as UserAttempt[]).filter((a) => !a.isCorrect).map((a) => a.questionId);
    const missedQuestions = allQuestions.filter((q) => missedIds.includes(q.id));
    if (missedQuestions.length === 0) return;

    setActiveDrill({
      questions: missedQuestions,
      title: `Missed Question Marathon (${missedQuestions.length} Qs)`,
      mode: 'weakness'
    });
  }, [allQuestions, lastAttemptByQuestion]);

  const launchTimedDrill = useCallback((test: 'Math' | 'Reading and Writing') => {
    const testQuestions = allQuestions.filter((q) => q.test === test).slice(0, 8);
    setActiveDrill({
      questions: testQuestions.length > 0 ? testQuestions : allQuestions.slice(0, 8),
      title: `${test} Speed Simulation (70s Pace)`,
      mode: 'custom'
    });
  }, [allQuestions]);

  const launchHardDrill = useCallback(() => {
    const hardQuestions = allQuestions.filter((q) => q.difficulty === 'Hard');
    setActiveDrill({
      questions: hardQuestions.length > 0 ? hardQuestions.slice(0, 6) : allQuestions.slice(0, 6),
      title: 'Level 3 Hard Math Masterclass',
      mode: 'custom'
    });
  }, [allQuestions]);

  const isAdmin = useMemo(() => isUserAdmin(currentUser?.email), [currentUser?.email]);

  const value = useMemo(() => ({
    allQuestions,
    filteredQuestions,
    searchTimeMs,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    currentUser,
    isAdmin,
    isSyncing,
    isCloudQuotaExceeded,
    syncStatus,
    flushPendingSync,
    forceCloudSync,
    attempts,
    bookmarks,
    streak,
    analytics,
    activeMistakesCount,
    handleQuestionAttempt,
    handleToggleBookmark,
    handleLogout,
    handleAdminAddQuestion,
    handleAdminUpdateQuestion,
    handleAdminDeleteQuestion,
    handleAdminResetRepository,
    handleAdminImportQuestions,
    importLogs,
    handleClearImportLogs,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isCalculatorOpen,
    setIsCalculatorOpen,
    isFormulaSheetOpen,
    setIsFormulaSheetOpen,
    scratchpadData,
    setScratchpadData,
    isPdfExportOpen,
    setIsPdfExportOpen,
    isUploadOpen,
    setIsUploadOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isScoreSimulatorOpen,
    setIsScoreSimulatorOpen,
    activeDrill,
    setActiveDrill,
    launchDailyDrill,
    launchFilteredDrill,
    launchSkillDrill,
    launchWeaknessDrill,
    launchMissedDrill,
    launchTimedDrill,
    launchHardDrill
  }), [
    allQuestions,
    filteredQuestions,
    searchTimeMs,
    filters,
    currentPage,
    pageSize,
    currentUser,
    isAdmin,
    isSyncing,
    isCloudQuotaExceeded,
    syncStatus,
    flushPendingSync,
    forceCloudSync,
    attempts,
    bookmarks,
    streak,
    analytics,
    activeMistakesCount,
    handleQuestionAttempt,
    handleToggleBookmark,
    handleLogout,
    handleAdminAddQuestion,
    handleAdminUpdateQuestion,
    handleAdminDeleteQuestion,
    handleAdminResetRepository,
    handleAdminImportQuestions,
    importLogs,
    handleClearImportLogs,
    isAuthModalOpen,
    isCalculatorOpen,
    isFormulaSheetOpen,
    scratchpadData,
    isPdfExportOpen,
    isUploadOpen,
    isShortcutsOpen,
    isScoreSimulatorOpen,
    activeDrill,
    launchDailyDrill,
    launchFilteredDrill,
    launchSkillDrill,
    launchWeaknessDrill,
    launchMissedDrill,
    launchTimedDrill,
    launchHardDrill
  ]);

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};

export function usePractice() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
}

export const usePracticeContext = usePractice;
