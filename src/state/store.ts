import { useSyncExternalStore } from 'react';
import { createDefaultAppData, loadAppData, saveAppData, STORAGE_KEY, type AppData } from '../storage/appData';

const storage = typeof window === 'undefined' ? undefined : window.localStorage;

let state: AppData = storage ? loadAppData(storage) : createDefaultAppData();
const listeners = new Set<() => void>();
let saveErrorReported = false;

const emit = (): void => listeners.forEach((listener) => listener());

export function getAppData(): AppData {
  return state;
}

export function setAppData(next: AppData): void {
  state = next;
  try {
    if (storage) saveAppData(storage, next);
  } catch (error) {
    console.error('[store] 保存做题记录失败', error);
    if (!saveErrorReported) {
      saveErrorReported = true;
      window.alert('做题记录保存失败，可能是浏览器存储空间不足。建议先在「统计与设置」导出进度。');
    }
  }
  emit();
}

export function updateAppData(recipe: (current: AppData) => AppData): void {
  const next = recipe(state);
  if (next !== state) setAppData(next);
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Returns the whole (immutable) state; derive slices with useMemo to keep references stable. */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getAppData);
}

if (typeof window !== 'undefined') {
  // Keep multiple open tabs in sync.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !storage) return;
    state = loadAppData(storage);
    emit();
  });
}
