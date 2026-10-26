import { createContext, useContext } from 'react';
import type { Bank, BankIndexEntry, Material, Question, Section } from '../domain/types';

export interface LoadedBank {
  bank: Bank;
  questionsById: ReadonlyMap<string, Question>;
  questionsBySection: ReadonlyMap<string, readonly Question[]>;
  sectionsById: ReadonlyMap<string, Section>;
  materialsById: ReadonlyMap<string, Material>;
}

const bankUrl = (file: string): string => `${import.meta.env.BASE_URL}banks/${file}`;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`加载 ${url} 失败（${response.status}）`);
  return (await response.json()) as T;
}

export function fetchBankIndex(): Promise<BankIndexEntry[]> {
  return fetchJson<BankIndexEntry[]>(bankUrl('index.json'));
}

export function indexBank(bank: Bank): LoadedBank {
  const questionsBySection = new Map<string, Question[]>();
  for (const question of bank.questions) {
    const list = questionsBySection.get(question.sectionId) ?? [];
    list.push(question);
    questionsBySection.set(question.sectionId, list);
  }
  return {
    bank,
    questionsById: new Map(bank.questions.map((question) => [question.id, question])),
    questionsBySection,
    sectionsById: new Map(bank.sections.map((section) => [section.id, section])),
    materialsById: new Map((bank.materials ?? []).map((material) => [material.id, material])),
  };
}

const cache = new Map<string, Promise<LoadedBank>>();

export function fetchBank(entry: BankIndexEntry): Promise<LoadedBank> {
  const cached = cache.get(entry.id);
  if (cached) return cached;
  const promise = fetchJson<Bank>(bankUrl(entry.file)).then(indexBank);
  promise.catch(() => cache.delete(entry.id));
  cache.set(entry.id, promise);
  return promise;
}

export interface BankContextValue extends LoadedBank {
  banks: readonly BankIndexEntry[];
}

export const BankContext = createContext<BankContextValue | null>(null);

export function useBank(): BankContextValue {
  const value = useContext(BankContext);
  if (!value) throw new Error('useBank must be used inside <BankContext.Provider>');
  return value;
}
