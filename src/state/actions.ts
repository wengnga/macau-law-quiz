import { isAnswered, isCorrect } from '../domain/grading';
import { buildRecord, createSessionId } from '../domain/session';
import { applyAnswer, createEmptyStat } from '../domain/stats';
import type { Question, QuestionStat, SessionMode, SessionRecord, ThemePreference } from '../domain/types';
import { createDefaultAppData, MAX_SESSION_RECORDS, type AppData } from '../storage/appData';
import { getAppData, setAppData, updateAppData } from './store';

export interface StartSessionOptions {
  bankId: string;
  mode: SessionMode;
  title: string;
  questionIds: string[];
  timeLimitSec?: number;
}

export function startSession(options: StartSessionOptions, now = Date.now()): void {
  updateAppData((data) => ({
    ...data,
    activeSession: {
      id: createSessionId(now),
      bankId: options.bankId,
      mode: options.mode,
      title: options.title,
      questionIds: options.questionIds,
      answers: {},
      index: 0,
      startedAt: now,
      timeLimitSec: options.timeLimitSec,
    },
  }));
}

/**
 * Practice: first answer is final and updates stats immediately.
 * Exam: answers can be changed; stats are updated on submit.
 */
export function answerQuestion(question: Question, answer: string[], now = Date.now()): void {
  updateAppData((data) => {
    const session = data.activeSession;
    if (!session || session.mode === 'memorize') return data;
    if (session.mode === 'practice' && isAnswered(session.answers[question.id])) return data;
    const answers = { ...session.answers, [question.id]: answer };
    const stats =
      session.mode === 'practice'
        ? { ...data.stats, [question.id]: applyAnswer(data.stats[question.id], isCorrect(question, answer), now) }
        : data.stats;
    return { ...data, stats, activeSession: { ...session, answers } };
  });
}

export function goToIndex(index: number): void {
  updateAppData((data) => {
    const session = data.activeSession;
    if (!session) return data;
    const clamped = Math.min(Math.max(index, 0), session.questionIds.length - 1);
    if (clamped === session.index) return data;
    return { ...data, activeSession: { ...session, index: clamped } };
  });
}

/** Ends the active session. Returns the saved record, or null for memorize mode (nothing to grade). */
export function finishSession(questionsById: ReadonlyMap<string, Question>, now = Date.now()): SessionRecord | null {
  const data = getAppData();
  const session = data.activeSession;
  if (!session) return null;
  if (session.mode === 'memorize') {
    setAppData({ ...data, activeSession: null });
    return null;
  }
  const record = buildRecord(session, questionsById, now);
  let stats = data.stats;
  if (session.mode === 'exam') {
    stats = { ...stats };
    for (const id of session.questionIds) {
      const question = questionsById.get(id);
      const answer = session.answers[id];
      if (question && isAnswered(answer)) stats[id] = applyAnswer(stats[id], isCorrect(question, answer), now);
    }
  }
  setAppData({
    ...data,
    stats,
    activeSession: null,
    sessions: [record, ...data.sessions].slice(0, MAX_SESSION_RECORDS),
  });
  return record;
}

export function abandonSession(): void {
  updateAppData((data) => (data.activeSession ? { ...data, activeSession: null } : data));
}

function patchStat(questionId: string, patch: (stat: QuestionStat) => Partial<QuestionStat>): void {
  updateAppData((data) => {
    const current = data.stats[questionId] ?? createEmptyStat();
    return { ...data, stats: { ...data.stats, [questionId]: { ...current, ...patch(current) } } };
  });
}

export function toggleStar(questionId: string): void {
  patchStat(questionId, (stat) => ({ starred: !stat.starred }));
}

export function setNote(questionId: string, note: string): void {
  const trimmed = note.trim();
  patchStat(questionId, () => ({ note: trimmed ? trimmed : undefined }));
}

export function setInWrongBook(questionId: string, inWrongBook: boolean): void {
  patchStat(questionId, () => ({ inWrongBook }));
}

export function setTheme(theme: ThemePreference): void {
  updateAppData((data) => ({ ...data, settings: { ...data.settings, theme } }));
}

export function setBankId(bankId: string): void {
  updateAppData((data) => ({ ...data, settings: { ...data.settings, bankId } }));
}

export function replaceAppData(next: AppData): void {
  setAppData(next);
}

/** Clears all study progress but keeps preferences. */
export function resetProgress(): void {
  const { settings } = getAppData();
  setAppData({ ...createDefaultAppData(), settings });
}
