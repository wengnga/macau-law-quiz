import type { ActiveSession, QuestionStat, SessionRecord, Settings } from '../domain/types';

export const STORAGE_KEY = 'quiz-app-data';
export const SCHEMA_VERSION = 1;
export const EXPORT_APP_ID = 'macau-law-quiz';
export const MAX_SESSION_RECORDS = 200;

export interface AppData {
  schemaVersion: number;
  stats: Record<string, QuestionStat>;
  sessions: SessionRecord[];
  activeSession: ActiveSession | null;
  settings: Settings;
}

export interface ExportFile {
  app: typeof EXPORT_APP_ID;
  exportedAt: number;
  data: AppData;
}

export interface ImportPreview {
  data: AppData;
  exportedAt: number;
  questionCount: number;
  sessionCount: number;
  wrongBookCount: number;
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createDefaultAppData(): AppData {
  return { schemaVersion: SCHEMA_VERSION, stats: {}, sessions: [], activeSession: null, settings: { theme: 'system' } };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Validates unknown JSON and upgrades older schema versions; throws on anything unusable. */
export function parseAppData(raw: unknown): AppData {
  if (!isRecord(raw)) throw new Error('数据格式不正确');
  const version = raw.schemaVersion;
  if (typeof version !== 'number') throw new Error('缺少数据版本号');
  if (version > SCHEMA_VERSION) throw new Error(`数据版本 ${version} 比应用新，请先更新应用`);
  if (!isRecord(raw.stats) || !Array.isArray(raw.sessions)) throw new Error('数据内容不完整');
  const defaults = createDefaultAppData();
  return {
    schemaVersion: SCHEMA_VERSION,
    stats: raw.stats as Record<string, QuestionStat>,
    sessions: raw.sessions as SessionRecord[],
    activeSession: isRecord(raw.activeSession) ? (raw.activeSession as unknown as ActiveSession) : null,
    settings: isRecord(raw.settings) ? { ...defaults.settings, ...(raw.settings as Partial<Settings>) } : defaults.settings,
  };
}

export function loadAppData(storage: KeyValueStorage): AppData {
  const text = storage.getItem(STORAGE_KEY);
  if (!text) return createDefaultAppData();
  try {
    return parseAppData(JSON.parse(text));
  } catch (error) {
    console.error('[storage] 读取做题记录失败，已使用空白记录', error);
    return createDefaultAppData();
  }
}

export function saveAppData(storage: KeyValueStorage, data: AppData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function serializeExport(data: AppData, now: number): string {
  const file: ExportFile = { app: EXPORT_APP_ID, exportedAt: now, data };
  return JSON.stringify(file, null, 2);
}

export function parseExport(text: string): ImportPreview {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (!isRecord(raw) || raw.app !== EXPORT_APP_ID) throw new Error('这不是本应用导出的进度文件');
  const data = parseAppData(raw.data);
  const stats = Object.values(data.stats);
  return {
    data,
    exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : 0,
    questionCount: stats.filter((stat) => stat.attempts > 0).length,
    sessionCount: data.sessions.length,
    wrongBookCount: stats.filter((stat) => stat.inWrongBook).length,
  };
}
