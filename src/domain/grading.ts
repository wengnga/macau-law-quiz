import type { Question } from './types';

const normalizeFill = (value: string): string => value.trim().replace(/\s+/g, '').toLowerCase();

export function isAnswered(answer: readonly string[] | undefined): answer is readonly string[] {
  return answer !== undefined && answer.length > 0;
}

export function isCorrect(question: Question, answer: readonly string[] | undefined): boolean {
  if (!isAnswered(answer)) return false;
  switch (question.type) {
    case 'single':
    case 'judge':
      return answer.length === 1 && question.answer.length === 1 && answer[0] === question.answer[0];
    case 'multiple': {
      const expected = new Set(question.answer);
      const given = new Set(answer);
      return expected.size === given.size && [...given].every((key) => expected.has(key));
    }
    case 'fill': {
      const given = normalizeFill(answer[0] ?? '');
      return question.answer.some((candidate) => normalizeFill(candidate) === given);
    }
  }
}
