import { describe, expect, it } from 'vitest';
import { buildAptitudeBank } from './build';
import { ANALOGY, IDIOMS, LOGIC, OFFICE, OFFICIAL_TERMS } from './questions';

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
    const stems = [...LOGIC, ...ANALOGY, ...OFFICIAL_TERMS, ...IDIOMS, ...OFFICE].map((i) => i.stem);
    expect(new Set(stems).size).toBe(stems.length);
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
