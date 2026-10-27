export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill';

/** How stems/options/materials are rendered. `text` keeps line breaks; `markdown` supports images, tables, etc. */
export type ContentFormat = 'text' | 'markdown';

export interface QuestionOption {
  key: string;
  content: string;
}

export interface Question {
  /** Globally unique, prefixed with the bank id, e.g. `macau-law/s2/q15`. */
  id: string;
  bankId: string;
  sectionId: string;
  no: number;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  /** Always an array so multiple-answer types need no schema change. */
  answer: string[];
  explanation?: string;
  /** Shared passage / chart that several questions refer to. */
  materialId?: string;
  tags?: string[];
}

export interface Material {
  id: string;
  content: string;
}

export interface Section {
  id: string;
  title: string;
  shortTitle: string;
  order: number;
  questionCount: number;
}

export interface Bank {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  version: string;
  contentFormat: ContentFormat;
  /** Heading shown above `Question.explanation`; defaults to「解析」. */
  explanationLabel?: string;
  sections: Section[];
  questions: Question[];
  materials?: Material[];
}

export interface BankIndexEntry {
  id: string;
  title: string;
  questionCount: number;
  file: string;
}

export interface QuestionStat {
  attempts: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: number;
  lastWrongAt?: number;
  nextReviewAt?: number;
  inWrongBook: boolean;
  starred: boolean;
  note?: string;
}

export type SessionMode = 'practice' | 'memorize' | 'exam';

export interface ActiveSession {
  id: string;
  bankId: string;
  mode: SessionMode;
  title: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  index: number;
  startedAt: number;
  timeLimitSec?: number;
}

export interface SessionRecord {
  id: string;
  bankId: string;
  mode: SessionMode;
  title: string;
  total: number;
  answered: number;
  correct: number;
  startedAt: number;
  finishedAt: number;
  questionIds: string[];
  answers: Record<string, string[]>;
  wrongIds: string[];
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  bankId?: string;
}
