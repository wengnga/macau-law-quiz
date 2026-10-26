import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMacauLawMd } from './macau-law-md';

const source = readFileSync(join(__dirname, '../../data/macau-law.md'), 'utf8');

describe('parseMacauLawMd with the real bank', () => {
  const bank = parseMacauLawMd(source, 'test');

  it('parses all sections and questions listed in the table of contents', () => {
    expect(bank.sections.map((section) => section.questionCount)).toEqual([60, 199, 25, 24, 10, 47, 150, 32, 25, 32]);
    expect(bank.questions).toHaveLength(604);
  });

  it('merges answers and legal basis by question number', () => {
    const first = bank.questions[0];
    expect(first?.id).toBe('macau-law/s1/q1');
    expect(first?.answer).toEqual(['D']);
    expect(first?.options.map((option) => option.key)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('resolves law numbers in the basis to the law name', () => {
    const question = bank.questions.find((q) => q.id === 'macau-law/s4/q17');
    expect(question?.tags).toEqual(['article:政府組織綱要法:第九條']);
  });

  it('uses short names for the constitution and the basic law', () => {
    expect(bank.sections[0]?.shortTitle).toBe('憲法');
    expect(bank.sections[1]?.shortTitle).toBe('基本法');
  });
});

describe('parseMacauLawMd validation', () => {
  const minimal = (answerRows: string) => `# 測試選擇題

## 目錄

| # | 部分 | 題數 | 頁碼 |
|---|------|------|------|
| 1 | 《測試法》 | 2 | 1–2 |

## 1. 《測試法》

**1）** 第一題？

- **A.** 甲
- **B.** 乙

**2）** 第二題？

- **A.** 甲
- **B.** 乙

### 答案與條文依據

| 題號 | 答案 | 條文／解析 |
|:---:|:---:|---|
${answerRows}
`;

  it('accepts a consistent document', () => {
    const bank = parseMacauLawMd(minimal('| 1 | A | 《測試法》第一條 |\n| 2 | B | 第二條 |'), 'v');
    expect(bank.questions.map((q) => q.tags)).toEqual([['article:測試法:第一條'], ['article:測試法:第二條']]);
  });

  it('fails when an answer is missing', () => {
    expect(() => parseMacauLawMd(minimal('| 1 | A | x |'), 'v')).toThrow(/缺少答案/);
  });

  it('fails when the answer is not one of the options', () => {
    expect(() => parseMacauLawMd(minimal('| 1 | A | x |\n| 2 | D | y |'), 'v')).toThrow(/不在選項中/);
  });
});
