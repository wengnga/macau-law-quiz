import { describe, expect, it } from 'vitest';
import { applyAnswer } from '../domain/stats';
import {
  createDefaultAppData,
  loadAppData,
  parseExport,
  saveAppData,
  SCHEMA_VERSION,
  serializeExport,
  STORAGE_KEY,
  type KeyValueStorage,
} from './appData';

const memoryStorage = (): KeyValueStorage & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
};

const sample = () => {
  const data = createDefaultAppData();
  data.stats['b/s1/q1'] = applyAnswer(undefined, false, 1);
  data.stats['b/s1/q2'] = { ...applyAnswer(undefined, true, 1), starred: true };
  data.settings.theme = 'dark';
  return data;
};

describe('load/save', () => {
  it('round-trips through storage under a single key', () => {
    const storage = memoryStorage();
    saveAppData(storage, sample());
    expect([...storage.map.keys()]).toEqual([STORAGE_KEY]);
    expect(loadAppData(storage)).toEqual(sample());
  });

  it('falls back to defaults on corrupt data', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{oops');
    expect(loadAppData(storage)).toEqual(createDefaultAppData());
  });
});

describe('export/import', () => {
  it('previews an exported file', () => {
    const preview = parseExport(serializeExport(sample(), 123));
    expect(preview).toMatchObject({ exportedAt: 123, questionCount: 2, wrongBookCount: 1, sessionCount: 0 });
    expect(preview.data.settings.theme).toBe('dark');
  });

  it('rejects foreign files and newer schema versions', () => {
    expect(() => parseExport('not json')).toThrow(/JSON/);
    expect(() => parseExport(JSON.stringify({ app: 'other', data: {} }))).toThrow(/不是本应用/);
    const newer = { app: 'macau-law-quiz', exportedAt: 1, data: { ...sample(), schemaVersion: SCHEMA_VERSION + 1 } };
    expect(() => parseExport(JSON.stringify(newer))).toThrow(/更新应用/);
  });
});
