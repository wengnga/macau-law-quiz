import { createHash } from 'node:crypto';
import type { Bank, Question, Section } from '../../src/domain/types';
import { createRng, type Rng } from '../math/kit';
import { ARGUMENTS } from './arguments';
import { ANALOGY, IDIOMS, LOGIC, OFFICIAL_TERMS, type Item } from './questions';
import { READING } from './reading';

export const APTITUDE_BANK_ID = 'macau-aptitude';

/**
 * Listed in display order. Ids are fixed so saved progress survives reordering;
 * s5 (電腦文書) was dropped because it is outside the official syllabus — never reuse it.
 */
const SECTIONS: { id: string; title: string; shortTitle: string; items: Item[] }[] = [
  { id: 's6', title: '語文理解：片段閱讀（主旨、意圖、細節、事實與意見）', shortTitle: '片段閱讀', items: READING },
  { id: 's2', title: '語文理解：類比推理', shortTitle: '類比推理', items: ANALOGY },
  { id: 's4', title: '語文理解：成語詞義', shortTitle: '成語詞義', items: IDIOMS },
  { id: 's3', title: '語文理解：公文用語及行政法概念', shortTitle: '公文及行政用語', items: OFFICIAL_TERMS },
  { id: 's1', title: '語理邏輯：推理、親屬關係、排序、真假話', shortTitle: '語理邏輯', items: LOGIC },
  { id: 's7', title: '語理邏輯：論證評估（加強、削弱、解釋、定義判斷）', shortTitle: '論證評估', items: ARGUMENTS },
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
  const sections: Section[] = [];
  const questions: Question[] = [];
  SECTIONS.forEach((spec, index) => {
    const sectionId = spec.id;
    const rng = createRng(20261027 + Number(sectionId.slice(1)) * 7919);
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
    title: '語文理解及語理邏輯（綜合能力評估）',
    description: '片段閱讀及論證評估參照內地行測題型改寫為澳門背景；其餘整理自社區回憶題及常見考點，已剔除殘缺、答案不成立及超出考試範圍的題目，逐題附解析。',
    version,
    contentFormat: 'text',
    explanationLabel: '解析',
    sections,
    questions,
  };
}
