import { createHash } from 'node:crypto';
import type { Bank, Question, Section } from '../../src/domain/types';
import { createRng, type Rng } from '../math/kit';
import { ANALOGY, IDIOMS, LOGIC, OFFICE, OFFICIAL_TERMS, type Item } from './questions';

export const APTITUDE_BANK_ID = 'macau-aptitude';

const SECTIONS: { title: string; shortTitle: string; items: Item[] }[] = [
  { title: '語理邏輯（推理、親屬關係、排序、真假話）', shortTitle: '語理邏輯', items: LOGIC },
  { title: '類比推理與論證', shortTitle: '類比與論證', items: ANALOGY },
  { title: '公文用語及行政法概念', shortTitle: '公文及行政用語', items: OFFICIAL_TERMS },
  { title: '成語詞義', shortTitle: '成語詞義', items: IDIOMS },
  { title: '電腦文書常識（Excel / Word / PowerPoint）', shortTitle: '電腦文書', items: OFFICE },
];

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffled<T>(items: T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** Shuffles so the answer position carries no hint; a pinned `last` option (以上皆是…) stays last. */
function toOptions(item: Item, rng: Rng): string[] {
  const free = item.answer === item.last ? item.others : [item.answer, ...item.others];
  const options = shuffled(free, rng);
  if (item.last) options.push(item.last);
  if (!options.includes(item.answer) || new Set(options).size !== options.length) {
    throw new Error(`選項設定有誤：${item.stem}`);
  }
  return options;
}

export function buildAptitudeBank(): Bank {
  const rng = createRng(20261027);
  const sections: Section[] = [];
  const questions: Question[] = [];
  SECTIONS.forEach((spec, index) => {
    const sectionId = `s${index + 1}`;
    spec.items.forEach((item, i) => {
      const options = toOptions(item, rng);
      const answerKey = KEYS[options.indexOf(item.answer)] ?? 'A';
      questions.push({
        id: `${APTITUDE_BANK_ID}/${sectionId}/q${i + 1}`,
        bankId: APTITUDE_BANK_ID,
        sectionId,
        no: i + 1,
        type: 'single',
        stem: item.stem,
        options: options.map((content, k) => ({ key: KEYS[k] ?? String(k), content })),
        answer: [answerKey],
        ...(item.explanation ? { explanation: item.explanation } : {}),
      });
    });
    sections.push({ id: sectionId, title: spec.title, shortTitle: spec.shortTitle, order: index + 1, questionCount: spec.items.length });
  });
  const version = createHash('sha1').update(JSON.stringify(questions)).digest('hex').slice(0, 10);
  return {
    schemaVersion: 1,
    id: APTITUDE_BANK_ID,
    title: '綜合能力：邏輯、語文、電腦（430 綜合能力評估）',
    description: '整理自社區流傳的回憶題及常見考點，已剔除殘缺、答案不成立及不適用於澳門的題目，並逐題附解析。',
    version,
    contentFormat: 'text',
    explanationLabel: '解析',
    sections,
    questions,
  };
}
