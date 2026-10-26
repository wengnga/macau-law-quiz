import type { Question } from './types';

export type TextNormalizer = (text: string) => string;

const identity: TextNormalizer = (text) => text;

export function questionHaystack(question: Question): string {
  return [question.stem, ...question.options.map((option) => option.content), question.explanation ?? ''].join('\n');
}

/**
 * All whitespace-separated terms must appear. `normalize` is applied to both sides,
 * e.g. a traditional->simplified converter so simplified queries match traditional text.
 */
export function searchQuestions(
  questions: readonly Question[],
  query: string,
  normalize: TextNormalizer = identity,
  haystacks?: ReadonlyMap<string, string>,
): Question[] {
  const terms = normalize(query.toLowerCase()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return questions.filter((question) => {
    const haystack = haystacks?.get(question.id) ?? normalize(questionHaystack(question).toLowerCase());
    return terms.every((term) => haystack.includes(term));
  });
}
