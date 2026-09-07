import { 
  doc, 
  collection, 
  writeBatch, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, isFirebaseQuotaExceeded, handleFirebaseError } from './firebase';
import { UserAttempt, OverallAnalytics, Question, ImportLog } from '../types';

export type SyncState = 'saved' | 'queued' | 'syncing' | 'offline_quota' | 'error';

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: number | null;
  message: string;
}

interface QueuedChanges {
  attempts: Map<string, UserAttempt>;
  bookmarksList: string[] | null;
  analytics: OverallAnalytics | null;
  customQuestions: Map<string, Question>;
  customQuestionDeletions: Set<string>;
  importLogs: Map<string, ImportLog>;
}

// In-memory sync queues per user
const userQueues = new Map<string, QueuedChanges>();
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Listeners for UI state
const statusListeners = new Set<(status: SyncStatusInfo) => void>();

let currentStatus: SyncStatusInfo = {
  state: 'saved',
  pendingCount: 0,
  lastSyncedAt: null,
  message: 'All changes saved'
};

function notifyStatusListeners(status: Partial<SyncStatusInfo>) {
  currentStatus = { ...currentStatus, ...status };
  statusListeners.forEach((fn) => {
    try {
      fn(currentStatus);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeToSyncStatus(listener: (status: SyncStatusInfo) => void): () => void {
  listener(currentStatus);
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatusInfo {
  return currentStatus;
}

function getOrCreateQueue(userId: string): QueuedChanges {
  let queue = userQueues.get(userId);
  if (!queue) {
    // Try restoring pending queue from localStorage if available
    queue = {
      attempts: new Map(),
      bookmarksList: null,
      analytics: null,
      customQuestions: new Map(),
      customQuestionDeletions: new Set(),
      importLogs: new Map()
    };
    try {
      const stored = localStorage.getItem(`psat_sync_queue_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.attempts) {
          Object.values(parsed.attempts).forEach((att: any) => queue!.attempts.set(att.id, att));
        }
        if (Array.isArray(parsed.bookmarksList)) {
          queue.bookmarksList = parsed.bookmarksList;
        }
        if (parsed.analytics) {
          queue.analytics = parsed.analytics;
        }
        if (parsed.customQuestions) {
          Object.values(parsed.customQuestions).forEach((q: any) => queue!.customQuestions.set(q.id, q));
        }
        if (Array.isArray(parsed.customQuestionDeletions)) {
          parsed.customQuestionDeletions.forEach((id: string) => queue!.customQuestionDeletions.add(id));
        }
        if (parsed.importLogs) {
          Object.values(parsed.importLogs).forEach((log: any) => queue!.importLogs.set(log.id, log));
        }
      }
    } catch {
      // ignore
    }
    userQueues.set(userId, queue);
  }
  return queue;
}

function persistQueueLocally(userId: string, queue: QueuedChanges) {
  try {
    const serialized = {
      attempts: Object.fromEntries(queue.attempts),
      bookmarksList: queue.bookmarksList,
      analytics: queue.analytics,
      customQuestions: Object.fromEntries(queue.customQuestions),
      customQuestionDeletions: Array.from(queue.customQuestionDeletions),
      importLogs: Object.fromEntries(queue.importLogs)
    };
    localStorage.setItem(`psat_sync_queue_${userId}`, JSON.stringify(serialized));
  } catch {
    // ignore quota issues
  }
}

function countQueueItems(queue: QueuedChanges): number {
  return (
    queue.attempts.size +
    (queue.bookmarksList !== null ? 1 : 0) +
    (queue.analytics !== null ? 1 : 0) +
    queue.customQuestions.size +
    queue.customQuestionDeletions.size +
    queue.importLogs.size
  );
}

const DEBOUNCE_DELAY_MS = 6000; // 6 second debounce to accumulate drill responses in 1 batch
const MAX_QUEUE_SIZE = 15; // Flush immediately if >= 15 items accumulated

function scheduleFlush(userId: string) {
  const queue = getOrCreateQueue(userId);
  const count = countQueueItems(queue);

  persistQueueLocally(userId, queue);

  if (count === 0) {
    notifyStatusListeners({
      state: isFirebaseQuotaExceeded ? 'offline_quota' : 'saved',
      pendingCount: 0,
      message: isFirebaseQuotaExceeded ? 'Offline (Quota Protected)' : 'All changes saved'
    });
    return;
  }

  notifyStatusListeners({
    state: isFirebaseQuotaExceeded ? 'offline_quota' : 'queued',
    pendingCount: count,
    message: isFirebaseQuotaExceeded 
      ? `Offline: ${count} change(s) kept local` 
      : `${count} change(s) queued for batch save...`
  });

  if (isFirebaseQuotaExceeded) return;

  // If queue is getting large, flush immediately
  if (count >= MAX_QUEUE_SIZE) {
    flushBatchSyncNow(userId);
    return;
  }

  // Otherwise reset debounce timer
  const existingTimer = debounceTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(userId);
    flushBatchSyncNow(userId);
  }, DEBOUNCE_DELAY_MS);

  debounceTimers.set(userId, timer);
}

/**
 * Flush all queued operations to Firestore using atomic batch writes
 */
export async function flushBatchSyncNow(userId: string): Promise<{ success: boolean; operationsCount: number }> {
  if (!userId || !auth.currentUser || auth.currentUser.isAnonymous || isFirebaseQuotaExceeded) {
    return { success: false, operationsCount: 0 };
  }

  const queue = userQueues.get(userId);
  if (!queue) return { success: true, operationsCount: 0 };

  const totalItems = countQueueItems(queue);
  if (totalItems === 0) {
    notifyStatusListeners({
      state: 'saved',
      pendingCount: 0,
      message: 'All changes saved'
    });
    return { success: true, operationsCount: 0 };
  }

  // Snapshot queue items and clear active queue
  const attemptsToSync = Array.from(queue.attempts.values());
  const bookmarksToSync = queue.bookmarksList;
  const analyticsToSync = queue.analytics;
  const questionsToSync = Array.from(queue.customQuestions.values());
  const deletionsToSync = Array.from(queue.customQuestionDeletions);
  const logsToSync = Array.from(queue.importLogs.values());

  // Clear memory queue
  queue.attempts.clear();
  queue.bookmarksList = null;
  queue.analytics = null;
  queue.customQuestions.clear();
  queue.customQuestionDeletions.clear();
  queue.importLogs.clear();
  persistQueueLocally(userId, queue);

  notifyStatusListeners({
    state: 'syncing',
    pendingCount: totalItems,
    message: `Saving ${totalItems} item(s) in atomic batch...`
  });

  try {
    const batch = writeBatch(db);
    let opCount = 0;

    // 1. Attempts batch
    attemptsToSync.forEach((att) => {
      const docRef = doc(db, 'users', userId, 'attempts', att.id);
      batch.set(docRef, {
        ...att,
        userId,
        savedAt: serverTimestamp()
      });
      opCount++;
    });

    // 2. Consolidated Bookmarks document (_all)
    // Writing 1 document saves up to 50 individual document writes and reads!
    if (bookmarksToSync !== null) {
      const allBookmarksRef = doc(db, 'users', userId, 'bookmarks', '_all');
      batch.set(allBookmarksRef, {
        list: bookmarksToSync,
        updatedAt: Date.now()
      }, { merge: true });
      opCount++;
    }

    // 3. Analytics Summary document
    if (analyticsToSync !== null) {
      const analyticsRef = doc(db, 'users', userId, 'analytics', 'summary');
      batch.set(analyticsRef, {
        userId,
        totalAttempted: analyticsToSync.totalAttempted,
        totalCorrect: analyticsToSync.totalCorrect,
        overallAccuracy: analyticsToSync.overallAccuracy,
        currentStreak: analyticsToSync.currentStreak,
        longestStreak: analyticsToSync.longestStreak,
        timeSpentTotalSeconds: analyticsToSync.timeSpentTotalSeconds,
        domainProficiency: analyticsToSync.domainProficiency,
        skillProficiency: analyticsToSync.skillProficiency,
        weakestSkills: analyticsToSync.weakestSkills,
        strongestSkills: analyticsToSync.strongestSkills,
        updatedAt: Date.now()
      }, { merge: true });
      opCount++;
    }

    // 4. Custom questions
    questionsToSync.forEach((q) => {
      const qRef = doc(db, 'users', userId, 'custom_questions', q.id);
      batch.set(qRef, {
        ...q,
        userId,
        createdAt: Date.now()
      }, { merge: true });
      opCount++;
    });

    // 5. Question deletions
    deletionsToSync.forEach((qId) => {
      const qRef = doc(db, 'users', userId, 'custom_questions', qId);
      batch.delete(qRef);
      opCount++;
    });

    // 6. Import logs
    logsToSync.forEach((log) => {
      const logRef = doc(db, 'users', userId, 'import_logs', log.id);
      batch.set(logRef, {
        ...log,
        savedAt: serverTimestamp()
      });
      opCount++;
    });

    // Commit everything in 1 single Firestore network transaction!
    if (opCount > 0) {
      await batch.commit();
    }

    // Update local sync metadata
    const now = Date.now();
    localStorage.setItem(`psat_last_cloud_sync_${userId}`, now.toString());

    notifyStatusListeners({
      state: 'saved',
      pendingCount: 0,
      lastSyncedAt: now,
      message: `Batch sync complete (${opCount} items saved)`
    });

    return { success: true, operationsCount: opCount };
  } catch (err: any) {
    handleFirebaseError(err, 'flushBatchSyncNow');
    // Restore items to queue so no work is ever lost
    attemptsToSync.forEach((a) => queue.attempts.set(a.id, a));
    if (bookmarksToSync) queue.bookmarksList = bookmarksToSync;
    if (analyticsToSync) queue.analytics = analyticsToSync;
    questionsToSync.forEach((q) => queue.customQuestions.set(q.id, q));
    deletionsToSync.forEach((id) => queue.customQuestionDeletions.add(id));
    logsToSync.forEach((l) => queue.importLogs.set(l.id, l));
    persistQueueLocally(userId, queue);

    notifyStatusListeners({
      state: isFirebaseQuotaExceeded ? 'offline_quota' : 'error',
      pendingCount: countQueueItems(queue),
      message: isFirebaseQuotaExceeded 
        ? 'Quota exceeded. Operating safely in local storage.' 
        : 'Sync error. Changes safely preserved locally.'
    });

    return { success: false, operationsCount: 0 };
  }
}

// ---------------- PUBLIC QUEUEING METHODS ----------------

export function queueAttemptSync(userId: string, attempt: UserAttempt) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.attempts.set(attempt.id, attempt);
  scheduleFlush(userId);
}

export function queueBookmarksSync(userId: string, bookmarksList: string[]) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.bookmarksList = bookmarksList;
  scheduleFlush(userId);
}

export function queueAnalyticsSync(userId: string, analytics: OverallAnalytics) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.analytics = analytics;
  scheduleFlush(userId);
}

export function queueCustomQuestionSync(userId: string, question: Question) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.customQuestions.set(question.id, question);
  queue.customQuestionDeletions.delete(question.id);
  scheduleFlush(userId);
}

export function queueCustomQuestionDeletionSync(userId: string, questionId: string) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.customQuestionDeletions.add(questionId);
  queue.customQuestions.delete(questionId);
  scheduleFlush(userId);
}

export function queueImportLogSync(userId: string, log: ImportLog) {
  if (!userId) return;
  const queue = getOrCreateQueue(userId);
  queue.importLogs.set(log.id, log);
  scheduleFlush(userId);
}

// ---------------- EFFICIENT INCREMENTAL & CONSOLIDATED READS ----------------

const READ_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes read cache TTL

export function isReadCacheFresh(userId: string): boolean {
  try {
    const raw = localStorage.getItem(`psat_last_cloud_sync_${userId}`);
    if (!raw) return false;
    const lastSync = parseInt(raw, 10);
    return Date.now() - lastSync < READ_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Ultra-efficient attempts loader:
 * - If local attempts already exist, queries ONLY new attempts with timestamp > lastKnownTimestamp (delta query)
 * - If no local attempts exist, queries only the most recent 100 attempts
 * - Never blindly scans 500 documents on every startup!
 */
export async function loadAttemptsOptimized(
  userId: string, 
  existingAttempts: UserAttempt[] = [], 
  forceRefresh: boolean = false
): Promise<UserAttempt[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) {
    return existingAttempts;
  }

  // If local data exists and cache is fresh, skip Firestore query entirely (0 reads!)
  if (!forceRefresh && existingAttempts.length > 0 && isReadCacheFresh(userId)) {
    return existingAttempts;
  }

  try {
    const colRef = collection(db, 'users', userId, 'attempts');
    let q;

    if (existingAttempts.length > 0 && !forceRefresh) {
      // Incremental delta: only fetch attempts newer than what we already have
      const maxTimestamp = Math.max(...existingAttempts.map((a) => a.timestamp || 0));
      q = query(colRef, where('timestamp', '>', maxTimestamp), orderBy('timestamp', 'asc'), limit(100));
    } else {
      // Cold load: only fetch the last 100 attempts
      q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    }

    const snap = await getDocs(q);
    const fetched: UserAttempt[] = [];
    snap.forEach((d) => fetched.push(d.data() as UserAttempt));

    // Merge with existing
    const map = new Map<string, UserAttempt>();
    existingAttempts.forEach((a) => map.set(a.id, a));
    fetched.forEach((a) => map.set(a.id, a));

    localStorage.setItem(`psat_last_cloud_sync_${userId}`, Date.now().toString());
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    handleFirebaseError(err, 'loadAttemptsOptimized');
    return existingAttempts;
  }
}

/**
 * Ultra-efficient bookmarks loader:
 * Reads 1 single document `_all` instead of scanning the entire collection doc-by-doc!
 * Reduces 50 reads to 1 read.
 */
export async function loadBookmarksOptimized(
  userId: string, 
  existingBookmarks: string[] = [], 
  forceRefresh: boolean = false
): Promise<string[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) {
    return existingBookmarks;
  }

  if (!forceRefresh && existingBookmarks.length > 0 && isReadCacheFresh(userId)) {
    return existingBookmarks;
  }

  try {
    // 1. Try single consolidated bookmarks doc (_all)
    const summaryRef = doc(db, 'users', userId, 'bookmarks', '_all');
    const summarySnap = await getDoc(summaryRef);

    if (summarySnap.exists()) {
      const data = summarySnap.data();
      if (Array.isArray(data?.list)) {
        return Array.from(new Set([...existingBookmarks, ...data.list]));
      }
    }

    // 2. Fallback to reading collection (legacy data)
    const colRef = collection(db, 'users', userId, 'bookmarks');
    const snap = await getDocs(colRef);
    const bookmarks: string[] = [];
    snap.forEach((d) => {
      if (d.id !== '_all') bookmarks.push(d.id);
    });

    // Automatically consolidate into _all for all future loads so next time is 1 single read!
    if (bookmarks.length > 0) {
      getOrCreateQueue(userId).bookmarksList = bookmarks;
      scheduleFlush(userId);
    }

    return Array.from(new Set([...existingBookmarks, ...bookmarks]));
  } catch (err) {
    handleFirebaseError(err, 'loadBookmarksOptimized');
    return existingBookmarks;
  }
}

/**
 * Optimized custom questions loader
 */
export async function loadCustomQuestionsOptimized(
  userId: string, 
  existingQuestions: Question[] = [], 
  forceRefresh: boolean = false
): Promise<Question[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) {
    return existingQuestions;
  }

  if (!forceRefresh && existingQuestions.length > 0 && isReadCacheFresh(userId)) {
    return existingQuestions;
  }

  try {
    const colRef = collection(db, 'users', userId, 'custom_questions');
    const snap = await getDocs(colRef);
    const questions: Question[] = [];
    snap.forEach((d) => {
      const q = d.data() as Question;
      if (q && q.id) questions.push(q);
    });

    const map = new Map<string, Question>();
    existingQuestions.forEach((q) => map.set(q.id, q));
    questions.forEach((q) => map.set(q.id, q));

    return Array.from(map.values());
  } catch (err) {
    handleFirebaseError(err, 'loadCustomQuestionsOptimized');
    return existingQuestions;
  }
}

// Global page unload & visibility handlers to ensure queued data is flushed cleanly
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      flushBatchSyncNow(auth.currentUser.uid);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && auth.currentUser && !auth.currentUser.isAnonymous) {
      flushBatchSyncNow(auth.currentUser.uid);
    }
  });
}
