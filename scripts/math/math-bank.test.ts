import { describe, expect, it } from 'vitest';
import { buildMathBank } from './build';
import { createRng, type Generated } from './kit';
import * as gen from './generators';

const bank = buildMathBank();

function answerOf(questionId: string): string {
  const question = bank.questions.find((item) => item.id === questionId);
  const option = question?.options.find((item) => item.key === question.answer[0]);
  if (!option) throw new Error(`找不到 ${questionId}`);
  return option.content;
}

function sample(make: (rng: ReturnType<typeof createRng>) => Generated | null, count = 40): Generated[] {
  const rng = createRng(99);
  const results: Generated[] = [];
  while (results.length < count) {
    const item = make(rng);
    if (item) results.push(item);
  }
  return results;
}

const numbersIn = (text: string): number[] => (text.match(/\d+(\.\d+)?/g) ?? []).map(Number);

describe('math bank', () => {
  it('every question is well formed', () => {
    expect(bank.questions.length).toBeGreaterThan(120);
    for (const question of bank.questions) {
      expect(question.options).toHaveLength(4);
      const contents = question.options.map((option) => option.content);
      expect(new Set(contents).size).toBe(4);
      expect(question.options.some((option) => option.key === question.answer[0])).toBe(true);
      const text = [question.stem, ...contents, question.explanation ?? ''].join(' ');
      expect(text).not.toMatch(/undefined|NaN|Infinity/);
      expect(question.explanation).toBeTruthy();
    }
  });

  it('stems are unique within each section', () => {
    for (const section of bank.sections) {
      const stems = bank.questions.filter((question) => question.sectionId === section.id).map((question) => question.stem);
      expect(new Set(stems).size).toBe(stems.length);
      expect(stems.length).toBe(section.questionCount);
    }
  });

  it('builds deterministically', () => {
    expect(buildMathBank().version).toBe(bank.version);
  });

  it('past-paper answers match independent calculations', () => {
    expect(answerOf('macau-math/s1/q1')).toBe(String(Math.ceil((93 - 15) / 2) + 15));
    expect(answerOf('macau-math/s1/q14')).toBe('660000');
    expect(answerOf('macau-math/s1/q16')).toBe(String(168 - 3 - 90));

    let large = 10;
    let medium = 10;
    let small = 10;
    let sets = 10;
    for (let changed = true; changed; ) {
      changed = false;
      for (const [size, need] of [['L', 3], ['M', 5], ['S', 7]] as const) {
        const have = size === 'L' ? large : size === 'M' ? medium : small;
        const extra = Math.floor(have / need);
        if (extra === 0) continue;
        changed = true;
        sets += extra;
        if (size === 'L') large -= extra * need;
        if (size === 'M') medium -= extra * need;
        if (size === 'S') small -= extra * need;
        large += extra;
        medium += extra;
        small += extra;
      }
    }
    expect(answerOf('macau-math/s1/q30')).toBe(String(sets));
  });

  it('median-extreme answers match brute force', () => {
    for (const item of sample(gen.medianExtreme, 15)) {
      const [n = 0, mean = 0, median = 0] = numbersIn(item.stem);
      const k = (n - 1) / 2;
      const total = n * mean;
      const wantMax = item.stem.includes('最大的數');
      let best = -1;
      if (wantMax) {
        for (let candidate = median; candidate <= total; candidate += 1) {
          if (k + median + (k - 1) * median + candidate <= total) best = candidate;
        }
      } else {
        for (let candidate = 1; candidate <= median; candidate += 1) {
          if (candidate * k + (k + 1) * median <= total) best = candidate;
        }
      }
      expect(item.correct).toBe(String(best));
    }
  });

  it('arrangement answers match brute force', () => {
    const permutations = (items: number[]): number[][] =>
      items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
    for (const item of sample(gen.arrangement, 12)) {
      const [n = 0] = numbersIn(item.stem);
      const all = permutations(Array.from({ length: n }, (_, i) => i));
      const adjacent = (p: number[]): boolean => Math.abs(p.indexOf(0) - p.indexOf(1)) === 1;
      let expected: number;
      if (item.stem.includes('必須相鄰')) expected = all.filter(adjacent).length;
      else if (item.stem.includes('不能相鄰')) expected = all.filter((p) => !adjacent(p)).length;
      else expected = all.filter((p) => p[0] !== 0 && p[n - 1] !== 0).length;
      expect(item.correct).toBe(String(expected));
    }
  });

  it('same-colour probabilities match enumeration', () => {
    for (const item of sample(gen.sameColour, 12)) {
      const [red = 0, white = 0] = numbersIn(item.stem);
      const balls = [...Array<string>(red).fill('r'), ...Array<string>(white).fill('w')];
      let same = 0;
      let pairs = 0;
      for (let i = 0; i < balls.length; i += 1) {
        for (let j = i + 1; j < balls.length; j += 1) {
          pairs += 1;
          if (balls[i] === balls[j]) same += 1;
        }
      }
      const [num = 0, den = 1] = item.correct.split('/').map(Number);
      expect(num / (item.correct.includes('/') ? den : 1)).toBeCloseTo(same / pairs, 10);
    }
  });
});
