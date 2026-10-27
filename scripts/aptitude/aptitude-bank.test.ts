import { describe, expect, it } from 'vitest';
import { buildAptitudeBank } from './build';
import { ARGUMENTS } from './arguments';
import { ANALOGY, LOGIC } from './questions';
import { READING } from './reading';
import { ANALOGY_XINGCE, ARGUMENTS_XINGCE, LOGIC_XINGCE, READING_XINGCE } from './xingce';

const PINNED = /以上皆|以上都|無法判斷|無法確定/;

describe('aptitude bank', () => {
  const bank = buildAptitudeBank();

  it('every question has distinct options and a valid answer', () => {
    for (const q of bank.questions) {
      const contents = q.options.map((o) => o.content);
      expect(contents.length, q.stem).toBeGreaterThanOrEqual(3);
      expect(new Set(contents).size, q.stem).toBe(contents.length);
      expect(q.answer).toHaveLength(1);
      expect(q.options.some((o) => o.key === q.answer[0]), q.stem).toBe(true);
      contents.forEach((c) => expect(c.trim(), q.stem).not.toBe(''));
    }
  });

  it('catch-all options are pinned last', () => {
    for (const q of bank.questions) {
      q.options.slice(0, -1).forEach((o) => expect(PINNED.test(o.content), `${q.stem} → ${o.content}`).toBe(false));
    }
  });

  it('no duplicated stems', () => {
    const stems = [...LOGIC, ...ANALOGY, ...READING, ...ARGUMENTS, ...LOGIC_XINGCE, ...ANALOGY_XINGCE, ...ARGUMENTS_XINGCE, ...READING_XINGCE].map((i) => i.stem);
    expect(new Set(stems).size).toBe(stems.length);
  });

  it('explanations refer to options by placeholder, never by a hard-coded letter', () => {
    const items = [...LOGIC, ...ANALOGY, ...READING, ...ARGUMENTS, ...LOGIC_XINGCE, ...ANALOGY_XINGCE, ...ARGUMENTS_XINGCE, ...READING_XINGCE];
    for (const item of items) {
      const letters = item.explanation.match(/(?<![A-Za-z0-9])[A-D](?![A-Za-z0-9])/g) ?? [];
      letters.forEach((letter) => expect(item.stem.includes(letter), `${item.stem.slice(0, 30)} → ${letter}`).toBe(true));
    }
    for (const q of bank.questions) expect(q.explanation ?? '', q.stem).not.toMatch(/\{\d\}/);
  });

  it('placeholders resolve to the shown letter of the intended option', () => {
    const q = bank.questions.find((item) => item.stem.startsWith('大三巴牌坊'));
    const letterOf = (text: string) => q?.options.find((o) => o.content === text)?.key;
    expect(q?.explanation).toContain(`${letterOf('記載澳門歷史的史書厚重難讀')} 只是附帶的比較`);
  });

  it('question ids are unique', () => {
    expect(new Set(bank.questions.map((q) => q.id)).size).toBe(bank.questions.length);
  });

  it('section counts match and version is deterministic', () => {
    for (const s of bank.sections) {
      expect(bank.questions.filter((q) => q.sectionId === s.id)).toHaveLength(s.questionCount);
    }
    expect(buildAptitudeBank().version).toBe(bank.version);
  });

  it('answer positions are not skewed', () => {
    const counts = new Map<string, number>();
    bank.questions.forEach((q) => counts.set(q.answer[0] ?? '', (counts.get(q.answer[0] ?? '') ?? 0) + 1));
    const max = Math.max(...counts.values());
    expect(max / bank.questions.length).toBeLessThan(0.4);
  });
});
