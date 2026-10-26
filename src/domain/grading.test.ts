import { describe, expect, it } from 'vitest';
import { isCorrect } from './grading';
import type { Question } from './types';

const base: Question = {
  id: 'b/s1/q1',
  bankId: 'b',
  sectionId: 's1',
  no: 1,
  type: 'single',
  stem: '?',
  options: ['A', 'B', 'C', 'D'].map((key) => ({ key, content: key })),
  answer: ['C'],
};

describe('isCorrect', () => {
  it('grades single choice', () => {
    expect(isCorrect(base, ['C'])).toBe(true);
    expect(isCorrect(base, ['A'])).toBe(false);
    expect(isCorrect(base, undefined)).toBe(false);
    expect(isCorrect(base, [])).toBe(false);
  });

  it('grades multiple choice as an exact set', () => {
    const question: Question = { ...base, type: 'multiple', answer: ['A', 'C'] };
    expect(isCorrect(question, ['C', 'A'])).toBe(true);
    expect(isCorrect(question, ['A'])).toBe(false);
    expect(isCorrect(question, ['A', 'B', 'C'])).toBe(false);
  });

  it('grades fill-in ignoring whitespace and case', () => {
    const question: Question = { ...base, type: 'fill', options: [], answer: ['Macau SAR'] };
    expect(isCorrect(question, [' macau  sar '])).toBe(true);
    expect(isCorrect(question, ['macao'])).toBe(false);
  });
});
