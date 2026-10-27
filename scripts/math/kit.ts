/** A drafted question before ids/keys are assigned. */
export interface Draft {
  stem: string;
  /** Option texts; `answer` indexes into this list. */
  options: string[];
  answer: number;
  explanation: string;
}

/** Generated question: the correct value plus plausible wrong values (usually common mistakes). */
export interface Generated {
  stem: string;
  correct: string;
  distractors: string[];
  explanation: string;
}

export type Rng = () => number;

/** Deterministic PRNG so question ids and contents stay stable across builds. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick: empty list');
  return item;
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Up to 2 decimals, trailing zeros removed. */
export function num(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function pct(value: number, digits = 1): string {
  return `${String(Math.round(value * 100 * 10 ** digits) / 10 ** digits)}%`;
}

export function fraction(numerator: number, denominator: number): string {
  const divisor = gcd(numerator, denominator);
  const n = numerator / divisor;
  const d = denominator / divisor;
  return d === 1 ? String(n) : `${n}/${d}`;
}

export function ratio(...parts: number[]): string {
  const divisor = parts.reduce((acc, part) => gcd(acc, part));
  return parts.map((part) => part / divisor).join(':');
}

export function hoursMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (hours === 0) return `${minutes} 分鐘`;
  return minutes === 0 ? `${hours} 小時` : `${hours} 小時 ${minutes} 分`;
}

export function minutesSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  if (minutes === 0) return `${seconds} 秒`;
  return seconds === 0 ? `${minutes} 分鐘` : `${minutes} 分 ${seconds} 秒`;
}

export function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

/**
 * Builds 4 distinct options, or null when fewer than 3 distinct distractors exist.
 * Options are not sorted: distractors cluster around the answer, so sorting would make the answer position guessable.
 */
export function toDraft(generated: Generated, rng: Rng): Draft | null {
  const wrong: string[] = [];
  for (const candidate of generated.distractors) {
    if (candidate !== generated.correct && !wrong.includes(candidate)) wrong.push(candidate);
    if (wrong.length === 3) break;
  }
  if (wrong.length < 3) return null;

  const options = [...wrong];
  options.splice(Math.floor(rng() * 4), 0, generated.correct);
  return {
    stem: generated.stem,
    options,
    answer: options.indexOf(generated.correct),
    explanation: generated.explanation,
  };
}

/** Collects up to `count` questions with distinct stems from a generator. */
export function collect(count: number, seed: number, make: (rng: Rng) => Generated | null): Draft[] {
  const rng = createRng(seed);
  const drafts: Draft[] = [];
  const stems = new Set<string>();
  for (let tries = 0; drafts.length < count && tries < count * 200; tries += 1) {
    const generated = make(rng);
    if (!generated || stems.has(generated.stem)) continue;
    const draft = toDraft(generated, rng);
    if (!draft) continue;
    stems.add(generated.stem);
    drafts.push(draft);
  }
  if (drafts.length < count) throw new Error(`題目生成不足：需要 ${count}，只得到 ${drafts.length}`);
  return drafts;
}
