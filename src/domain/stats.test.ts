import { describe, expect, it } from 'vitest';
import { applyAnswer, DAY_MS, isDue, RETRY_DELAY_MS, scheduleReview, summarize } from './stats';

const now = new Date(2026, 9, 26, 10, 0, 0).getTime();

describe('applyAnswer', () => {
  it('counts wrong answers and puts the question into the wrong book', () => {
    const once = applyAnswer(undefined, false, now);
    const twice = applyAnswer(once, false, now + 1);
    expect(twice).toMatchObject({ attempts: 2, wrongCount: 2, correctStreak: 0, inWrongBook: true, lastWrongAt: now + 1 });
    expect(twice.nextReviewAt).toBe(now + 1 + RETRY_DELAY_MS);
  });

  it('removes from the wrong book only after three consecutive correct answers', () => {
    let stat = applyAnswer(undefined, false, now);
    stat = applyAnswer(stat, true, now);
    stat = applyAnswer(stat, true, now);
    expect(stat.inWrongBook).toBe(true);
    stat = applyAnswer(stat, true, now);
    expect(stat).toMatchObject({ inWrongBook: false, wrongCount: 1, correctStreak: 3 });
  });

  it('resets the streak on a wrong answer', () => {
    let stat = applyAnswer(undefined, false, now);
    stat = applyAnswer(stat, true, now);
    stat = applyAnswer(stat, true, now);
    stat = applyAnswer(stat, false, now);
    stat = applyAnswer(stat, true, now);
    expect(stat).toMatchObject({ inWrongBook: true, correctStreak: 1, wrongCount: 2 });
  });

  it('keeps starred and note untouched', () => {
    const stat = applyAnswer({ attempts: 0, wrongCount: 0, correctStreak: 0, inWrongBook: false, starred: true, note: 'n' }, false, now);
    expect(stat).toMatchObject({ starred: true, note: 'n' });
  });
});

describe('scheduleReview', () => {
  it('grows the interval with the streak', () => {
    expect(scheduleReview(1, false, now)).toBe(now + DAY_MS);
    expect(scheduleReview(2, false, now)).toBe(now + 3 * DAY_MS);
    expect(scheduleReview(3, false, now)).toBe(now + 7 * DAY_MS);
    expect(scheduleReview(99, false, now)).toBe(now + 60 * DAY_MS);
  });

  it('starts one step further for questions never answered wrong', () => {
    expect(scheduleReview(1, true, now)).toBe(now + 3 * DAY_MS);
  });
});

describe('isDue', () => {
  it('treats anything scheduled before the end of today as due', () => {
    const later = new Date(2026, 9, 26, 23, 0, 0).getTime();
    const tomorrow = new Date(2026, 9, 27, 0, 30, 0).getTime();
    expect(isDue({ attempts: 1, wrongCount: 0, correctStreak: 1, inWrongBook: false, starred: false, nextReviewAt: later }, now)).toBe(true);
    expect(isDue({ attempts: 1, wrongCount: 0, correctStreak: 1, inWrongBook: false, starred: false, nextReviewAt: tomorrow }, now)).toBe(false);
    expect(isDue(undefined, now)).toBe(false);
  });
});

describe('summarize', () => {
  it('aggregates per-group progress', () => {
    const wrong = applyAnswer(undefined, false, now);
    const right = applyAnswer(undefined, true, now);
    const summary = summarize(['a', 'b', 'c'], { a: wrong, b: right }, now);
    expect(summary).toEqual({ total: 3, attempted: 2, attempts: 2, wrongAttempts: 1, mastered: 0, inWrongBook: 1, due: 1 });
  });
});
