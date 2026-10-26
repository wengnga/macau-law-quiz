import { describe, expect, it } from 'vitest';
import { cnToInt, extractArticleTags, parseArticleTag, type LawResolver } from './articles';

const resolver: LawResolver = {
  defaultLaw: '基本法',
  byNumber: { '2/2009': '維護國家安全法' },
  aliases: { 中華人民共和國澳門特別行政區基本法: '基本法' },
};

describe('cnToInt', () => {
  it.each([
    ['十', 10],
    ['十九', 19],
    ['二十七', 27],
    ['一百零一', 101],
    ['一百四十三', 143],
    ['三百一十五', 315],
  ])('%s -> %d', (text, value) => {
    expect(cnToInt(text)).toBe(value);
  });

  it('returns NaN for non-numerals', () => {
    expect(cnToInt('甲')).toBeNaN();
  });
});

describe('extractArticleTags', () => {
  it('extracts multiple articles and the preamble', () => {
    expect(extractArticleTags('《中華人民共和國澳門特別行政區基本法》序言第二段、第三段及第五條', resolver)).toEqual([
      'article:基本法:序言',
      'article:基本法:第五條',
    ]);
  });

  it('switches law on a law-number reference', () => {
    expect(extractArticleTags('第2/2009號法律第七條、第八條', resolver)).toEqual([
      'article:維護國家安全法:第七條',
      'article:維護國家安全法:第八條',
    ]);
  });

  it('keeps letter suffixes and annexes', () => {
    expect(extractArticleTags('第三十-A條第一款及附件一表二', resolver)).toEqual([
      'article:基本法:第三十-A條',
      'article:基本法:附件一',
    ]);
  });

  it('ignores paragraphs and items', () => {
    expect(extractArticleTags('第六十二條（二）項及第一款', resolver)).toEqual(['article:基本法:第六十二條']);
  });

  it('returns nothing for plain explanations', () => {
    expect(extractArticleTags('1988年通過首個修正案', resolver)).toEqual([]);
  });
});

describe('parseArticleTag', () => {
  it('orders preamble, articles, suffixes and annexes', () => {
    const tags = ['附件一', '第三十一條', '第三十-A條', '第三十條', '序言'].map((article) => `article:法:${article}`);
    const sorted = tags
      .map((tag) => parseArticleTag(tag))
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((parsed) => parsed?.article);
    expect(sorted).toEqual(['序言', '第三十條', '第三十-A條', '第三十一條', '附件一']);
  });

  it('rejects non-article tags', () => {
    expect(parseArticleTag('topic:x')).toBeNull();
  });
});
