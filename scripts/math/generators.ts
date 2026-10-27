import {
  choose,
  factorial,
  fraction,
  hoursMinutes,
  minutesSeconds,
  num,
  pct,
  pick,
  randInt,
  ratio,
  type Generated,
  type Rng,
} from './kit';

const PEOPLE = [
  ['甲', '乙'],
  ['陳先生', '李小姐'],
  ['小王', '小張'],
] as const;

// ---------- 工程與合作 ----------

export function workTogether(rng: Rng): Generated | null {
  const a = randInt(rng, 3, 15);
  const b = randInt(rng, a + 1, 30);
  const minutes = (60 * a * b) / (a + b);
  if (!Number.isInteger(minutes)) return null;
  const [p, q] = pick(rng, PEOPLE);
  const task = pick(rng, ['整理一批檔案', '錄入一批資料', '油漆一間課室', '完成一項維修工程']);
  return {
    stem: `${p}獨自${task}需 ${a} 小時，${q}獨自完成需 ${b} 小時。兩人合作，需時多久？`,
    correct: hoursMinutes(minutes),
    distractors: [
      hoursMinutes(((a + b) / 2) * 60),
      hoursMinutes((60 * a * b) / Math.max(b - a, 1)),
      hoursMinutes(minutes + 60),
      hoursMinutes(minutes - 30),
    ],
    explanation: `效率相加：每小時完成 1/${a} + 1/${b} = ${fraction(a + b, a * b)}，所以需 ${fraction(a * b, a + b)} 小時 = ${hoursMinutes(minutes)}。陷阱：不能取兩人時間的平均數。`,
  };
}

export function workJoinLater(rng: Rng): Generated | null {
  const a = randInt(rng, 6, 16);
  const b = randInt(rng, 6, 24);
  const head = randInt(rng, 1, Math.min(4, a - 2));
  const restMinutes = (60 * (a - head) * b) / (a + b);
  if (!Number.isInteger(restMinutes) || a === b) return null;
  const [p, q] = pick(rng, PEOPLE);
  const total = head * 60 + restMinutes;
  return {
    stem: `${p}獨自完成一項工作需 ${a} 小時，${q}獨自完成需 ${b} 小時。${p}先做 ${head} 小時後，${q}加入一起做到完成。由開始到完成共需多少時間？`,
    correct: hoursMinutes(total),
    distractors: [
      hoursMinutes(restMinutes),
      hoursMinutes((60 * a * b) / (a + b)),
      hoursMinutes((60 * a * b) / (a + b) + head * 60),
      hoursMinutes(total + 30),
    ],
    explanation: `${p}先做 ${head} 小時完成 ${fraction(head, a)}，剩 ${fraction(a - head, a)}。合作效率 1/${a} + 1/${b} = ${fraction(a + b, a * b)}，剩餘部分需 ${hoursMinutes(restMinutes)}。總共 ${head} 小時 + ${hoursMinutes(restMinutes)} = ${hoursMinutes(total)}。陷阱：別忘了加上先做的 ${head} 小時。`,
  };
}

export function pipes(rng: Rng): Generated | null {
  const fill = randInt(rng, 2, 12);
  const drain = randInt(rng, fill + 1, 24);
  const minutes = (60 * fill * drain) / (drain - fill);
  if (!Number.isInteger(minutes) || minutes > 24 * 60) return null;
  return {
    stem: `一個水池，單開進水管 ${fill} 小時可注滿，單開排水管 ${drain} 小時可排空。兩管同時打開，空池需多少時間才能注滿？`,
    correct: hoursMinutes(minutes),
    distractors: [
      hoursMinutes((60 * fill * drain) / (fill + drain)),
      hoursMinutes((drain - fill) * 60),
      hoursMinutes(((fill + drain) / 2) * 60),
      hoursMinutes(minutes + 60),
    ],
    explanation: `淨效率 = 進水 − 排水 = 1/${fill} − 1/${drain} = ${fraction(drain - fill, fill * drain)}，需 ${fraction(fill * drain, drain - fill)} 小時 = ${hoursMinutes(minutes)}。陷阱：排水是「減」不是「加」。`,
  };
}

// ---------- 行程 ----------

export function chase(rng: Rng): Generated | null {
  const slow = pick(rng, [50, 60, 70, 75, 80, 90]);
  const fast = randInt(rng, 12, 30) * 10;
  const head = randInt(rng, 4, 20);
  const catchUp = (slow * head) / (fast - slow);
  if (!Number.isInteger(catchUp) || fast <= slow) return null;
  return {
    stem: `甲以每分鐘 ${slow} 米步行出發，${head} 分鐘後乙以每分鐘 ${fast} 米從同一地點沿同一方向騎單車追趕。乙出發後幾分鐘追上甲？`,
    correct: `${catchUp} 分鐘`,
    distractors: [
      `${catchUp + head} 分鐘`,
      `${num((fast * head) / (fast - slow))} 分鐘`,
      `${num((slow * head) / (fast + slow))} 分鐘`,
      `${catchUp + 2} 分鐘`,
    ],
    explanation: `乙出發時，甲已領先 ${slow} × ${head} = ${slow * head} 米。追及時間 = 距離差 ÷ 速度差 = ${slow * head} ÷ (${fast} − ${slow}) = ${catchUp} 分鐘。陷阱：題目問的是乙出發後的時間，不是由甲出發起計（${catchUp + head} 分鐘）。`,
  };
}

export function meet(rng: Rng): Generated | null {
  const v1 = randInt(rng, 6, 12) * 5;
  const v2 = randInt(rng, 6, 16) * 5;
  const hours = randInt(rng, 2, 6) / 2;
  if (v1 === v2) return null;
  const distance = (v1 + v2) * hours;
  const firstPart = v1 * hours;
  return {
    stem: `A、B 兩地相距 ${num(distance)} 公里。甲車由 A 地以時速 ${v1} 公里、乙車由 B 地以時速 ${v2} 公里同時相向而行。相遇時甲車行駛了多少公里？`,
    correct: `${num(firstPart)} 公里`,
    distractors: [
      `${num(distance / 2)} 公里`,
      `${num(v2 * hours)} 公里`,
      `${num(Math.abs(v1 - v2) * hours)} 公里`,
      `${num(firstPart + 10)} 公里`,
    ],
    explanation: `相遇時間 = 總距離 ÷ 速度和 = ${num(distance)} ÷ (${v1} + ${v2}) = ${num(hours)} 小時。甲行駛 ${v1} × ${num(hours)} = ${num(firstPart)} 公里。也可用速度比直接分配：${num(distance)} × ${v1}/${v1 + v2}。`,
  };
}

export function trainTunnel(rng: Rng): Generated | null {
  const speedMs = pick(rng, [15, 20, 25, 30, 40]);
  const train = randInt(rng, 5, 20) * 20;
  const tunnel = randInt(rng, 5, 40) * 100;
  const seconds = (train + tunnel) / speedMs;
  if (!Number.isInteger(seconds)) return null;
  const kmh = speedMs * 3.6;
  return {
    stem: `一列長 ${train} 米的火車以時速 ${kmh} 公里通過一條長 ${tunnel} 米的隧道。由車頭進入隧道到車尾完全離開，需時多少？`,
    correct: minutesSeconds(seconds),
    distractors: [
      minutesSeconds(tunnel / speedMs),
      minutesSeconds((tunnel - train) / speedMs),
      minutesSeconds((train + tunnel) / (speedMs * 2)),
      minutesSeconds(seconds + 20),
    ],
    explanation: `時速 ${kmh} 公里 = 每秒 ${speedMs} 米（÷ 3.6）。火車要走「隧道長 + 車長」= ${tunnel} + ${train} = ${train + tunnel} 米，需 ${train + tunnel} ÷ ${speedMs} = ${seconds} 秒 = ${minutesSeconds(seconds)}。陷阱：漏加車長。`,
  };
}

export function roundTrip(rng: Rng): Generated | null {
  const v1 = randInt(rng, 4, 18) * 5;
  const v2 = randInt(rng, 4, 18) * 5;
  const average = (2 * v1 * v2) / (v1 + v2);
  if (v1 === v2 || !Number.isInteger(average)) return null;
  return {
    stem: `某人駕車由甲地到乙地，去程時速 ${v1} 公里，回程沿原路時速 ${v2} 公里。整個來回的平均時速是多少公里？`,
    correct: num(average),
    distractors: [num((v1 + v2) / 2), num((v1 * v2) / (v1 + v2)), num(average + 2), num(average - 3)],
    explanation: `平均速度 = 總路程 ÷ 總時間。設單程 S：總時間 = S/${v1} + S/${v2}，平均 = 2S ÷ (S/${v1} + S/${v2}) = 2 × ${v1} × ${v2} ÷ (${v1} + ${v2}) = ${num(average)}。陷阱：不是 (${v1} + ${v2}) ÷ 2 = ${num((v1 + v2) / 2)}。`,
  };
}

// ---------- 百分比與比例 ----------

export function upThenDown(rng: Rng): Generated | null {
  const price = pick(rng, [200, 400, 500, 800, 1000, 1200, 1500, 2000, 2500]);
  const rate = pick(rng, [10, 20, 25, 30, 40, 50]);
  const upFirst = rng() < 0.5;
  const final = price * (1 + rate / 100) * (1 - rate / 100);
  const order = upFirst ? `先加價 ${rate}%，再減價 ${rate}%` : `先減價 ${rate}%，再加價 ${rate}%`;
  return {
    stem: `某商品原價 ${price} 元，${order}。現價是多少元？`,
    correct: num(final),
    distractors: [num(price), num(price * (1 + (rate / 100) ** 2)), num(price * (1 - rate / 100)), num(price * (1 + rate / 100))],
    explanation: `現價 = ${price} × (1 + ${rate}%) × (1 − ${rate}%) = ${price} × (1 − ${num((rate / 100) ** 2)}) = ${num(final)}。先加後減或先減後加結果相同，都比原價低 (${rate}%)² = ${num(rate ** 2 / 100)}%。陷阱：以為「加減相同百分比 = 不變」。`,
  };
}

export function ratioChange(rng: Rng): Generated | null {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 9);
  const up = pick(rng, [10, 20, 25, 50]);
  const down = pick(rng, [10, 20, 25, 50]);
  if (a === b || ratio(a, b) !== `${a}:${b}`) return null;
  const correct = ratio(a * (100 + up), b * (100 - down));
  return {
    stem: `某部門男、女職員人數之比為 ${a}:${b}。男職員增加 ${up}%、女職員減少 ${down}% 後，男女人數之比為多少？`,
    correct,
    distractors: [
      ratio(a * (100 - down), b * (100 + up)),
      `${a}:${b}`,
      ratio(a * 100 + up, b * 100 - down),
      ratio(a * (100 + up), b * 100),
    ],
    explanation: `男 ${a} × (1 + ${up}%) = ${num((a * (100 + up)) / 100)}，女 ${b} × (1 − ${down}%) = ${num((b * (100 - down)) / 100)}，化簡得 ${correct}。`,
  };
}

export function baseYear(rng: Rng): Generated | null {
  const rate = pick(rng, [5, 10, 20, 25, 40, 50, 60]);
  const base = randInt(rng, 10, 90) * 20;
  const now = (base * (100 + rate)) / 100;
  if (!Number.isInteger(now)) return null;
  const subject = pick(rng, ['某部門今年收到的申請', '某館今年的入場人次', '某公司今年的營業額（萬元）']);
  return {
    stem: `${subject}為 ${now}，比去年增長了 ${rate}%。去年是多少？`,
    correct: num(base),
    distractors: [num(now * (1 - rate / 100)), num(now - rate), num(now / (1 - rate / 100)), num(base + 20)],
    explanation: `增長率的基數是「去年」：去年 × (1 + ${rate}%) = ${now}，去年 = ${now} ÷ ${num(1 + rate / 100)} = ${num(base)}。陷阱：直接用 ${now} × (1 − ${rate}%) = ${num(now * (1 - rate / 100))}，基數用錯了。`,
  };
}

export function profit(rng: Rng): Generated | null {
  const cost = randInt(rng, 4, 40) * 50;
  const markup = pick(rng, [20, 25, 30, 40, 50, 60]);
  const discount = pick(rng, [10, 15, 20, 25]);
  const sell = (cost * (100 + markup) * (100 - discount)) / 10000;
  if (!Number.isInteger(sell)) return null;
  const gain = sell - cost;
  return {
    stem: `某商品成本 ${cost} 元，按成本加 ${markup}% 定價，後來以定價減 ${discount}% 出售。每件賺多少元？`,
    correct: num(gain),
    distractors: [num((cost * (markup - discount)) / 100), num(sell), num((cost * markup) / 100), num(gain + 10)],
    explanation: `定價 = ${cost} × ${num(1 + markup / 100)} = ${num((cost * (100 + markup)) / 100)}，售價 = 定價 × ${num(1 - discount / 100)} = ${num(sell)}，利潤 = ${num(sell)} − ${cost} = ${num(gain)}。陷阱：不能直接用 ${markup}% − ${discount}%，因為減價的基數是定價而非成本。`,
  };
}

export function successivePct(rng: Rng): Generated | null {
  const first = pick(rng, [10, 20, 25, 30, 50]);
  const second = pick(rng, [10, 20, 30, 40, 50]);
  const total = (1 + first / 100) * (1 + second / 100) - 1;
  return {
    stem: `某項目的經費第一年增加 ${first}%，第二年再在第一年的基礎上增加 ${second}%。兩年合共增加了百分之幾？`,
    correct: pct(total),
    distractors: [pct((first + second) / 100), pct((first * second) / 10000), pct(total + 0.05), pct((first + second) / 200)],
    explanation: `(1 + ${first}%) × (1 + ${second}%) = ${num(1 + total)}，即增加 ${pct(total)}。比直接相加 ${first + second}% 多出 ${first}% × ${second}% = ${num((first * second) / 100)}%，因為第二年的基數已變大。`,
  };
}

// ---------- 機率與排列組合 ----------

export function sameColour(rng: Rng): Generated | null {
  const red = randInt(rng, 2, 7);
  const white = randInt(rng, 2, 6);
  const total = red + white;
  const ways = choose(red, 2) + choose(white, 2);
  const all = choose(total, 2);
  return {
    stem: `袋中有 ${red} 個紅球、${white} 個白球。不放回地隨機抽出 2 個，兩球同色的機率是多少？`,
    correct: fraction(ways, all),
    distractors: [
      fraction(red * red + white * white, total * total),
      fraction(all - ways, all),
      fraction(red, total),
      fraction(choose(red, 2), all),
    ],
    explanation: `共 C(${total},2) = ${all} 種抽法。兩紅 C(${red},2) = ${choose(red, 2)}，兩白 C(${white},2) = ${choose(white, 2)}，機率 = ${ways}/${all}${fraction(ways, all) === `${ways}/${all}` ? '' : ` = ${fraction(ways, all)}`}。陷阱：「不放回」不能用 (${red}/${total})² + (${white}/${total})²。`,
  };
}

export function atLeastOne(rng: Rng): Generated | null {
  if (rng() < 0.5) {
    const p = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    const q = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    const answer = 1 - (1 - p) * (1 - q);
    return {
      stem: `甲、乙兩人獨立地解同一道題，甲解出的機率為 ${p}，乙為 ${q}。這道題被解出的機率是多少？`,
      correct: num(answer),
      distractors: [num(p + q), num(p * q), num((1 - p) * (1 - q)), num(Math.max(p, q))],
      explanation: `「至少一人解出」= 1 − 兩人都解不出 = 1 − (1 − ${p})(1 − ${q}) = 1 − ${num((1 - p) * (1 - q))} = ${num(answer)}。陷阱：直接相加 ${p} + ${q}。`,
    };
  }
  const n = randInt(rng, 2, 5);
  const den = pick(rng, [2, 3, 4, 5, 6]);
  const fail = (den - 1) ** n;
  const all = den ** n;
  return {
    stem: `某人每次射擊命中的機率為 1/${den}，各次互不影響。連續射擊 ${n} 次，至少命中一次的機率是多少？`,
    correct: fraction(all - fail, all),
    distractors: [fraction(n, den), fraction(1, all), fraction(fail, all), fraction(n * (den - 1) ** (n - 1), all)],
    explanation: `「至少一次」用補集：1 − 全部不中 = 1 − (${den - 1}/${den})^${n} = 1 − ${fail}/${all} = ${fraction(all - fail, all)}。`,
  };
}

export function arrangement(rng: Rng): Generated | null {
  const n = randInt(rng, 4, 7);
  const kind = randInt(rng, 0, 2);
  const all = factorial(n);
  const adjacent = 2 * factorial(n - 1);
  if (kind === 0) {
    return {
      stem: `${n} 人排成一行拍照，其中甲、乙兩人必須相鄰。共有多少種排法？`,
      correct: String(adjacent),
      distractors: [String(factorial(n - 1)), String(all), String(all - adjacent), String(adjacent * 2)],
      explanation: `把甲乙「綁」成一人，共 ${n - 1} 個單位排列 ${n - 1}! = ${factorial(n - 1)}；甲乙內部可互換，× 2，得 ${adjacent}。`,
    };
  }
  if (kind === 1) {
    return {
      stem: `${n} 人排成一行拍照，其中甲、乙兩人不能相鄰。共有多少種排法？`,
      correct: String(all - adjacent),
      distractors: [String(adjacent), String(all), String(all - factorial(n - 1)), String(factorial(n - 1))],
      explanation: `用補集：全部排法 ${n}! = ${all}，減去甲乙相鄰的 2 × ${n - 1}! = ${adjacent}，得 ${all - adjacent}。`,
    };
  }
  const result = (n - 2) * factorial(n - 1);
  return {
    stem: `${n} 人排成一行，其中甲不能站在兩端。共有多少種排法？`,
    correct: String(result),
    distractors: [String(all), String(2 * factorial(n - 1)), String(factorial(n - 1)), String(all - factorial(n - 1))],
    explanation: `甲只能站中間 ${n - 2} 個位置之一，其餘 ${n - 1} 人任意排 ${n - 1}! = ${factorial(n - 1)}，共 ${n - 2} × ${factorial(n - 1)} = ${result}。`,
  };
}

export function committee(rng: Rng): Generated | null {
  const men = randInt(rng, 3, 7);
  const women = randInt(rng, 2, 5);
  const size = randInt(rng, 2, Math.min(4, men));
  const answer = choose(men + women, size) - choose(men, size);
  return {
    stem: `從 ${men} 名男職員和 ${women} 名女職員中選出 ${size} 人組成小組，小組中至少要有 1 名女職員。共有多少種選法？`,
    correct: String(answer),
    distractors: [
      String(choose(men + women, size)),
      String(women * choose(men + women - 1, size - 1)),
      String(women * choose(men, size - 1)),
      String(choose(men, size)),
    ],
    explanation: `用補集：任選 C(${men + women},${size}) = ${choose(men + women, size)}，減去全是男職員 C(${men},${size}) = ${choose(men, size)}，得 ${answer}。陷阱：「先選 1 女再任選其餘」（${women} × C(${men + women - 1},${size - 1})）會重複計算。`,
  };
}

// ---------- 平均數與中位數 ----------

export function medianExtreme(rng: Rng): Generated | null {
  const n = pick(rng, [5, 7, 9]);
  const k = (n - 1) / 2;
  const median = randInt(rng, 6, 30);
  const mean = randInt(rng, 4, median + 6);
  const total = n * mean;
  if (rng() < 0.5) {
    const largest = total - k - k * median;
    if (largest < median) return null;
    return {
      stem: `${n} 個正整數的平均數為 ${mean}、中位數為 ${median}。其中最大的數最大可以是多少？`,
      correct: String(largest),
      distractors: [String(total - median), String(total - k * median), String(largest - k), String(largest + k)],
      explanation: `總和 = ${n} × ${mean} = ${total}。要最大數最大，其他數盡量小：比中位數小的 ${k} 個數各取 1，中位數 ${median}，比中位數大的另外 ${k - 1} 個數最少等於 ${median}。最大數 = ${total} − ${k} × 1 − ${k} × ${median} = ${largest}。`,
    };
  }
  const smallest = Math.floor((total - (k + 1) * median) / k);
  if (mean >= median || smallest < 1 || smallest >= median) return null;
  return {
    stem: `${n} 個正整數的平均數為 ${mean}、中位數為 ${median}。其中最小的數最大可以是多少？`,
    correct: String(smallest),
    distractors: [String(median), String(smallest + 1), String(Math.max(smallest - 1, 0)), String(mean)],
    explanation: `總和 = ${total}。要最小數盡量大，就讓中位數及以上的 ${k + 1} 個數都取最小值 ${median}（共 ${(k + 1) * median}），並讓比中位數小的 ${k} 個數相等：${k} × 最小數 ≤ ${total} − ${(k + 1) * median} = ${total - (k + 1) * median}，最小數 ≤ ${num((total - (k + 1) * median) / k)}，取整數 ${smallest}。`,
  };
}

export function newcomer(rng: Rng): Generated | null {
  const n = randInt(rng, 8, 40);
  const mean = randInt(rng, 60, 80);
  const delta = pick(rng, [0.5, 1, 1.5, 2]);
  const newMean = mean + delta;
  const score = (n + 1) * newMean - n * mean;
  if (!Number.isInteger(score) || score > 100) return null;
  return {
    stem: `某班 ${n} 名學生的平均分為 ${mean} 分。新加入一名學生後，全班平均分變為 ${num(newMean)} 分。新同學考了多少分？`,
    correct: num(score),
    distractors: [num(newMean + delta), num(mean + n * delta), num(2 * newMean - mean), num(score - newMean)],
    explanation: `原總分 ${n} × ${mean} = ${n * mean}，新總分 ${n + 1} × ${num(newMean)} = ${num((n + 1) * newMean)}，新同學 = ${num((n + 1) * newMean)} − ${n * mean} = ${num(score)}。速算：新同學 = 新平均 + 原人數 × 升幅 = ${num(newMean)} + ${n} × ${delta}。`,
  };
}

export function weightedMean(rng: Rng): Generated | null {
  const n1 = randInt(rng, 10, 40);
  const n2 = randInt(rng, 10, 40);
  const a1 = randInt(rng, 60, 90);
  const a2 = randInt(rng, 60, 90);
  const mean = (n1 * a1 + n2 * a2) / (n1 + n2);
  if (n1 === n2 || a1 === a2 || Math.round(mean * 10) !== mean * 10) return null;
  return {
    stem: `某部門有男職員 ${n1} 人，考核平均分 ${a1}；女職員 ${n2} 人，平均分 ${a2}。全部門的平均分是多少？`,
    correct: num(mean),
    distractors: [num((a1 + a2) / 2), num(mean + 1), num(mean - 1.5), num((a1 * n2 + a2 * n1) / (n1 + n2))],
    explanation: `加權平均 = (${n1} × ${a1} + ${n2} × ${a2}) ÷ (${n1} + ${n2}) = ${n1 * a1 + n2 * a2} ÷ ${n1 + n2} = ${num(mean)}。陷阱：人數不同時不能直接取 (${a1} + ${a2}) ÷ 2。`,
  };
}

// ---------- 數列規律 ----------

type Sequence = { terms: number[]; next: number; rule: string };

function makeSequence(rng: Rng): Sequence {
  const kind = randInt(rng, 0, 6);
  const range = [1, 2, 3, 4, 5];
  if (kind === 0) {
    const c = randInt(rng, -3, 5);
    const start = randInt(rng, 1, 3);
    const terms = range.map((i) => (i + start - 1) ** 2 + c);
    const offset = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${-c}`;
    return { terms, next: (start + 5) ** 2 + c, rule: `各項依次為 ${start}²、${start + 1}²、${start + 2}²…${offset}，下一項是 ${start + 5}²${offset}` };
  }
  if (kind === 1) {
    const c = randInt(rng, -2, 3);
    const terms = range.map((i) => i ** 3 + c);
    return { terms, next: 216 + c, rule: `第 n 項 = n³${c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${-c}`}` };
  }
  if (kind === 2) {
    const r = randInt(rng, 2, 3);
    const a = randInt(rng, 1, 5);
    const terms = range.map((i) => a * r ** (i - 1));
    return { terms, next: a * r ** 5, rule: `等比數列，每項乘以 ${r}` };
  }
  if (kind === 3) {
    const a = randInt(rng, 1, 10);
    const d = randInt(rng, 1, 4);
    const e = randInt(rng, 1, 3);
    const terms = [a];
    for (let i = 0; i < 4; i += 1) terms.push((terms[i] ?? 0) + d + e * i);
    return { terms, next: (terms[4] ?? 0) + d + e * 4, rule: `相鄰兩項之差為 ${d}、${d + e}、${d + 2 * e}…，每次多 ${e}` };
  }
  if (kind === 4) {
    const a = randInt(rng, 1, 4);
    const b = randInt(rng, a, a + 4);
    const terms = [a, b];
    for (let i = 2; i < 6; i += 1) terms.push((terms[i - 1] ?? 0) + (terms[i - 2] ?? 0));
    return { terms: terms.slice(0, 5), next: terms[5] ?? 0, rule: '每項等於前兩項之和' };
  }
  if (kind === 5) {
    const a = randInt(rng, 1, 9);
    const d1 = randInt(rng, 2, 5);
    const b = randInt(rng, 10, 30);
    const d2 = -randInt(rng, 1, 3);
    const terms = [a, b, a + d1, b + d2, a + 2 * d1];
    return { terms, next: b + 2 * d2, rule: `奇數項、偶數項是兩個交錯的數列：${a}、${a + d1}、${a + 2 * d1}… 每次 + ${d1}；${b}、${b + d2}… 每次 − ${-d2}` };
  }
  const m = randInt(rng, 2, 3);
  const c = randInt(rng, 1, 3);
  const terms = [randInt(rng, 1, 3)];
  for (let i = 0; i < 4; i += 1) terms.push((terms[i] ?? 0) * m + c);
  return { terms, next: (terms[4] ?? 0) * m + c, rule: `每項 = 前一項 × ${m} + ${c}` };
}

export function sequence(rng: Rng): Generated | null {
  const { terms, next, rule } = makeSequence(rng);
  const last = terms[4] ?? 0;
  const prev = terms[3] ?? 0;
  return {
    stem: `找出規律，填上下一個數：${terms.join('、')}、？`,
    correct: String(next),
    distractors: [String(last + (last - prev)), String(next + 1), String(next - 2), String(next + (last - prev)), String(next + 3)],
    explanation: `${rule}，所以下一個數是 ${next}。`,
  };
}

// ---------- 圖表數據分析 ----------

const YEARS = [2021, 2022, 2023, 2024, 2025];

function chartTable(rng: Rng): { a: number[]; b: number[]; table: string } {
  const a = [randInt(rng, 20, 60) * 50];
  const b = [randInt(rng, 20, 60) * 50];
  for (let i = 1; i < YEARS.length; i += 1) {
    a.push(Math.max(500, (a[i - 1] ?? 0) + randInt(rng, -6, 12) * 50));
    b.push(Math.max(500, (b[i - 1] ?? 0) + randInt(rng, -6, 12) * 50));
  }
  const rows = YEARS.map((year, i) => `| ${year} | ${(a[i] ?? 0).toLocaleString('en-US')} | ${(b[i] ?? 0).toLocaleString('en-US')} |`);
  const table = ['| 年份 | 甲部門 | 乙部門 |', '| --- | --- | --- |', ...rows].join('\n');
  return { a, b, table };
}

export function chart(rng: Rng): Generated | null {
  const { a, b, table } = chartTable(rng);
  const intro = `下表為兩個部門 2021–2025 年收到的申請宗數：\n\n${table}\n\n`;
  const kind = randInt(rng, 0, 3);
  const value = (list: number[], i: number): number => list[i] ?? 0;

  if (kind === 0) {
    const growth = YEARS.slice(1).map((_, i) => (value(a, i + 1) - value(a, i)) / value(a, i));
    const best = growth.indexOf(Math.max(...growth));
    const diffs = YEARS.slice(1).map((_, i) => value(a, i + 1) - value(a, i));
    const biggestAbs = diffs.indexOf(Math.max(...diffs));
    if (best === biggestAbs || growth.filter((g) => g === growth[best]).length > 1) return null;
    const label = (i: number): string => `${YEARS[i + 1]} 年`;
    return {
      stem: `${intro}甲部門哪一年的申請宗數按年增長率最高？`,
      correct: label(best),
      distractors: [label(biggestAbs), ...YEARS.slice(1).map((_, i) => label(i))],
      explanation: `按年增長率 = (當年 − 上年) ÷ 上年。各年依次為 ${growth.map((g, i) => `${YEARS[i + 1]}：${pct(g)}`).join('，')}，最高是 ${label(best)}。陷阱：增加宗數最多的是 ${label(biggestAbs)}（+${value(diffs, biggestAbs)}），但它的基數較大，增長率不是最高。`,
    };
  }
  if (kind === 1) {
    const from = randInt(rng, 0, 2);
    const to = randInt(rng, from + 1, 4);
    const change = (value(b, to) - value(b, from)) / value(b, from);
    if (change === 0) return null;
    return {
      stem: `${intro}乙部門 ${YEARS[to]} 年的申請宗數比 ${YEARS[from]} 年增加（或減少）了百分之幾？`,
      correct: pct(change),
      distractors: [
        pct((value(b, to) - value(b, from)) / value(b, to)),
        pct(-change),
        pct(change + 0.1),
        pct(change / (to - from)),
      ],
      explanation: `變化率 = (${value(b, to)} − ${value(b, from)}) ÷ ${value(b, from)} = ${pct(change)}。陷阱：基數是較早的 ${YEARS[from]} 年，不是 ${YEARS[to]} 年（否則得 ${pct((value(b, to) - value(b, from)) / value(b, to))}）。`,
    };
  }
  if (kind === 2) {
    const i = randInt(rng, 0, 4);
    const share = value(a, i) / (value(a, i) + value(b, i));
    return {
      stem: `${intro}${YEARS[i]} 年甲部門的申請宗數佔兩部門總數的百分之幾？`,
      correct: pct(share),
      distractors: [pct(value(a, i) / value(b, i)), pct(1 - share), pct(share + 0.05), pct(share - 0.05)],
      explanation: `佔比 = 甲 ÷ (甲 + 乙) = ${value(a, i)} ÷ ${value(a, i) + value(b, i)} = ${pct(share)}。陷阱：分母應是「總數」，不是乙部門（${pct(value(a, i) / value(b, i))}）。`,
    };
  }
  const total = a.reduce((sum, item) => sum + item, 0);
  const mean = total / a.length;
  return {
    stem: `${intro}甲部門這 5 年平均每年收到多少宗申請？`,
    correct: num(mean),
    distractors: [num((value(a, 0) + value(a, 4)) / 2), num(total / 4), num(mean + 50), num(mean - 50)],
    explanation: `5 年合計 ${a.join(' + ')} = ${total}，平均 = ${total} ÷ 5 = ${num(mean)}。陷阱：不能只取首尾兩年的平均。`,
  };
}
