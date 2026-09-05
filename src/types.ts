export type AssessmentType = 'PSAT 8/9' | 'PSAT 10' | 'PSAT/NMSQT' | 'SAT';
export type TestType = 'Math' | 'Reading and Writing';
export type DifficultyType = 'Easy' | 'Medium' | 'Hard';

export type DomainType = 
  | 'Algebra'
  | 'Advanced Math'
  | 'Problem-Solving and Data Analysis'
  | 'Geometry and Trigonometry'
  | 'Information and Ideas'
  | 'Craft and Structure'
  | 'Expression of Ideas'
  | 'Standard English Conventions';

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionTable {
  headers: string[];
  rows: (string | number)[][];
}

export interface GraphConfig {
  type: 'line' | 'inequality' | 'points' | 'system';
  xRange?: [number, number];
  yRange?: [number, number];
  xStep?: number;
  yStep?: number;
  xLabel?: string;
  yLabel?: string;
  lines?: {
    slope?: number;
    yIntercept?: number;
    points?: [number, number][];
    color?: string;
    style?: 'solid' | 'dashed';
    label?: string;
  }[];
  inequality?: {
    slope: number;
    yIntercept: number;
    operator: '>' | '<' | '>=' | '<=';
    color?: string;
  };
  points?: [number, number][];
}

export interface QuestionHint {
  level: 1 | 2 | 3;
  title: string;
  hint: string;
}

export interface Question {
  id: string;
  assessment: AssessmentType;
  test: TestType;
  domain: DomainType;
  skill: string;
  difficulty: DifficultyType;
  type: 'multiple_choice' | 'free_response';
  prompt: string;
  stimulus?: string;
  tableData?: QuestionTable;
  graphConfig?: GraphConfig;
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  rationale: string;
  hints: QuestionHint[];
  concepts: string[];
  isDeleted?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  role?: 'admin' | 'student' | 'guest';
}

export const ADMIN_EMAILS = [
  'aarti.sri.ravikumar@gmail.com',
  'ravikumar.raman@gmail.com'
] as const;

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}

export interface UserAttempt {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  hintsRevealed: number;
  timeSpentSeconds: number;
  timestamp: number;
  domain: DomainType;
  skill: string;
  difficulty: DifficultyType;
}

export interface DrillSession {
  id: string;
  title: string;
  mode: 'daily_drill' | 'concept_sprint' | 'weak_spot_remediation' | 'custom_filter';
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, { answer: string; isCorrect: boolean; timeSpent: number; hintsUsed: number }>;
  completed: boolean;
  score: number;
  total: number;
  startTime: number;
  endTime?: number;
}

export interface FilterCriteria {
  query: string;
  assessment: string;
  test: string;
  domain: string;
  skill: string;
  difficulty: string;
  status: 'all' | 'unanswered' | 'incorrect' | 'mastered' | 'bookmarked';
  sortBy: 'relevance' | 'id' | 'difficulty_asc' | 'difficulty_desc' | 'skill';
}

export interface TopicProficiency {
  attempted: number;
  correct: number;
  masteryPercent: number;
  accuracyPercent: number;
  averageTimeSeconds: number;
}

export interface OverallAnalytics {
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  timeSpentTotalSeconds: number;
  domainProficiency: Record<string, TopicProficiency>;
  skillProficiency: Record<string, TopicProficiency>;
  difficultyProficiency: Record<string, TopicProficiency>;
  weakestSkills: { skill: string; domain: string; accuracy: number; count: number }[];
  strongestSkills: { skill: string; domain: string; accuracy: number; count: number }[];
  dailyActivity: { date: string; count: number; correct: number }[];
}

export type FeedbackCategory = 'bug' | 'question_issue' | 'feature_idea' | 'general_contact' | 'tutoring_school';
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'blocker';

export interface ClientDiagnostics {
  browser: string;
  os: string;
  screenResolution: string;
  userAgent: string;
  onlineStatus: boolean;
  timestamp: string;
  appVersion: string;
}

export interface FeedbackReport {
  id: string;
  ticketNumber: string;
  category: FeedbackCategory;
  subject: string;
  description: string;
  name: string;
  email: string;
  questionId?: string;
  questionPromptSnippet?: string;
  severity?: FeedbackSeverity;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  clientDiagnostics?: ClientDiagnostics;
  status: 'received' | 'investigating' | 'resolved';
  createdAt: number;
  authorUid?: string;
}

export type FeatureRequestCategory = 'drills' | 'desmos' | 'gamification' | 'mobile' | 'ai' | 'classroom';
export type FeatureRequestStatus = 'planned' | 'in_progress' | 'completed' | 'under_review';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: FeatureRequestCategory;
  status: FeatureRequestStatus;
  upvotes: number;
  hasVoted?: boolean;
  authorName: string;
  authorUid?: string;
  createdAt: number;
  targetGroup: 'students' | 'teachers' | 'everyone';
  voterUids?: string[];
}

export interface ImportQuestionDetail {
  id: string;
  prompt: string;
  domain?: string;
  skill?: string;
  status: 'ADDED' | 'DUPLICATE_SKIPPED';
  reason?: string;
}

export interface ImportLog {
  id: string;
  timestamp: string;
  formattedDate: string;
  source: 'AI Extractor / OCR' | 'JSON File Upload' | 'PDF / Text Importer' | 'Manual Question Builder';
  userEmail: string;
  totalReceived: number;
  addedCount: number;
  duplicateCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summaryMessage: string;
  details?: ImportQuestionDetail[];
  errorMessage?: string;
}

