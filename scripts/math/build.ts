import { createHash } from 'node:crypto';
import type { Bank, Question, Section } from '../../src/domain/types';
import * as gen from './generators';
import { collect, type Draft, type Generated, type Rng } from './kit';
import { definedOperation } from './operations';
import { PAST_QUESTIONS } from './past';
import { budgetPie, overtimeBars, visitorsLine } from './visual';
import { DATA_XINGCE, QUANTITY_XINGCE } from './xingce-real';

export const MATH_BANK_ID = 'macau-math';

type Recipe = [make: (rng: Rng) => Generated | null, count: number];

interface SectionSpec {
  /** Fixed so saved progress survives reordering; the list below is in display order. */
  id: string;
  title: string;
  shortTitle: string;
  drafts: () => Draft[];
}

/** Each recipe gets its own fixed seed, so adding a recipe never reshuffles existing questions. */
function fromRecipes(seedBase: number, recipes: Recipe[]): () => Draft[] {
  return () => recipes.flatMap(([make, count], index) => collect(count, seedBase * 100 + index, make));
}

/**
 * Generated sections keep only a few warm-up questions per template; reducing a count keeps the first questions
 * (and their ids) unchanged. s11 and s12 were generated drafts that never shipped — never reuse those ids.
 */
const SECTIONS: SectionSpec[] = [
  { id: 's1', title: '歷屆真題（回憶版）', shortTitle: '歷屆真題', drafts: () => PAST_QUESTIONS },
  { id: 's13', title: '數量關係（行測真題改編）', shortTitle: '數量關係（行測）', drafts: () => QUANTITY_XINGCE },
  { id: 's14', title: '資料分析（行測真題改編：比重、增長率、平均數）', shortTitle: '資料分析（行測）', drafts: () => DATA_XINGCE },
  {
    id: 's2',
    title: '工程與合作問題',
    shortTitle: '工程與合作',
    drafts: fromRecipes(2, [
      [gen.workTogether, 2],
      [gen.workJoinLater, 2],
      [gen.pipes, 2],
    ]),
  },
  {
    id: 's3',
    title: '行程問題（追及、相遇、過隧道、平均速度）',
    shortTitle: '行程問題',
    drafts: fromRecipes(3, [
      [gen.chase, 2],
      [gen.meet, 2],
      [gen.trainTunnel, 2],
      [gen.roundTrip, 2],
    ]),
  },
  {
    id: 's4',
    title: '百分比與比例（增長率、基準值陷阱、利潤）',
    shortTitle: '百分比與比例',
    drafts: fromRecipes(4, [
      [gen.upThenDown, 2],
      [gen.ratioChange, 2],
      [gen.baseYear, 2],
      [gen.profit, 2],
      [gen.successivePct, 2],
    ]),
  },
  {
    id: 's5',
    title: '機率與排列組合',
    shortTitle: '機率與排列組合',
    drafts: fromRecipes(5, [
      [gen.sameColour, 2],
      [gen.atLeastOne, 2],
      [gen.arrangement, 2],
      [gen.committee, 2],
    ]),
  },
  {
    id: 's6',
    title: '平均數與中位數',
    shortTitle: '平均數與中位數',
    drafts: fromRecipes(6, [
      [gen.medianExtreme, 3],
      [gen.newcomer, 2],
      [gen.weightedMean, 2],
    ]),
  },
  { id: 's7', title: '數列規律', shortTitle: '數列規律', drafts: fromRecipes(7, [[gen.sequence, 10]]) },
  { id: 's10', title: '定義運算（從例子找出規律）', shortTitle: '定義運算', drafts: fromRecipes(10, [[definedOperation, 8]]) },
  { id: 's8', title: '圖表數據分析（表格）', shortTitle: '圖表數據（表格）', drafts: fromRecipes(8, [[gen.chart, 8]]) },
  {
    id: 's9',
    title: '圖表數據分析（看圖：柱狀圖、折線圖、圓餅圖）',
    shortTitle: '圖表數據（看圖）',
    drafts: fromRecipes(9, [
      [overtimeBars, 4],
      [visitorsLine, 3],
      [budgetPie, 3],
    ]),
  },
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
    const sectionId = spec.id;
    const drafts = spec.drafts();
    drafts.forEach((draft, i) => questions.push(toQuestion(draft, sectionId, i + 1)));
    sections.push({ id: sectionId, title: spec.title, shortTitle: spec.shortTitle, order: index + 1, questionCount: drafts.length });
  });
  const version = createHash('sha1').update(JSON.stringify(questions)).digest('hex').slice(0, 10);
  return {
    schemaVersion: 1,
    id: MATH_BANK_ID,
    title: '數理邏輯及圖表數據分析（綜合能力評估）',
    description: '歷屆真題回憶版、行測真題改編（數量關係、資料分析），以及少量按考點生成的熱身題；逐題附解析，答案均經程式驗算。',
    version,
    contentFormat: 'markdown',
    explanationLabel: '解析',
    sections,
    questions,
  };
}
