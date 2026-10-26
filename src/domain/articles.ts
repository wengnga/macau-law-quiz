export const ARTICLE_TAG_PREFIX = 'article:';
export const PREAMBLE = '序言';

const CN_DIGITS: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
const CN_UNITS: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };

/** Converts Chinese numerals such as 一百零一 / 二十七 / 十 to numbers; NaN if unparseable. */
export function cnToInt(text: string): number {
  let total = 0;
  let digit = 0;
  for (const ch of text) {
    const value = CN_DIGITS[ch];
    if (value !== undefined) {
      digit = value;
      continue;
    }
    const unit = CN_UNITS[ch];
    if (unit === undefined) return Number.NaN;
    total += (digit || 1) * unit;
    digit = 0;
  }
  return total + digit;
}

export interface LawResolver {
  /** Law used when an article appears before any explicit law reference. */
  defaultLaw: string;
  /** e.g. `2/2009` -> `維護國家安全法` */
  byNumber: Readonly<Record<string, string>>;
  /** e.g. `中華人民共和國憲法` -> `憲法` */
  aliases: Readonly<Record<string, string>>;
}

const TOKEN_RE =
  /《([^》]+)》|第(\d+\/\d+(?:\/M)?)號(?:法律|行政法規|法令)|第([零〇一二三四五六七八九十百千兩]+(?:-[A-Z])?)條|(附件[零〇一二三四五六七八九十]+)|序言/g;
const ARTICLE_RE = /^第([零〇一二三四五六七八九十百千兩]+)(?:-([A-Z]))?條$/;
const ANNEX_RE = /^附件([零〇一二三四五六七八九十]+)$/;
const ANNEX_ORDER_BASE = 100_000;

export function articleTag(law: string, article: string): string {
  return `${ARTICLE_TAG_PREFIX}${law}:${article}`;
}

/** Extracts `article:<law>:<第X條|序言>` tags from a legal-basis sentence. */
export function extractArticleTags(basis: string, resolver: LawResolver): string[] {
  const tags = new Set<string>();
  let law = resolver.defaultLaw;
  for (const match of basis.matchAll(TOKEN_RE)) {
    const [token, quoted, number, article, annex] = match;
    if (quoted !== undefined) law = resolver.aliases[quoted] ?? quoted;
    else if (number !== undefined) law = resolver.byNumber[number] ?? `第${number}號`;
    else if (article !== undefined) tags.add(articleTag(law, `第${article}條`));
    else if (annex !== undefined) tags.add(articleTag(law, annex));
    else if (token === PREAMBLE) tags.add(articleTag(law, PREAMBLE));
  }
  return [...tags];
}

export interface ParsedArticleTag {
  tag: string;
  law: string;
  article: string;
  /** Sort key: preamble first, then by article number. */
  order: number;
}

export function parseArticleTag(tag: string): ParsedArticleTag | null {
  if (!tag.startsWith(ARTICLE_TAG_PREFIX)) return null;
  const rest = tag.slice(ARTICLE_TAG_PREFIX.length);
  const sep = rest.lastIndexOf(':');
  if (sep <= 0) return null;
  const law = rest.slice(0, sep);
  const article = rest.slice(sep + 1);
  return { tag, law, article, order: articleOrder(article) };
}

/** 序言 < 第三十條 < 第三十-A條 < 第三十-B條 < 第三十一條 < 附件一 */
function articleOrder(article: string): number {
  if (article === PREAMBLE) return 0;
  const annex = ANNEX_RE.exec(article)?.[1];
  if (annex) return ANNEX_ORDER_BASE + cnToInt(annex);
  const match = ARTICLE_RE.exec(article);
  if (!match?.[1]) return Number.MAX_SAFE_INTEGER;
  const base = cnToInt(match[1]);
  if (Number.isNaN(base)) return Number.MAX_SAFE_INTEGER;
  const suffix = match[2] ? (match[2].charCodeAt(0) - 64) / 100 : 0;
  return base + suffix;
}
