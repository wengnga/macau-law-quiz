import { extractArticleTags, type LawResolver } from '../../src/domain/articles';
import type { Bank, Question, QuestionOption, Section } from '../../src/domain/types';

export const MACAU_LAW_BANK_ID = 'macau-law';

const SECTION_RE = /^## (\d+)\. (.+)$/;
const TOC_ROW_RE = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|/;
const QUESTION_RE = /^\*\*(\d+)）\*\*\s*(.*)$/;
const OPTION_RE = /^- \*\*([A-Z])\.\*\*\s*(.*)$/;
const ANSWER_ROW_RE = /^\|\s*(\d+)\s*\|\s*([A-Z]+)\s*\|\s*(.*?)\s*\|\s*$/;
const LAW_NUMBER_RE = /第(\d+\/\d+(?:\/M)?)號/;
const QUOTED_RE = /《([^》]+)》/;

const LAW_ALIASES: Record<string, string> = {
  中華人民共和國憲法: '憲法',
  中華人民共和國澳門特別行政區基本法: '基本法',
};

interface RawQuestion {
  no: number;
  stemLines: string[];
  options: QuestionOption[];
}

interface RawSection {
  no: number;
  title: string;
  questions: RawQuestion[];
  answers: Map<number, { answer: string[]; basis: string }>;
}

interface ParsedDocument {
  title: string;
  expectedCounts: Map<number, number>;
  sections: RawSection[];
}

function parseDocument(md: string): ParsedDocument {
  const doc: ParsedDocument = { title: '', expectedCounts: new Map(), sections: [] };
  let section: RawSection | null = null;
  let question: RawQuestion | null = null;
  let inToc = false;
  let inAnswers = false;

  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('# ')) {
      doc.title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      inToc = line === '## 目錄';
      const match = SECTION_RE.exec(line);
      if (match) {
        section = { no: Number(match[1]), title: (match[2] ?? '').trim(), questions: [], answers: new Map() };
        doc.sections.push(section);
        question = null;
        inAnswers = false;
      }
      continue;
    }
    if (inToc) {
      const match = TOC_ROW_RE.exec(line);
      if (match) doc.expectedCounts.set(Number(match[1]), Number(match[3]));
      continue;
    }
    if (!section) continue;
    if (line.startsWith('### ') && line.includes('答案')) {
      inAnswers = true;
      question = null;
      continue;
    }
    if (inAnswers) {
      const match = ANSWER_ROW_RE.exec(line);
      if (match) {
        section.answers.set(Number(match[1]), { answer: (match[2] ?? '').split(''), basis: match[3] ?? '' });
      }
      continue;
    }
    const questionMatch = QUESTION_RE.exec(line);
    if (questionMatch) {
      const firstLine = (questionMatch[2] ?? '').trim();
      question = { no: Number(questionMatch[1]), stemLines: firstLine ? [firstLine] : [], options: [] };
      section.questions.push(question);
      continue;
    }
    if (!question || line === '' || line === '---') continue;
    const optionMatch = OPTION_RE.exec(line);
    if (optionMatch) {
      question.options.push({ key: optionMatch[1] ?? '', content: (optionMatch[2] ?? '').trim() });
      continue;
    }
    const lastOption = question.options[question.options.length - 1];
    if (lastOption) lastOption.content = `${lastOption.content}\n${line}`;
    else question.stemLines.push(line);
  }
  return doc;
}

function lawNameOf(sectionTitle: string): string {
  const quoted = QUOTED_RE.exec(sectionTitle)?.[1] ?? sectionTitle;
  return LAW_ALIASES[quoted] ?? quoted;
}

function buildLawNumberMap(sections: readonly RawSection[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const section of sections) {
    const number = LAW_NUMBER_RE.exec(section.title)?.[1];
    if (number) map[number] = lawNameOf(section.title);
  }
  return map;
}

function validate(doc: ParsedDocument): string[] {
  const errors: string[] = [];
  if (doc.sections.length === 0) errors.push('未解析到任何專題');
  for (const section of doc.sections) {
    const label = `第 ${section.no} 部分`;
    const expected = doc.expectedCounts.get(section.no);
    if (expected !== undefined && expected !== section.questions.length) {
      errors.push(`${label}：目錄寫 ${expected} 題，實際解析 ${section.questions.length} 題`);
    }
    if (section.answers.size !== section.questions.length) {
      errors.push(`${label}：題目 ${section.questions.length} 道，答案 ${section.answers.size} 條`);
    }
    section.questions.forEach((question, index) => {
      if (question.no !== index + 1) errors.push(`${label}：題號不連續，第 ${index + 1} 道為 ${question.no}`);
      if (question.stemLines.length === 0) errors.push(`${label} 第 ${question.no} 題：缺少題幹`);
      if (question.options.length < 2) errors.push(`${label} 第 ${question.no} 題：選項少於 2 個`);
      const answer = section.answers.get(question.no);
      if (!answer) {
        errors.push(`${label} 第 ${question.no} 題：缺少答案`);
        return;
      }
      const keys = new Set(question.options.map((option) => option.key));
      if (answer.answer.length !== 1 || !answer.answer.every((key) => keys.has(key))) {
        errors.push(`${label} 第 ${question.no} 題：答案 ${answer.answer.join('')} 不在選項中或不是單選`);
      }
    });
  }
  return errors;
}

export function parseMacauLawMd(md: string, version: string): Bank {
  const doc = parseDocument(md);
  const errors = validate(doc);
  if (errors.length > 0) {
    throw new Error(`題庫解析校驗失敗：\n${errors.map((error) => `  - ${error}`).join('\n')}`);
  }

  const byNumber = buildLawNumberMap(doc.sections);
  const sections: Section[] = [];
  const questions: Question[] = [];

  for (const raw of doc.sections) {
    const sectionId = `s${raw.no}`;
    const resolver: LawResolver = { defaultLaw: lawNameOf(raw.title), byNumber, aliases: LAW_ALIASES };
    sections.push({
      id: sectionId,
      title: raw.title,
      shortTitle: lawNameOf(raw.title),
      order: raw.no,
      questionCount: raw.questions.length,
    });
    for (const rawQuestion of raw.questions) {
      const answer = raw.answers.get(rawQuestion.no);
      const basis = answer?.basis ?? '';
      questions.push({
        id: `${MACAU_LAW_BANK_ID}/${sectionId}/q${rawQuestion.no}`,
        bankId: MACAU_LAW_BANK_ID,
        sectionId,
        no: rawQuestion.no,
        type: 'single',
        stem: rawQuestion.stemLines.join('\n'),
        options: rawQuestion.options,
        answer: answer?.answer ?? [],
        explanation: basis || undefined,
        tags: extractArticleTags(basis, resolver),
      });
    }
  }

  return {
    schemaVersion: 1,
    id: MACAU_LAW_BANK_ID,
    title: doc.title.replace(/選擇題$/, '').replace(/[《》]/g, '') || '澳門法例',
    description: doc.title,
    version,
    contentFormat: 'text',
    sections,
    questions,
  };
}
