import { pick, randInt, type Generated, type Rng } from './kit';

interface Rule {
  /** Formula shown in the explanation, written in terms of a and b. */
  formula: string;
  apply: (a: number, b: number) => number;
  /** The same formula with numbers substituted, e.g. `8×5÷2`. */
  show: (a: number, b: number) => string;
}

/** Candidate rules; a question is only kept when exactly one of them fits all three examples. */
export const RULES: Rule[] = [
  {
    formula: 'a×b÷2',
    apply: (a, b) => (a * b) / 2,
    show: (a, b) => `${a}×${b}÷2`,
  },
  {
    formula: 'a×b−a',
    apply: (a, b) => a * b - a,
    show: (a, b) => `${a}×${b}−${a}`,
  },
  {
    formula: 'a×b+b',
    apply: (a, b) => a * b + b,
    show: (a, b) => `${a}×${b}+${b}`,
  },
  {
    formula: 'a×b+1',
    apply: (a, b) => a * b + 1,
    show: (a, b) => `${a}×${b}+1`,
  },
  {
    formula: 'a×b−(a+b)',
    apply: (a, b) => a * b - (a + b),
    show: (a, b) => `${a}×${b}−(${a}+${b})`,
  },
  {
    formula: 'a×b+a+b',
    apply: (a, b) => a * b + a + b,
    show: (a, b) => `${a}×${b}+${a}+${b}`,
  },
  { formula: 'a²−b', apply: (a, b) => a * a - b, show: (a, b) => `${a}²−${b}` },
  { formula: 'a²+b', apply: (a, b) => a * a + b, show: (a, b) => `${a}²+${b}` },
  {
    formula: '(a+b)×2',
    apply: (a, b) => (a + b) * 2,
    show: (a, b) => `(${a}+${b})×2`,
  },
  {
    formula: '2a+b',
    apply: (a, b) => 2 * a + b,
    show: (a, b) => `2×${a}+${b}`,
  },
  {
    formula: '3a−b',
    apply: (a, b) => 3 * a - b,
    show: (a, b) => `3×${a}−${b}`,
  },
  {
    formula: '(a+b)×(a−b)',
    apply: (a, b) => (a + b) * (a - b),
    show: (a, b) => `(${a}+${b})×(${a}−${b})`,
  },
];

const SYMBOLS = ['∆', '⊕', '★', '◎'];

type Pair = [number, number];

function fits(rule: Rule, pairs: Pair[]): boolean {
  return pairs.every(([a, b]) => {
    const value = rule.apply(a, b);
    return Number.isInteger(value) && value > 0;
  });
}

/** Like the official sample: ∆(3,4)=6, ∆(5,6)=15, ∆(4,7)=14 → find ∆(8,5). */
export function definedOperation(rng: Rng): Generated | null {
  const rule = pick(rng, RULES);
  const pairs: Pair[] = [];
  while (pairs.length < 4) {
    const pair: Pair = [randInt(rng, 2, 9), randInt(rng, 2, 9)];
    if (pair[0] !== pair[1] && !pairs.some(([a, b]) => a === pair[0] && b === pair[1])) pairs.push(pair);
  }
  if (!fits(rule, pairs)) return null;
  const examples = pairs.slice(0, 3);
  const [qa, qb] = pairs[3] as Pair;
  const result = (r: Rule, [a, b]: Pair): number => r.apply(a, b);

  const matching = RULES.filter((r) => examples.every((pair) => result(r, pair) === result(rule, pair)));
  if (matching.length !== 1) return null;

  const answer = rule.apply(qa, qb);
  const firstOnly = RULES.find((r) => r !== rule && result(r, examples[0] as Pair) === result(rule, examples[0] as Pair));
  const others = RULES.filter((r) => r !== rule)
    .map((r) => r.apply(qa, qb))
    .filter((value) => Number.isInteger(value) && value > 0 && value !== answer);
  const distractors = [...(firstOnly ? [firstOnly.apply(qa, qb)] : []), rule.apply(qb, qa), ...others.sort(() => rng() - 0.5), answer + 2, answer - 2]
    .filter((value) => Number.isInteger(value) && value > 0 && value !== answer)
    .map(String);

  const symbol = pick(rng, SYMBOLS);
  const call = ([a, b]: Pair): string => `${symbol}(${a},${b})`;
  const stem = `如果 ${examples.map((pair) => `${call(pair)} = ${result(rule, pair)}`).join('，')}，那麼 ${call([qa, qb])} = ？`;
  const checks = examples.map(([a, b]) => `${rule.show(a, b)} = ${rule.apply(a, b)}`).join('；');
  const trapFirst = firstOnly ? `陷阱：只看第一個例子，「${firstOnly.formula}」也成立，但它不符合後兩個例子，所以每條規律都要用全部例子驗證。` : '';
  const trapOrder = rule.apply(qb, qa) !== answer ? `另外要注意 a、b 的次序，對調後會得出 ${rule.apply(qb, qa)}。` : '';
  return {
    stem,
    correct: String(answer),
    distractors,
    explanation: `規律是 ${symbol}(a,b) = ${rule.formula}。驗證：${checks}。所以 ${call([qa, qb])} = ${rule.show(qa, qb)} = ${answer}。${trapFirst}${trapOrder}`,
  };
}
