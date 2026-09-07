import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc as originalSetDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc as originalDeleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  disableNetwork,
  setLogLevel,
  DocumentReference,
  writeBatch
} from 'firebase/firestore';
import { UserAttempt, Question, OverallAnalytics, UserProfile, isUserAdmin, FeedbackReport, FeatureRequest, ImportLog } from '../types';

// Safe environment variable helper that works in both browser (Vite import.meta.env) and Node.js (process.env)
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {}
  return '';
};

// Configuration loaded dynamically from environment variables
export const firebaseConfig = {
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_DATABASE_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  oAuthClientId: getEnvVar('VITE_FIREBASE_OAUTH_CLIENT_ID'),
  measurementId: '',
  recaptchaSiteKey: ''
};

// Check if Firebase configuration keys are fully present
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// If not configured, load a safe placeholder configuration to bypass module startup crash
const initConfig = isFirebaseConfigured ? firebaseConfig : {
  ...firebaseConfig,
  apiKey: 'dummy-api-key-for-load-time-bypass',
  projectId: firebaseConfig.projectId || 'dummy-project-id',
  appId: firebaseConfig.appId || 'dummy-app-id'
};

const app = !getApps().length ? initializeApp(initConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Set up logging and network configuration if not configured
if (!isFirebaseConfigured) {
  console.warn('Firebase: Missing API Key or Configuration. Defaulting to local-first (offline) mode.');
  setLogLevel('silent');
  disableNetwork(db).catch(() => {});
}

const WRITE_TIMEOUT_MS = 10000;

async function withWriteTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase write timed out'));
    }, WRITE_TIMEOUT_MS);
  });

  return Promise.race([promise, timeoutPromise])
    .then(res => {
      clearTimeout(timeoutId);
      return res;
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if (err.message === 'Firebase write timed out') {
        console.warn('Firebase write took longer than 10s. Preserving write in local queue.');
      }
      throw err;
    });
}

export async function setDoc(docRef: DocumentReference, data: any, options?: any) {
  if (isFirebaseQuotaExceeded) return Promise.resolve();
  const promise = options ? originalSetDoc(docRef, data, options) : originalSetDoc(docRef, data);
  return withWriteTimeout(promise);
}

export async function deleteDoc(docRef: DocumentReference) {
  if (isFirebaseQuotaExceeded) return Promise.resolve();
  return withWriteTimeout(originalDeleteDoc(docRef));
}

export let isFirebaseQuotaExceeded = !isFirebaseConfigured;

let quotaExceededCallback: ((exceeded: boolean) => void) | null = null;

export function registerQuotaExceededCallback(cb: (exceeded: boolean) => void) {
  quotaExceededCallback = cb;
}

export function triggerFirebaseQuotaExceeded() {
  if (!isFirebaseQuotaExceeded) {
    console.warn(`Firebase: Manually triggered Quota Exceeded. Switching to local-first mode.`);
    isFirebaseQuotaExceeded = true;
    setLogLevel('silent');
    disableNetwork(db).catch(() => {});
    if (quotaExceededCallback) {
      quotaExceededCallback(true);
    }
  }
}

export function handleFirebaseError(e: any, context: string) {
  if (e && (e.code === 'resource-exhausted' || String(e).toLowerCase().includes('quota') || String(e).toLowerCase().includes('exhausted'))) {
    if (!isFirebaseQuotaExceeded) {
      console.warn(`Firebase Error (${context}): Quota Exceeded. Switching to local-first mode and disabling network to prevent log spam.`);
      isFirebaseQuotaExceeded = true;
      setLogLevel('silent');
      disableNetwork(db).catch(() => {});
      if (quotaExceededCallback) {
        quotaExceededCallback(true);
      }
    }
  } else {
    console.warn(`Firebase Error (${context}):`, e);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Local-first student accounts store (active when offline or when Firebase Email/Password provider is disabled)
const LOCAL_ACCOUNTS_KEY = 'psat_local_accounts_v1';
const ACTIVE_LOCAL_USER_KEY = 'psat_active_local_user';

const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {}
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
    memoryStore.delete(key);
  }
};

export interface LocalAccount {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: number;
}

function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'psat_h_' + Math.abs(hash).toString(36);
}

export function getLocalAccounts(): LocalAccount[] {
  try {
    const raw = safeStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(email: string, pass: string, displayName: string): UserProfile {
  const accounts = getLocalAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = accounts.find(a => a.email.toLowerCase() === normalizedEmail);
  const uid = existing ? existing.uid : `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const updatedAccount: LocalAccount = {
    uid,
    email: email.trim(),
    displayName: displayName.trim() || email.split('@')[0],
    passwordHash: hashPassword(pass),
    createdAt: existing ? existing.createdAt : Date.now()
  };

  const filtered = accounts.filter(a => a.email.toLowerCase() !== normalizedEmail);
  filtered.push(updatedAccount);
  safeStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(filtered));

  const isAdmin = isUserAdmin(email);
  const profile: UserProfile = {
    uid,
    email: email.trim(),
    displayName: updatedAccount.displayName,
    photoURL: null,
    isAnonymous: false,
    role: isAdmin ? 'admin' : 'student'
  };

  safeStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(profile));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('psat_local_auth_changed', { detail: profile }));
  }
  return profile;
}

export function authenticateLocalAccount(email: string, pass: string): UserProfile {
  const accounts = getLocalAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const account = accounts.find(a => a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    const err: any = new Error(`No registered student account was found for "${email}". Please switch to the Sign Up tab to create your account.`);
    err.code = 'auth/user-not-found';
    err.operationNotAllowed = true;
    throw err;
  }

  if (account.passwordHash !== hashPassword(pass)) {
    const err: any = new Error('Invalid password. Please check your credentials and try again.');
    err.code = 'auth/wrong-password';
    throw err;
  }

  const isAdmin = isUserAdmin(email);
  const profile: UserProfile = {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    photoURL: null,
    isAnonymous: false,
    role: isAdmin ? 'admin' : 'student'
  };

  safeStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(profile));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('psat_local_auth_changed', { detail: profile }));
  }
  return profile;
}

export function getActiveLocalUser(): UserProfile | null {
  try {
    const raw = safeStorage.getItem(ACTIVE_LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutLocalUser(): void {
  try {
    safeStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('psat_local_auth_changed', { detail: null }));
    }
  } catch {}
}

export function getLocalGuestProfile(): UserProfile {
  let guestId = safeStorage.getItem('psat_guest_uid');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
    safeStorage.setItem('psat_guest_uid', guestId);
  }
  return {
    uid: guestId,
    email: null,
    displayName: 'Guest Student',
    photoURL: null,
    isAnonymous: true,
    role: 'guest'
  };
}

export function formatUserProfile(user: User): UserProfile {
  const isAdmin = isUserAdmin(user.email);
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (isAdmin ? 'Admin' : user.isAnonymous ? 'Guest Student' : (user.email?.split('@')[0] || 'Student')),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    role: isAdmin ? 'admin' : user.isAnonymous ? 'guest' : 'student'
  };
}

// ----------------- AUTH METHODS -----------------

export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await saveUserProfile(result.user);
      return formatUserProfile(result.user);
    }
    throw new Error('No user returned from Google sign-in');
  } catch (err: any) {
    console.warn('Google Sign-in failed:', err);
    if (err?.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      const customErr: any = new Error(
        `Domain "${currentDomain}" is not authorized for Google OAuth in Firebase. Add "${currentDomain}" under Firebase Console -> Authentication -> Settings -> Authorized Domains.`
      );
      customErr.code = 'auth/unauthorized-domain';
      customErr.domain = currentDomain;
      throw customErr;
    }
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const trimmedEmail = email.trim();
  try {
    const result = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    if (result.user) {
      await saveUserProfile(result.user);
      return formatUserProfile(result.user);
    }
    throw new Error('Authentication failed');
  } catch (err: any) {
    console.warn('Email sign-in failed:', err);
    // If Firebase Auth Email/Password provider is disabled in Firebase Console, fallback to local accounts
    const isOpNotAllowed = err?.code === 'auth/operation-not-allowed' ||
      (typeof err?.message === 'string' && err.message.includes('operation-not-allowed'));

    if (isOpNotAllowed) {
      const accounts = getLocalAccounts();
      const existing = accounts.find(a => a.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (existing) {
        return authenticateLocalAccount(trimmedEmail, pass);
      } else {
        const customErr: any = new Error(
          `No registered student account was found for "${trimmedEmail}". Please switch to the Sign Up tab to create your account.`
        );
        customErr.code = 'auth/user-not-found';
        customErr.operationNotAllowed = true;
        throw customErr;
      }
    }
    throw err;
  }
}

export async function signupWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  const trimmedEmail = email.trim();
  try {
    const result = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    if (result.user) {
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      await saveUserProfile(result.user);
      // Backup to local accounts registry
      saveLocalAccount(trimmedEmail, pass, name);
      return formatUserProfile(result.user);
    }
    throw new Error('Account creation failed');
  } catch (err: any) {
    console.warn('Signup failed:', err);
    const isOpNotAllowed = err?.code === 'auth/operation-not-allowed' ||
      (typeof err?.message === 'string' && err.message.includes('operation-not-allowed'));

    if (isOpNotAllowed) {
      // Graceful local-first fallback when Firebase Email/Password provider is not yet enabled in console
      console.info('Firebase Email/Password provider disabled in Console. Creating resilient local student account.');
      const localProfile = saveLocalAccount(trimmedEmail, pass, name);
      (localProfile as any).isLocalFallback = true;
      return localProfile;
    }
    throw err;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function loginAsGuest(): Promise<UserProfile> {
  logoutLocalUser();
  try {
    const result = await signInAnonymously(auth);
    if (result.user) {
      await saveUserProfile(result.user);
      return formatUserProfile(result.user);
    }
  } catch (err: any) {
    // Graceful fallback for local guest mode
  }
  return getLocalGuestProfile();
}

export async function logoutUser(): Promise<void> {
  logoutLocalUser();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

export async function saveUserProfile(user: User): Promise<void> {
  if (!user || isFirebaseQuotaExceeded) return;
  try {
    const profile = formatUserProfile(user);
    const signature = `${profile.displayName || ''}_${profile.photoURL || ''}_${profile.role || ''}`;
    const storageKey = `psat_profile_saved_${user.uid}`;
    const lastSaved = localStorage.getItem(storageKey);

    if (lastSaved) {
      try {
        const parsed = JSON.parse(lastSaved);
        // If profile hasn't changed and was saved in the last 24 hours, skip redundant Firestore write
        if (parsed.signature === signature && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return;
        }
      } catch {
        // proceed with write if parsing fails
      }
    }

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email || 'guest@psatmastery.local',
      displayName: profile.displayName,
      photoURL: user.photoURL || '',
      isAnonymous: user.isAnonymous,
      role: profile.role,
      lastActive: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem(storageKey, JSON.stringify({ signature, timestamp: Date.now() }));
  } catch (e) {
    handleFirebaseError(e, 'Could not sync user profile to Firestore');
  }
}

// ----------------- ATTEMPTS SYNC -----------------

export async function syncAttemptToFirestore(userId: string, attempt: UserAttempt): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'attempts', attempt.id);
    await setDoc(docRef, {
      ...attempt,
      userId,
      savedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync attempt to Firestore');
  }
}

export async function loadAttemptsFromFirestore(userId: string): Promise<UserAttempt[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return [];
  try {
    const colRef = collection(db, 'users', userId, 'attempts');
    const q = query(colRef, orderBy('timestamp', 'asc'), limit(500));
    const snap = await getDocs(q);
    const attempts: UserAttempt[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserAttempt;
      attempts.push(data);
    });
    return attempts;
  } catch (e) {
    handleFirebaseError(e, 'Failed to load attempts from Firestore');
    return [];
  }
}

// ----------------- BOOKMARKS SYNC -----------------

export async function syncBookmarkToFirestore(userId: string, questionId: string, isBookmarked: boolean): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'bookmarks', questionId);
    if (isBookmarked) {
      await setDoc(docRef, { questionId, createdAt: Date.now() });
    } else {
      await deleteDoc(docRef);
    }
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync bookmark to Firestore');
  }
}

export async function loadBookmarksFromFirestore(userId: string): Promise<string[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return [];
  try {
    const colRef = collection(db, 'users', userId, 'bookmarks');
    const snap = await getDocs(colRef);
    const bookmarks: string[] = [];
    snap.forEach((d) => bookmarks.push(d.id));
    return bookmarks;
  } catch (e) {
    handleFirebaseError(e, 'Failed to load bookmarks from Firestore');
    return [];
  }
}

// ----------------- ADMIN & CUSTOM QUESTIONS SYNC -----------------

export async function syncCustomQuestionToFirestore(userId: string, question: Question): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'custom_questions', question.id);
    await setDoc(docRef, {
      ...question,
      userId,
      createdAt: Date.now()
    }, { merge: true });
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync custom question to Firestore');
  }
}

export async function bulkSyncCustomQuestionsToFirestore(userId: string, questions: Question[]): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded || questions.length === 0) return;
  try {
    for (let i = 0; i < questions.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = questions.slice(i, i + 500);
      chunk.forEach((q) => {
        const docRef = doc(db, 'users', userId, 'custom_questions', q.id);
        batch.set(docRef, {
          ...q,
          userId,
          createdAt: Date.now()
        }, { merge: true });
      });
      await batch.commit();
    }
  } catch (e) {
    handleFirebaseError(e, 'Failed to bulk sync custom questions to Firestore');
  }
}

export async function loadCustomQuestionsFromFirestore(userId: string): Promise<Question[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return [];
  try {
    const colRef = collection(db, 'users', userId, 'custom_questions');
    const snap = await getDocs(colRef);
    const questions: Question[] = [];
    snap.forEach((d) => questions.push(d.data() as Question));
    return questions;
  } catch (e) {
    handleFirebaseError(e, 'Failed to load custom questions from Firestore');
    return [];
  }
}

export async function deleteCustomQuestionFromFirestore(userId: string, questionId: string): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'custom_questions', questionId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirebaseError(e, 'Failed to delete custom question from Firestore');
  }
}

// ----------------- AGGREGATE ANALYTICS SYNC -----------------

export async function syncAnalyticsSummaryToFirestore(userId: string, analytics: OverallAnalytics): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'analytics', 'summary');
    await setDoc(docRef, {
      userId,
      totalAttempted: analytics.totalAttempted,
      totalCorrect: analytics.totalCorrect,
      overallAccuracy: analytics.overallAccuracy,
      currentStreak: analytics.currentStreak,
      longestStreak: analytics.longestStreak,
      timeSpentTotalSeconds: analytics.timeSpentTotalSeconds,
      domainProficiency: analytics.domainProficiency,
      skillProficiency: analytics.skillProficiency,
      weakestSkills: analytics.weakestSkills,
      strongestSkills: analytics.strongestSkills,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync analytics to Firestore');
  }
}

// ----------------- IMPORT AUDIT LOGS SYNC -----------------

export async function syncImportLogToFirestore(userId: string, log: ImportLog): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', userId, 'import_logs', log.id);
    await setDoc(docRef, {
      ...log,
      savedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync import log to Firestore');
  }
}

export async function loadImportLogsFromFirestore(userId: string): Promise<ImportLog[]> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return [];
  try {
    const colRef = collection(db, 'users', userId, 'import_logs');
    const snap = await getDocs(colRef);
    const logs: ImportLog[] = [];
    snap.forEach((d) => logs.push(d.data() as ImportLog));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    handleFirebaseError(e, 'Failed to load import logs from Firestore');
    return [];
  }
}

export async function wipeUserCloudDatabase(userId: string): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const collectionsToClear = [
      'custom_questions',
      'attempts',
      'bookmarks',
      'import_logs'
    ];

    for (const colName of collectionsToClear) {
      const colRef = collection(db, 'users', userId, colName);
      const snap = await getDocs(colRef);
      
      if (snap.empty) continue;

      // Firestore batches are limited to 500 operations
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 500);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }

    // Also clear analytics summary
    const summaryRef = doc(db, 'users', userId, 'analytics', 'summary');
    await originalDeleteDoc(summaryRef).catch(() => {});
    
  } catch (e) {
    handleFirebaseError(e, 'wipeUserCloudDatabase');
    throw e;
  }
}

// ----------------- FEEDBACK & BUG REPORTING -----------------

export async function submitFeedbackReport(report: FeedbackReport): Promise<string> {
  // Store locally in fallback storage
  try {
    const raw = localStorage.getItem('psat_user_feedback_history') || '[]';
    const existing = JSON.parse(raw) as FeedbackReport[];
    existing.unshift(report);
    localStorage.setItem('psat_user_feedback_history', JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.warn('Could not store feedback report locally:', err);
  }

  if (isFirebaseQuotaExceeded) return report.id;

  // Attempt Firestore sync
  try {
    const docRef = doc(db, 'feedback', report.id);
    await setDoc(docRef, {
      ...report,
      savedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirebaseError(err, 'Could not sync feedback to Firestore');
  }

  return report.ticketNumber;
}

export function loadLocalFeedbackReports(): FeedbackReport[] {
  try {
    const raw = localStorage.getItem('psat_user_feedback_history') || '[]';
    return JSON.parse(raw) as FeedbackReport[];
  } catch {
    return [];
  }
}

// ----------------- COMMUNITY FEATURE REQUESTS -----------------

export const INITIAL_FEATURE_REQUESTS: FeatureRequest[] = [
  {
    id: 'feat-1',
    title: 'Interactive Desmos Table & Regression Mode',
    description: 'Add a full split-screen Desmos graphing calculator with table data regression (x1, y1, y1 ~ mx1 + b) for PSAT Math questions.',
    category: 'desmos',
    status: 'in_progress',
    upvotes: 48,
    authorName: 'Alex M. (PCSS II Student)',
    createdAt: Date.now() - 86400000 * 5,
    targetGroup: 'students',
    voterUids: []
  },
  {
    id: 'feat-2',
    title: 'Offline Audio Socratic Voice Readout',
    description: 'Enable offline voice synthesized pacing and auto-advance drill reading for students studying during transit.',
    category: 'mobile',
    status: 'planned',
    upvotes: 36,
    authorName: 'Sarah K. (Math Educator)',
    createdAt: Date.now() - 86400000 * 9,
    targetGroup: 'everyone',
    voterUids: []
  },
  {
    id: 'feat-3',
    title: 'Printable Mistake Notebook PDF Flashcards',
    description: '1-click export of student mistake log into 3x5 double-sided printable study flashcards with prompt on front and rationale on back.',
    category: 'drills',
    status: 'planned',
    upvotes: 29,
    authorName: 'Jordan T. (PSAT 10 Candidate)',
    createdAt: Date.now() - 86400000 * 12,
    targetGroup: 'students',
    voterUids: []
  },
  {
    id: 'feat-4',
    title: 'Classroom Speed Drills & Teacher Leaderboards',
    description: 'Allow teachers to host live 10-minute synchronized concept sprints where classrooms compete for accuracy streaks.',
    category: 'classroom',
    status: 'under_review',
    upvotes: 24,
    authorName: 'Mr. Henderson (PCSS Saugus Faculty)',
    createdAt: Date.now() - 86400000 * 15,
    targetGroup: 'teachers',
    voterUids: []
  },
  {
    id: 'feat-5',
    title: 'Smart Coordinate Geometry Transformation Sandbox',
    description: 'Interactive canvas to slide vertices of polygons and parabolas in real-time to visualize vertex form h and k shifts.',
    category: 'desmos',
    status: 'completed',
    upvotes: 53,
    authorName: 'Aarti S Ravikumar',
    createdAt: Date.now() - 86400000 * 20,
    targetGroup: 'everyone',
    voterUids: []
  },
  {
    id: 'feat-6',
    title: 'AI Step-by-Step Hint Customizer based on Weaknesses',
    description: 'Tailor Level 2 and Level 3 hints dynamically based on which prior skills the student missed in their Mistake Notebook.',
    category: 'ai',
    status: 'in_progress',
    upvotes: 41,
    authorName: 'Raman R.',
    createdAt: Date.now() - 86400000 * 4,
    targetGroup: 'students',
    voterUids: []
  }
];

const FEATURE_CACHE_KEY = 'psat_community_features_cache';
const FEATURE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export async function fetchFeatureRequests(forceRefresh: boolean = false): Promise<FeatureRequest[]> {
  // 1. Check local cache first if not force-refreshing
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(FEATURE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < FEATURE_CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // continue to network fetch
    }
  }

  // 2. Fetch from Firestore if quota is available
  try {
    if (!isFirebaseQuotaExceeded) {
      const colRef = collection(db, 'feature_requests');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list: FeatureRequest[] = [];
        snap.forEach((d) => {
          list.push(d.data() as FeatureRequest);
        });
        try {
          localStorage.setItem(FEATURE_CACHE_KEY, JSON.stringify({ data: list, timestamp: Date.now() }));
          localStorage.setItem('psat_community_features', JSON.stringify(list));
        } catch {
          // ignore
        }
        return list;
      }
    }
  } catch (err) {
    handleFirebaseError(err, 'fetchFeatureRequests');
  }

  // 3. Fallback to local storage or initial defaults
  try {
    const local = localStorage.getItem('psat_community_features');
    if (local) {
      return JSON.parse(local);
    }
    localStorage.setItem('psat_community_features', JSON.stringify(INITIAL_FEATURE_REQUESTS));
  } catch {
    // Ignore storage issues
  }
  return INITIAL_FEATURE_REQUESTS;
}

export async function submitFeatureRequest(newReq: Omit<FeatureRequest, 'id' | 'createdAt' | 'upvotes' | 'voterUids'>): Promise<FeatureRequest> {
  const item: FeatureRequest = {
    ...newReq,
    id: 'feat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    upvotes: 1,
    status: 'under_review',
    voterUids: newReq.authorUid ? [newReq.authorUid] : []
  };

  // Local storage and cache update immediately
  try {
    const current = await fetchFeatureRequests(false);
    const updated = [item, ...current];
    localStorage.setItem('psat_community_features', JSON.stringify(updated));
    localStorage.setItem(FEATURE_CACHE_KEY, JSON.stringify({ data: updated, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Failed local feature save:', e);
  }

  // Firestore update
  if (!isFirebaseQuotaExceeded) {
    try {
      const docRef = doc(db, 'feature_requests', item.id);
      await setDoc(docRef, item);
    } catch (e) {
      handleFirebaseError(e, 'Could not sync feature to Firestore');
    }
  }

  return item;
}

export async function toggleFeatureVote(featureId: string, userId: string): Promise<{ upvotes: number; hasVoted: boolean }> {
  // Read from local cache/storage WITHOUT querying Firestore for all documents!
  let updatedFeatures: FeatureRequest[] = [];
  try {
    const local = localStorage.getItem('psat_community_features');
    updatedFeatures = local ? JSON.parse(local) : INITIAL_FEATURE_REQUESTS;
  } catch {
    updatedFeatures = INITIAL_FEATURE_REQUESTS;
  }

  const target = updatedFeatures.find((f) => f.id === featureId);
  if (!target) return { upvotes: 0, hasVoted: false };

  const voterUids = target.voterUids || [];
  const hasVoted = voterUids.includes(userId);

  if (hasVoted) {
    target.voterUids = voterUids.filter((uid) => uid !== userId);
    target.upvotes = Math.max(0, target.upvotes - 1);
  } else {
    target.voterUids = [...voterUids, userId];
    target.upvotes = target.upvotes + 1;
  }

  // Update local caches
  try {
    localStorage.setItem('psat_community_features', JSON.stringify(updatedFeatures));
    localStorage.setItem(FEATURE_CACHE_KEY, JSON.stringify({ data: updatedFeatures, timestamp: Date.now() }));
  } catch {
    // ignore
  }

  // Update ONLY this single document in Firestore (1 write, 0 reads!)
  if (!isFirebaseQuotaExceeded) {
    try {
      const docRef = doc(db, 'feature_requests', featureId);
      await setDoc(docRef, {
        upvotes: target.upvotes,
        voterUids: target.voterUids
      }, { merge: true });
    } catch (err) {
      handleFirebaseError(err, 'Could not sync vote to Firestore');
    }
  }

  return { upvotes: target.upvotes, hasVoted: !hasVoted };
}


export async function syncLeaderboardEntry(userId: string, entry: any): Promise<void> {
  if (!userId || !auth.currentUser || isFirebaseQuotaExceeded) return;
  try {
    const docRef = doc(db, 'leaderboard', userId);
    await setDoc(docRef, {
      ...entry,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    handleFirebaseError(e, 'Failed to sync leaderboard entry to Firestore');
  }
}

export async function fetchLeaderboard(): Promise<any[]> {
  if (isFirebaseQuotaExceeded) return [];
  try {
    const q = collection(db, 'leaderboard');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    handleFirebaseError(e, 'Failed to fetch leaderboard from Firestore');
    return [];
  }
}
