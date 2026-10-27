import { describe, expect, it } from 'vitest';
import { choose, factorial } from './kit';
import { DATA_XINGCE, QUANTITY_XINGCE } from './xingce-real';

const ALL = [...QUANTITY_XINGCE, ...DATA_XINGCE];
const maxOf = (values: number[]) => values.reduce((a, b) => Math.max(a, b), -Infinity);
const minOf = (values: number[]) => values.reduce((a, b) => Math.min(a, b), Infinity);

function answer(stemPart: string, nth = 0): string {
  const item = ALL.filter((d) => d.stem.includes(stemPart))[nth];
  if (!item) throw new Error(`找不到題目：${stemPart}`);
  return item.options[item.answer] ?? '';
}

/** Distinct descending integer tuples within [lo, hi] summing to total — brute force for the 和定最值 items. */
function distinctTuples(count: number, total: number, lo: number, hi: number): number[][] {
  const out: number[][] = [];
  const walk = (prefix: number[], max: number, left: number) => {
    const slots = count - prefix.length;
    if (left > slots * max || left < slots * lo) return;
    if (prefix.length === count) {
      if (left === 0) out.push(prefix);
      return;
    }
    for (let v = Math.min(max, left); v >= lo; v -= 1) walk([...prefix, v], v - 1, left - v);
  };
  walk([], hi, total);
  return out;
}

describe('xingce adaptations', () => {
  it('every item has 4 distinct options, a valid answer and an explanation', () => {
    for (const d of ALL) {
      expect(d.options, d.stem).toHaveLength(4);
      expect(new Set(d.options).size, d.stem).toBe(4);
      expect(d.options[d.answer], d.stem).toBeDefined();
      expect(d.explanation.length, d.stem).toBeGreaterThan(20);
    }
    expect(new Set(ALL.map((d) => d.stem)).size).toBe(ALL.length);
  });

  it('answer positions are spread out', () => {
    const counts = [0, 0, 0, 0];
    ALL.forEach((d) => (counts[d.answer] = (counts[d.answer] ?? 0) + 1));
    expect(Math.max(...counts) / ALL.length).toBeLessThan(0.45);
  });

  it('sum-fixed extremes match brute force', () => {
    const passing = distinctTuples(5, 340, 60, 100);
    expect(answer('最高分最多')).toBe(String(maxOf(passing.map((t) => t[0] ?? 0))));
    expect(answer('排名第三的人最多')).toBe(String(maxOf(passing.map((t) => t[2] ?? 0))));
    const any = distinctTuples(5, 340, 0, 100);
    expect(answer('最高分最少')).toBe(String(minOf(any.map((t) => t[0] ?? 0))));
    const withLow = distinctTuples(5, 440, 75, 100).filter((t) => t[4] === 75);
    expect(answer('排第二名的職員至少')).toBe(String(minOf(withLow.map((t) => t[1] ?? 0))));
    const groups = distinctTuples(5, 100, 12, 100);
    expect(answer('人數第二多的組最多')).toBe(String(maxOf(groups.map((t) => t[1] ?? 0))));
    const unis = distinctTuples(5, 200, 1, 200).filter((t) => t[0] === 2 * (t[4] ?? 0));
    expect(answer('A 大學至少')).toBe(String(minOf(unis.map((t) => t[4] ?? 0))));
  });

  it('worst-case and voting answers', () => {
    let votes = 0;
    while (18 + votes <= 12 + (40 - votes)) votes += 1;
    expect(answer('保證當選')).toBe(String(votes));
    const majors = [28, 22, 18, 12, 8];
    expect(answer('15 人的專業相同')).toBe(String(majors.reduce((s, c) => s + Math.min(c, 14), 0) + 1));
  });

  it('set, bottle, profit and work answers', () => {
    expect(answer('兩項都參加的人數是')).toBe('15');
    expect(answer('三門都沒報')).toBe(String(40 - (18 + 15 + 12 - 8 - 2 * 3)));

    const drink = (bought: number, k: number) => {
      let total = bought;
      let empty = bought;
      while (empty >= k) {
        const extra = Math.floor(empty / k);
        total += extra;
        empty = (empty % k) + extra;
      }
      return total;
    };
    expect(answer('25 瓶汽水')).toBe(String(drink(25, 4)));
    let buy = 1;
    while (drink(buy, 3) < 31) buy += 1;
    expect(answer('31 人外出')).toBe(String(buy));

    const best = Math.max(...Array.from({ length: 41 }, (_, x) => (40 - x) * (20 + 2 * x)));
    expect(answer('每天最大利潤')).toBe(String(best));
    const revenue = Array.from({ length: 40 }, (_, x) => (30 + x) * (600 - 15 * x));
    expect(answer('銷售額最大')).toBe(String(30 + revenue.indexOf(Math.max(...revenue))));

    for (let rest = 0; rest <= 12; rest += 1) {
      if (3 * (14 - rest) + 2 * 12 === 60) expect(answer('甲隊休息了幾天')).toBe(String(rest));
    }
    expect(answer('提前了幾天')).toBe(String(12 - (2 + (48 - 8) / 5)));
  });

  it('number-property and counting answers', () => {
    expect(answer('乙站不涉及交通')).toBe(String((150 - 100) * 0.8));
    for (let total = 2; total < 100; total += 1) {
      for (let women = 0; women <= total; women += 1) {
        const men = total - women;
        if (men === 2 * (women - 6) && women - 6 === 3 * (men - 10)) expect(answer('會議室裏有若干人')).toBe(String(total));
      }
    }
    const squares = ['169', '196', '200', '256'].filter((v) => Number.isInteger(Math.sqrt(Number(v))) && Number(v) > 180 && Number(v) <= 225);
    expect(squares).toEqual([answer('組數與每組人數')]);
    for (let wang = 1; wang < 31; wang += 1)
      for (let li = 1; li < wang; li += 1)
        for (let zhang = 1; zhang < li; zhang += 1) {
          const zhou = 31 - wang - li - zhang;
          if (zhou >= 1 && zhou < zhang && wang === li + zhang && li === zhang + zhou) expect(answer('共捐了 31 箱')).toBe(String(wang));
        }
    expect(answer('兩側都要種樹')).toBe(String((600 / 15 + 1) * 2));
    expect(answer('圓形水塘')).toBe(String((480 / 12) * 2));
    expect(answer('最外層共有 44 人')).toBe(String((44 / 4 + 1) ** 2));
    expect(answer('1 男 1 女')).toBe('3/5');
    expect(answer('10 份相同的資料')).toBe(String(choose(9, 3)));
    expect(answer('必須相鄰')).toBe(String(2 * factorial(4)));
    expect(answer('不能相鄰')).toBe(String(factorial(5) - 2 * factorial(4)));
    expect(answer('第 2026 張')).toBe(['紅', '黃', '藍', '綠', '白'][(2026 - 1) % 5]);
    for (let right = 0; right <= 20; right += 1) if (5 * right - 2 * (20 - right) === 65) expect(answer('小李得了 65 分')).toBe(String(right));
  });

  it('travel, age and concentration answers', () => {
    expect(answer('第二次相遇時距 B 地')).toBe(String(3 * 600 - 400));
    expect(answer('順水每小時')).toBe(String((24 - 16) / 2));
    const growth = (10 * 20 - 15 * 10) / (20 - 10);
    expect(answer('25 個閘口')).toBe(String((10 * 20 - growth * 20) / (25 - growth)));
    const valid = ['30', '32', '36', '42'].filter((m) => {
      const mother = Number(m);
      const daughter = mother / 4;
      const gap = mother - daughter;
      return Number.isInteger(daughter) && Number.isInteger(gap / 2) && Number.isInteger(gap / 1);
    });
    expect(valid).toEqual([answer('今年母親的年齡')]);
    expect(answer('倒出 1/4')).toBe(`${20 * 0.75 * 0.75}%`);
    expect(answer('配成濃度 22%')).toBe(String((500 * (30 - 22)) / (30 - 10)));
  });

  it('data-analysis answers', () => {
    const visitors = { 內地: [2431.0, 10.5], 香港: [697.6, 9.0], 台灣: [121.6, 28.0], 國際: [236.5, 10.0] } as const;
    const now = Object.values(visitors).reduce((s, [v]) => s + v, 0);
    const base = Object.values(visitors).reduce((s, [v, r]) => s + v / (1 + r / 100), 0);
    expect(now).toBeCloseTo(3486.7, 1);
    expect((now / base - 1) * 100).toBeCloseTo(10.7, 1);
    const rising = Object.entries(visitors).filter(([, [v, r]]) => v / now > v / (1 + r / 100) / base);
    expect(rising.map(([name]) => `${name}旅客`)).toEqual([answer('比重比上年上升的是')]);
    expect(697.6 / (1 + 0.09) / base).toBeGreaterThan(0.2);

    expect((((3500 / 4000) * (5.8 - 5.2)) / 105.8) * 100).toBeCloseTo(0.5, 1);
    expect(Math.round(((14000 / 2990) * 0.963) / 1.009 * 10) / 10).toBe(Number(answer('甲類進口量約是乙類')));
    expect((1.25 * 0.88).toFixed(2)).toBe(answer('今年銷量約是前年'));
    expect(`${Math.round((1.26 / 1.4 - 1) * 100)}%`.replace('-', '−')).toBe(answer('上年 1–5 月比前年同期'));
    expect(((600e8 / 2000e4) * 1.25) / 1.5).toBe(Number(answer('上年同期平均每位旅客').replace(',', '')));
    expect(`${((0.5 - 0.25) / 1.25) * 100}%`).toBe(answer('平均每位旅客的旅遊收入比上年同期增長'));
    expect(`${(((1000 - 300) / (1000 / 1.1 - 300 / 1.02) - 1) * 100).toFixed(1)}%`).toBe(answer('除住宅按揭以外'));
    expect(((120 * 52 + 100 * 58) / 220).toFixed(1)).toBe(answer('兩年合計的平均價格'));
    expect(`${Math.round(((2.0 / 1.8) * 1.08 - 1) * 100)}%`).toBe(answer('本澳論文數比上年增長'));
  });
});
