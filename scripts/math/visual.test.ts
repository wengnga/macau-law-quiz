import { describe, expect, it } from 'vitest';
import { buildMathBank } from './build';
import { RULES } from './operations';

const bank = buildMathBank();
const answerText = (id: string): string => {
  const question = bank.questions.find((q) => q.id === id);
  return question?.options.find((o) => o.key === question.answer[0])?.content ?? '';
};

describe('defined-operation questions', () => {
  const questions = bank.questions.filter((q) => q.sectionId === 's10');

  it('has exactly one rule fitting the examples, and the answer follows it', () => {
    expect(questions.length).toBeGreaterThanOrEqual(8);
    for (const q of questions) {
      const examples = [...q.stem.matchAll(/\((\d+),(\d+)\) = (\d+)/g)].map((m) => m.slice(1).map(Number));
      const query = /\((\d+),(\d+)\) = ？/.exec(q.stem);
      expect(examples, q.stem).toHaveLength(3);
      const fitting = RULES.filter((rule) => examples.every(([a, b, out]) => rule.apply(a ?? 0, b ?? 0) === out));
      expect(fitting, q.stem).toHaveLength(1);
      const expected = fitting[0]?.apply(Number(query?.[1]), Number(query?.[2]));
      expect(answerText(q.id), q.stem).toBe(String(expected));
    }
  });
});

describe('chart questions', () => {
  const questions = bank.questions.filter((q) => q.sectionId === 's9');

  it('embeds a decodable SVG in every stem', () => {
    expect(questions).toHaveLength(10);
    for (const q of questions) {
      const match = /data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)\)/.exec(q.stem);
      expect(match, q.id).not.toBeNull();
      const svg = Buffer.from(match?.[1] ?? '', 'base64').toString('utf8');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
    }
  });

  it('pie-chart amounts match total × share read from the chart', () => {
    const shareOf = (stem: string, item: string): number => {
      const svg = Buffer.from(/base64,([^)]+)\)/.exec(stem)?.[1] ?? '', 'base64').toString('utf8');
      return Number(new RegExp(`${item}（(\\d+)%）`).exec(svg)?.[1]);
    };
    let checked = 0;
    for (const q of questions.filter((item) => item.stem.includes('開支分佈'))) {
      const total = Number(/總額為 (\d+) 萬/.exec(q.stem)?.[1]);
      const plain = /\n\n(人員|設備|租金|培訓)開支為多少萬元？$/.exec(q.stem);
      if (plain) {
        expect(answerText(q.id), q.id).toBe(String((total * shareOf(q.stem, plain[1] ?? '')) / 100));
        checked += 1;
      }
      if (q.stem.includes('增加 10%')) {
        expect(answerText(q.id), q.id).toBe(String(Math.round(total * 1.1 * shareOf(q.stem, '租金')) / 100));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
