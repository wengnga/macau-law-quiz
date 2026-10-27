import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bank, BankIndexEntry } from '../src/domain/types';
import { parseMacauLawMd } from './importers/macau-law-md';
import { buildAptitudeBank } from './aptitude/build';
import { buildMathBank } from './math/build';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'banks');

/** A bank parsed from a data file, or one built in code (which sets its own version). */
type BankSource = { file: string; importer: (content: string, version: string) => Bank } | { build: () => Bank };

/** Add a new entry here to ship another question bank. */
const SOURCES: BankSource[] = [
  { build: buildAptitudeBank },
  { build: buildMathBank },
  { file: 'data/macau-law.md', importer: parseMacauLawMd },
];

function loadBank(source: BankSource): Bank {
  if ('build' in source) return source.build();
  const content = readFileSync(join(root, source.file), 'utf8');
  const version = createHash('sha1').update(content).digest('hex').slice(0, 10);
  return source.importer(content, version);
}

function main(): void {
  mkdirSync(outDir, { recursive: true });
  const index: BankIndexEntry[] = [];
  for (const source of SOURCES) {
    const bank = loadBank(source);
    const file = `${bank.id}.json`;
    writeFileSync(join(outDir, file), JSON.stringify(bank));
    index.push({ id: bank.id, title: bank.title, questionCount: bank.questions.length, file });
    const tagged = bank.questions.filter((question) => (question.tags?.length ?? 0) > 0).length;
    console.log(
      `[import] ${bank.id}: ${bank.sections.length} 個專題，${bank.questions.length} 題（${tagged} 題含條文標籤）`,
    );
  }
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index));
}

main();
