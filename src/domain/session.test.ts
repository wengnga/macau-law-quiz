import { describe, expect, it } from 'vitest';
import { searchQuestions } from './search';
import { buildRecord, orderPool, pickQuestions, selectPool } from './session';
import { shuffle } from './shuffle';
import { applyAnswer } from './stats';
import type { ActiveSession, Question, QuestionStat } from './types';

const now = new Date(2026, 9, 26, 10).getTime();

const makeQuestion = (sectionId: string, no: number, extra: Partial<Question> = {}): Question => ({
  id: `b/${sectionId}/q${no}`,
  bankId: 'b',
  sectionId,
  no,
  type: 'single',
  stem: `題目 ${sectionId}-${no}`,
  options: ['A', 'B', 'C', 'D'].map((key) => ({ key, content: `選項${key}` })),
  answer: ['A'],
  ...extra,
});

const questions = [
  ...Array.from({ length: 5 }, (_, i) => makeQuestion('s1', i + 1)),
  ...Array.from({ length: 5 }, (_, i) => makeQuestion('s2', i + 1, { tags: i < 2 ? ['article:法:第一條'] : [] })),
];

/** Deterministic pseudo-random sequence for repeatable tests. */
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('shuffle', () => {
  it('keeps every item exactly once and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input, seeded(7));
    expect([...output].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect(output).not.toEqual(input);
  });
});

describe('selectPool', () => {
  const stats: Record<string, QuestionStat> = {
    'b/s1/q1': applyAnswer(undefined, false, now),
    'b/s2/q1': { ...applyAnswer(undefined, true, now), starred: true },
  };

  it('filters by multiple sections', () => {
    expect(selectPool(questions, stats, { source: 'all', sectionIds: ['s1', 's2'] }, now)).toHaveLength(10);
    expect(selectPool(questions, stats, { source: 'all', sectionIds: ['s2'] }, now)).toHaveLength(5);
  });

  it('filters by wrong book, starred, due and tag', () => {
    expect(selectPool(questions, stats, { source: 'wrong' }, now).map((q) => q.id)).toEqual(['b/s1/q1']);
    expect(selectPool(questions, stats, { source: 'starred' }, now).map((q) => q.id)).toEqual(['b/s2/q1']);
    expect(selectPool(questions, stats, { source: 'due' }, now).map((q) => q.id)).toEqual(['b/s1/q1']);
    expect(selectPool(questions, stats, { source: 'all', tag: 'article:法:第一條' }, now)).toHaveLength(2);
  });
});

describe('orderPool / pickQuestions', () => {
  const stats: Record<string, QuestionStat> = {
    'b/s1/q1': applyAnswer(applyAnswer(undefined, false, now), false, now),
    'b/s1/q2': applyAnswer(undefined, true, now),
    'b/s1/q3': applyAnswer(applyAnswer(undefined, false, now), true, now),
  };
  const pool = questions.filter((q) => q.sectionId === 's1');

  it('puts unseen questions first', () => {
    const ordered = orderPool(pool, stats, 'unseen-first', seeded(3));
    expect(ordered.slice(0, 2).map((q) => q.id).sort()).toEqual(['b/s1/q4', 'b/s1/q5']);
  });

  it('puts weak questions first', () => {
    const ordered = orderPool(pool, stats, 'weak-first', seeded(3));
    expect(ordered.slice(0, 2).map((q) => q.id)).toEqual(['b/s1/q1', 'b/s1/q3']);
  });

  it('limits the count', () => {
    expect(pickQuestions(questions, {}, 'random', 3, seeded(1))).toHaveLength(3);
    expect(pickQuestions(questions, {}, 'random', 'all', seeded(1))).toHaveLength(10);
  });
});

describe('buildRecord', () => {
  it('counts correct, wrong and unanswered questions', () => {
    const session: ActiveSession = {
      id: 'x',
      bankId: 'b',
      mode: 'exam',
      title: 't',
      questionIds: ['b/s1/q1', 'b/s1/q2', 'b/s1/q3'],
      answers: { 'b/s1/q1': ['A'], 'b/s1/q2': ['B'] },
      index: 0,
      startedAt: now,
    };
    const record = buildRecord(session, new Map(questions.map((q) => [q.id, q])), now + 1000);
    expect(record).toMatchObject({ total: 3, answered: 2, correct: 1, wrongIds: ['b/s1/q2'] });
  });
});

describe('searchQuestions', () => {
  it('matches all terms across stem and options using the normalizer', () => {
    const toSimplified = (text: string) => text.replace(/題/g, '题').replace(/選/g, '选').replace(/項/g, '项');
    expect(searchQuestions(questions, '题目 s2-3', toSimplified).map((q) => q.id)).toEqual(['b/s2/q3']);
    expect(searchQuestions(questions, '选项A s1-1', toSimplified)).toHaveLength(1);
    expect(searchQuestions(questions, '   ')).toEqual([]);
  });
});
