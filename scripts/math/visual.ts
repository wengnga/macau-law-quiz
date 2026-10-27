import { barChart, chartImage, lineChart, pieChart } from './charts';
import { num, pct, pick, randInt, type Generated, type Rng } from './kit';

const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const QUARTERS = ['1-3月', '4-6月', '7-9月', '10-12月'];
const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);
const at = (values: number[], i: number): number => values[i] ?? 0;
const uniqueMax = (values: number[]): number => {
  const max = Math.max(...values);
  return values.filter((v) => v === max).length === 1 ? values.indexOf(max) : -1;
};

/** Grouped monthly bars, like the official sample on overtime days. */
export function overtimeBars(rng: Rng): Generated | null {
  const male = MONTHS.map(() => randInt(rng, 1, 9));
  const female = MONTHS.map(() => randInt(rng, 1, 9));
  const image = chartImage(
    barChart(
      '某機構男女員工每人每月平均加班日數',
      MONTHS,
      [
        { name: '男員工', values: male },
        { name: '女員工', values: female },
      ],
      '日',
    ),
    '男女員工每月平均加班日數柱狀圖',
  );
  const intro = `下圖為某機構去年男女員工每人每月平均加班日數：\n\n${image}\n\n`;
  const kind = randInt(rng, 0, 3);

  if (kind === 0) {
    const quarterSums = QUARTERS.map((_, q) => sum(male.slice(q * 3, q * 3 + 3)));
    const best = uniqueMax(quarterSums);
    const peakMonth = uniqueMax(male);
    if (best < 0 || peakMonth < 0 || Math.floor(peakMonth / 3) === best) return null;
    return {
      stem: `${intro}哪一個季度，男員工的總加班日數最多？`,
      correct: QUARTERS[best] ?? '',
      distractors: [QUARTERS[Math.floor(peakMonth / 3)] ?? '', ...QUARTERS],
      explanation: `把每季三個月的男員工數值相加：${QUARTERS.map((q, i) => `${q} = ${at(quarterSums, i)}`).join('，')}，最多是 ${QUARTERS[best]}。陷阱：單月最高的是 ${MONTHS[peakMonth]}（${at(male, peakMonth)} 日），但它所在的季度合計不是最多。`,
    };
  }
  if (kind === 1) {
    const total = sum(female);
    const mean = total / 12;
    if (Math.round(mean * 100) !== mean * 100) return null;
    return {
      stem: `${intro}全年計，女員工每人每月平均加班多少日？`,
      correct: num(mean),
      distractors: [num(sum(male) / 12), num(total / 4), num((Math.max(...female) + Math.min(...female)) / 2), num(mean + 0.5)],
      explanation: `女員工十二個月合計 ${total} 日，÷ 12 = ${num(mean)} 日。陷阱：不要用最高和最低的平均數 (${Math.max(...female)}+${Math.min(...female)})÷2 代替全年平均數。`,
    };
  }
  if (kind === 2) {
    const gaps = MONTHS.map((_, i) => Math.abs(at(male, i) - at(female, i)));
    const best = uniqueMax(gaps);
    const maleTop = uniqueMax(male);
    const femaleTop = uniqueMax(female);
    if (best < 0 || maleTop < 0 || femaleTop < 0 || new Set([best, maleTop, femaleTop]).size < 3) return null;
    return {
      stem: `${intro}哪一個月，男女員工的平均加班日數相差最大？`,
      correct: MONTHS[best] ?? '',
      distractors: [MONTHS[maleTop] ?? '', MONTHS[femaleTop] ?? '', ...MONTHS.filter((_, i) => i !== best)],
      explanation: `逐月計算兩者之差，${MONTHS[best]} 相差 |${at(male, best)} − ${at(female, best)}| = ${at(gaps, best)} 日，是全年最大。陷阱：男員工最高的 ${MONTHS[maleTop]} 或女員工最高的 ${MONTHS[femaleTop]}，兩者之差不一定最大。`,
    };
  }
  const higher = male.filter((v, i) => v > at(female, i)).length;
  const equal = male.filter((v, i) => v === at(female, i)).length;
  if (equal === 0) return null;
  return {
    stem: `${intro}全年有多少個月，男員工的平均加班日數高於女員工？`,
    correct: String(higher),
    distractors: [String(higher + equal), String(12 - higher), String(12 - higher - equal), String(higher + 1), String(higher - 1)],
    explanation: `逐月比較，男員工高於女員工的有 ${higher} 個月；另有 ${equal} 個月兩者相同，不能算作「高於」。`,
  };
}

/** Yearly line chart: growth-rate vs absolute-increase traps. */
export function visitorsLine(rng: Rng): Generated | null {
  const values = [randInt(rng, 20, 60)];
  for (let i = 1; i < YEARS.length; i += 1) values.push(Math.max(8, at(values, i - 1) + randInt(rng, -12, 15)));
  const place = pick(rng, ['某博物館', '某公共圖書館', '某體育中心', '某旅遊景點']);
  const image = chartImage(lineChart(`${place} 2019–2025 年參觀人次`, YEARS, [{ name: '參觀人次', values }], '萬人次'), `${place}參觀人次折線圖`);
  const intro = `下圖為${place} 2019–2025 年的參觀人次（單位：萬人次）：\n\n${image}\n\n`;
  const kind = randInt(rng, 0, 2);

  if (kind === 0) {
    const growth = YEARS.slice(1).map((_, i) => (at(values, i + 1) - at(values, i)) / at(values, i));
    const diffs = YEARS.slice(1).map((_, i) => at(values, i + 1) - at(values, i));
    const best = uniqueMax(growth);
    const bigAbs = uniqueMax(diffs);
    if (best < 0 || bigAbs < 0 || best === bigAbs || at(growth, best) <= 0) return null;
    const label = (i: number): string => `${YEARS[i + 1]} 年`;
    return {
      stem: `${intro}哪一年的參觀人次按年增長率最高？`,
      correct: label(best),
      distractors: [label(bigAbs), ...YEARS.slice(1).map((_, i) => label(i))],
      explanation: `增長率 = (當年 − 上年) ÷ 上年。${label(best)}：(${at(values, best + 1)} − ${at(values, best)}) ÷ ${at(values, best)} = ${pct(at(growth, best))}，是最高的。陷阱：增加人次最多的是 ${label(bigAbs)}（+${at(diffs, bigAbs)} 萬），但上年基數較大，增長率只有 ${pct(at(growth, bigAbs))}。`,
    };
  }
  if (kind === 1) {
    const first = at(values, 0);
    const last = at(values, YEARS.length - 1);
    if (first === last) return null;
    const change = (last - first) / first;
    return {
      stem: `${intro}與 2019 年相比，2025 年的參觀人次增加（或減少）了百分之幾？`,
      correct: pct(change),
      distractors: [pct((last - first) / last), pct(-change), pct(change / 6), pct(change + 0.1)],
      explanation: `變化率 = (${last} − ${first}) ÷ ${first} = ${pct(change)}。陷阱：基數是較早的 2019 年；若錯用 2025 年作除數，會得出 ${pct((last - first) / last)}。`,
    };
  }
  const mean = sum(values) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    stem: `${intro}2019–2025 年平均每年的參觀人次約為多少萬？`,
    correct: num(mean),
    distractors: [num(at(sorted, 3)), num((at(sorted, 0) + at(sorted, 6)) / 2), num(sum(values) / 6), num(mean + 2)],
    explanation: `七年合計 ${sum(values)} 萬，÷ 7 ≈ ${num(mean)} 萬。陷阱：中位數是 ${at(sorted, 3)}，不是平均數；2019–2025 共 7 年，不是 6 年。`,
  };
}

const ITEMS = ['人員', '設備', '租金', '培訓', '其他'];

/** Pie chart of a budget: convert shares into amounts. */
export function budgetPie(rng: Rng): Generated | null {
  const shares = [randInt(rng, 8, 11) * 5, randInt(rng, 2, 4) * 5, randInt(rng, 2, 3) * 5, randInt(rng, 1, 2) * 5];
  const rest = 100 - sum(shares);
  if (rest < 5) return null;
  shares.push(rest);
  const total = randInt(rng, 4, 16) * 100;
  const image = chartImage(pieChart(`某部門年度開支分佈（總額 ${total} 萬元）`, ITEMS, shares), '年度開支分佈圓餅圖');
  const intro = `下圖為某部門去年的開支分佈，全年開支總額為 ${total} 萬澳門元：\n\n${image}\n\n`;
  const amount = (i: number): number => (total * at(shares, i)) / 100;
  const kind = randInt(rng, 0, 2);

  if (kind === 0) {
    const i = randInt(rng, 1, 3);
    return {
      stem: `${intro}${ITEMS[i]}開支為多少萬元？`,
      correct: num(amount(i)),
      distractors: [num(at(shares, i)), ...ITEMS.map((_, j) => num(amount(j))), num(amount(i) * 10)],
      explanation: `${ITEMS[i]}佔 ${at(shares, i)}%，${total} × ${at(shares, i)}% = ${num(amount(i))} 萬元。`,
    };
  }
  if (kind === 1) {
    const diff = amount(0) - amount(3);
    return {
      stem: `${intro}人員開支比培訓開支多多少萬元？`,
      correct: num(diff),
      distractors: [num(at(shares, 0) - at(shares, 3)), num(amount(0)), num(amount(0) + amount(3)), num(diff / 2)],
      explanation: `兩者相差 ${at(shares, 0)}% − ${at(shares, 3)}% = ${at(shares, 0) - at(shares, 3)}%，${total} × ${at(shares, 0) - at(shares, 3)}% = ${num(diff)} 萬元。陷阱：${at(shares, 0) - at(shares, 3)} 只是百分點，不是金額。`,
    };
  }
  const next = amount(2) * 1.1;
  return {
    stem: `${intro}若今年開支總額比去年增加 10%，而各項比例不變，今年的租金開支為多少萬元？`,
    correct: num(next),
    distractors: [num(amount(2)), num(amount(2) + 10), num(((total + 10) * at(shares, 2)) / 100), num(amount(2) * 0.9)],
    explanation: `今年總額 = ${total} × 1.1 = ${num(total * 1.1)} 萬；租金 = ${num(total * 1.1)} × ${at(shares, 2)}% = ${num(next)} 萬元。也可以直接用去年租金 ${num(amount(2))} × 1.1。`,
  };
}
