// ─────────────────────────────────────────
// Shared TypeScript types for notion-lite
// ─────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

// ─── Pages & Blocks ──────────────────────

export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'checklist'
  | 'bulleted_list'
  | 'numbered_list'
  | 'code'
  | 'image'
  | 'divider'
  | 'quote'
  | 'callout'
  | 'toggle';

export interface Block {
  id: string;
  pageId: string;
  parentBlockId?: string;
  type: BlockType;
  content: Record<string, unknown>;
  position: number;
  children?: Block[];
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  userId: string;
  title: string;
  icon?: string;
  coverUrl?: string;
  parentId?: string;
  isDeleted: boolean;
  position: number;
  blocks?: Block[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ───────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus   = 'todo' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: string;
  userId: string;
  pageId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Habits ──────────────────────────────

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedToday: boolean;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Journal ─────────────────────────────

export type JournalMood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  title?: string;
  content?: string;
  mood?: JournalMood;
  createdAt: string;
  updatedAt: string;
}

// ─── Learning ────────────────────────────

export type LearningStatus = 'active' | 'completed' | 'paused';

export interface LearningTopic {
  id: string;
  userId: string;
  name: string;
  description?: string;
  progress: number;
  status: LearningStatus;
  category?: string;
  resources?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stocks ──────────────────────────────

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  quote: StockQuote | null;
  addedAt: string;
}

// ─── GitHub ──────────────────────────────

export interface GithubProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  publicRepos: number;
  followers: number;
  following: number;
  url: string;
}

export interface GithubRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  isPrivate: boolean;
}

export interface GithubEvent {
  id: string;
  type: string;
  repoName: string;
  message: string;
  createdAt: string;
}

// ─── Tags ────────────────────────────────

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
}

// ─── API Response ─────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
