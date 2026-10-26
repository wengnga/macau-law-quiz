import type { QuestionStat } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** A wrong answer becomes due again shortly, so it shows up in today's review. */
export const RETRY_DELAY_MS = 10 * 60 * 1000;
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 15, 30, 60] as const;
/** Consecutive correct answers needed before a question leaves the wrong book automatically. */
export const WRONG_BOOK_EXIT_STREAK = 3;
export const MASTERED_STREAK = 3;

export function createEmptyStat(): QuestionStat {
  return { attempts: 0, wrongCount: 0, correctStreak: 0, inWrongBook: false, starred: false };
}

/**
 * Interval grows with the correct streak. A question that has never been answered wrong
 * starts one step further, so first-time correct answers don't flood tomorrow's review.
 */
export function scheduleReview(correctStreak: number, neverWrong: boolean, now: number): number {
  const lastStep = REVIEW_INTERVALS_DAYS.length - 1;
  const step = Math.min(Math.max(correctStreak - 1, 0) + (neverWrong ? 1 : 0), lastStep);
  const days: number = REVIEW_INTERVALS_DAYS[step] ?? REVIEW_INTERVALS_DAYS[0];
  return now + days * DAY_MS;
}

export function applyAnswer(prev: QuestionStat | undefined, correct: boolean, now: number): QuestionStat {
  const base = prev ?? createEmptyStat();
  const attempts = base.attempts + 1;
  if (!correct) {
    return {
      ...base,
      attempts,
      wrongCount: base.wrongCount + 1,
      correctStreak: 0,
      lastAnsweredAt: now,
      lastWrongAt: now,
      inWrongBook: true,
      nextReviewAt: now + RETRY_DELAY_MS,
    };
  }
  const correctStreak = base.correctStreak + 1;
  return {
    ...base,
    attempts,
    correctStreak,
    lastAnsweredAt: now,
    inWrongBook: base.inWrongBook && correctStreak < WRONG_BOOK_EXIT_STREAK,
    nextReviewAt: scheduleReview(correctStreak, base.wrongCount === 0, now),
  };
}

export function endOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function isDue(stat: QuestionStat | undefined, now: number): boolean {
  return stat?.nextReviewAt !== undefined && stat.nextReviewAt <= endOfDay(now);
}

export function isMastered(stat: QuestionStat | undefined): boolean {
  return (stat?.correctStreak ?? 0) >= MASTERED_STREAK;
}

export function errorRate(stat: QuestionStat | undefined): number {
  if (!stat || stat.attempts === 0) return 0;
  return stat.wrongCount / stat.attempts;
}

export interface GroupSummary {
  total: number;
  attempted: number;
  attempts: number;
  wrongAttempts: number;
  mastered: number;
  inWrongBook: number;
  due: number;
}

export function summarize(
  questionIds: readonly string[],
  stats: Readonly<Record<string, QuestionStat>>,
  now: number,
): GroupSummary {
  const summary: GroupSummary = { total: questionIds.length, attempted: 0, attempts: 0, wrongAttempts: 0, mastered: 0, inWrongBook: 0, due: 0 };
  for (const id of questionIds) {
    const stat = stats[id];
    if (!stat) continue;
    if (stat.attempts > 0) summary.attempted += 1;
    summary.attempts += stat.attempts;
    summary.wrongAttempts += stat.wrongCount;
    if (isMastered(stat)) summary.mastered += 1;
    if (stat.inWrongBook) summary.inWrongBook += 1;
    if (isDue(stat, now)) summary.due += 1;
  }
  return summary;
}

export function accuracy(summary: Pick<GroupSummary, 'attempts' | 'wrongAttempts'>): number | null {
  if (summary.attempts === 0) return null;
  return (summary.attempts - summary.wrongAttempts) / summary.attempts;
}
