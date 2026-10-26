import { isAnswered, isCorrect } from './grading';
import { shuffle, type Random } from './shuffle';
import { errorRate, isDue } from './stats';
import type { ActiveSession, Question, QuestionStat, SessionRecord } from './types';

export type QuestionSource = 'all' | 'wrong' | 'starred' | 'due';
export type PickStrategy = 'random' | 'unseen-first' | 'weak-first';

export interface PoolFilter {
  source: QuestionSource;
  sectionIds?: readonly string[];
  tag?: string;
  questionIds?: readonly string[];
}

export function selectPool(
  questions: readonly Question[],
  stats: Readonly<Record<string, QuestionStat>>,
  filter: PoolFilter,
  now: number,
): Question[] {
  const sectionSet = filter.sectionIds ? new Set(filter.sectionIds) : null;
  const idSet = filter.questionIds ? new Set(filter.questionIds) : null;
  return questions.filter((question) => {
    if (sectionSet && !sectionSet.has(question.sectionId)) return false;
    if (idSet && !idSet.has(question.id)) return false;
    if (filter.tag && !question.tags?.includes(filter.tag)) return false;
    const stat = stats[question.id];
    switch (filter.source) {
      case 'all':
        return true;
      case 'wrong':
        return stat?.inWrongBook === true;
      case 'starred':
        return stat?.starred === true;
      case 'due':
        return isDue(stat, now);
    }
  });
}

/** Shuffles first, then stable-sorts by priority, so ties stay in random order. */
export function orderPool(
  pool: readonly Question[],
  stats: Readonly<Record<string, QuestionStat>>,
  strategy: PickStrategy,
  random: Random = Math.random,
): Question[] {
  const shuffled = shuffle(pool, random);
  if (strategy === 'random') return shuffled;
  if (strategy === 'unseen-first') {
    const attempts = (q: Question) => stats[q.id]?.attempts ?? 0;
    return shuffled.sort((a, b) => Number(attempts(a) > 0) - Number(attempts(b) > 0));
  }
  return shuffled.sort((a, b) => {
    const sa = stats[a.id];
    const sb = stats[b.id];
    return (
      Number(sb?.inWrongBook ?? false) - Number(sa?.inWrongBook ?? false) ||
      errorRate(sb) - errorRate(sa) ||
      (sb?.wrongCount ?? 0) - (sa?.wrongCount ?? 0)
    );
  });
}

export function pickQuestions(
  pool: readonly Question[],
  stats: Readonly<Record<string, QuestionStat>>,
  strategy: PickStrategy,
  count: number | 'all',
  random: Random = Math.random,
): Question[] {
  const ordered = orderPool(pool, stats, strategy, random);
  return count === 'all' ? ordered : ordered.slice(0, count);
}

export function createSessionId(now: number, random: Random = Math.random): string {
  return `${now.toString(36)}-${Math.floor(random() * 1e9).toString(36)}`;
}

export function buildRecord(
  session: ActiveSession,
  questionsById: ReadonlyMap<string, Question>,
  finishedAt: number,
): SessionRecord {
  let answered = 0;
  let correct = 0;
  const wrongIds: string[] = [];
  for (const id of session.questionIds) {
    const question = questionsById.get(id);
    const answer = session.answers[id];
    if (!question) continue;
    if (isAnswered(answer)) answered += 1;
    if (isCorrect(question, answer)) correct += 1;
    else if (isAnswered(answer)) wrongIds.push(id);
  }
  return {
    id: session.id,
    bankId: session.bankId,
    mode: session.mode,
    title: session.title,
    total: session.questionIds.length,
    answered,
    correct,
    startedAt: session.startedAt,
    finishedAt,
    questionIds: session.questionIds,
    answers: session.answers,
    wrongIds,
  };
}
