import { createHash } from 'node:crypto';
import type { Bank, Question, Section } from '../../src/domain/types';
import * as gen from './generators';
import { collect, type Draft, type Generated, type Rng } from './kit';
import { PAST_QUESTIONS } from './past';

export const MATH_BANK_ID = 'macau-math';

type Recipe = [make: (rng: Rng) => Generated | null, count: number];

interface SectionSpec {
  title: string;
  shortTitle: string;
  drafts: () => Draft[];
}

/** Each recipe gets its own fixed seed, so adding a recipe never reshuffles existing questions. */
function fromRecipes(seedBase: number, recipes: Recipe[]): () => Draft[] {
  return () => recipes.flatMap(([make, count], index) => collect(count, seedBase * 100 + index, make));
}

const SECTIONS: SectionSpec[] = [
  { title: '歷屆真題（回憶版）', shortTitle: '歷屆真題', drafts: () => PAST_QUESTIONS },
  {
    title: '工程與合作問題',
    shortTitle: '工程與合作',
    drafts: fromRecipes(2, [
      [gen.workTogether, 12],
      [gen.workJoinLater, 10],
      [gen.pipes, 8],
    ]),
  },
  {
    title: '行程問題（追及、相遇、過隧道、平均速度）',
    shortTitle: '行程問題',
    drafts: fromRecipes(3, [
      [gen.chase, 8],
      [gen.meet, 8],
      [gen.trainTunnel, 8],
      [gen.roundTrip, 6],
    ]),
  },
  {
    title: '百分比與比例（增長率、基準值陷阱、利潤）',
    shortTitle: '百分比與比例',
    drafts: fromRecipes(4, [
      [gen.upThenDown, 8],
      [gen.ratioChange, 8],
      [gen.baseYear, 8],
      [gen.profit, 8],
      [gen.successivePct, 6],
    ]),
  },
  {
    title: '機率與排列組合',
    shortTitle: '機率與排列組合',
    drafts: fromRecipes(5, [
      [gen.sameColour, 10],
      [gen.atLeastOne, 10],
      [gen.arrangement, 10],
      [gen.committee, 10],
    ]),
  },
  {
    title: '平均數與中位數',
    shortTitle: '平均數與中位數',
    drafts: fromRecipes(6, [
      [gen.medianExtreme, 12],
      [gen.newcomer, 8],
      [gen.weightedMean, 8],
    ]),
  },
  { title: '數列規律', shortTitle: '數列規律', drafts: fromRecipes(7, [[gen.sequence, 30]]) },
  { title: '圖表數據分析', shortTitle: '圖表數據', drafts: fromRecipes(8, [[gen.chart, 30]]) },
];

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function toQuestion(draft: Draft, sectionId: string, no: number): Question {
  const answerKey = KEYS[draft.answer];
  if (!answerKey) throw new Error(`答案索引無效：${draft.stem}`);
  return {
    id: `${MATH_BANK_ID}/${sectionId}/q${no}`,
    bankId: MATH_BANK_ID,
    sectionId,
    no,
    type: 'single',
    stem: draft.stem,
    options: draft.options.map((content, index) => ({ key: KEYS[index] ?? String(index), content })),
    answer: [answerKey],
    explanation: draft.explanation,
  };
}

export function buildMathBank(): Bank {
  const sections: Section[] = [];
  const questions: Question[] = [];
  SECTIONS.forEach((spec, index) => {
    const sectionId = `s${index + 1}`;
    const drafts = spec.drafts();
    drafts.forEach((draft, i) => questions.push(toQuestion(draft, sectionId, i + 1)));
    sections.push({ id: sectionId, title: spec.title, shortTitle: spec.shortTitle, order: index + 1, questionCount: drafts.length });
  });
  const version = createHash('sha1').update(JSON.stringify(questions)).digest('hex').slice(0, 10);
  return {
    schemaVersion: 1,
    id: MATH_BANK_ID,
    title: '數學運算與數據分析（430 綜合能力評估）',
    description: '歷屆真題回憶版（已改寫並附解析）及按考點自動生成的練習題，答案均由程式計算。',
    version,
    contentFormat: 'markdown',
    explanationLabel: '解析',
    sections,
    questions,
  };
}
