import { Farm, AnalysisReport, SyncQueueItem } from '../types';

const FARMS_KEY = 'mavuno_farms_v1';
const ANALYSES_KEY = 'mavuno_analyses_v1';
const SYNC_QUEUE_KEY = 'mavuno_sync_queue_v1';
const ACTIVE_FARM_KEY = 'mavuno_active_farm_id';
const LANG_KEY = 'mavuno_lang_pref';

export function getLocalFarms(): Farm[] {
  try {
    const raw = localStorage.getItem(FARMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFarms(farms: Farm[]) {
  try {
    localStorage.setItem(FARMS_KEY, JSON.stringify(farms));
  } catch (e) {
    console.warn('Failed to save farms to localStorage', e);
  }
}

export function getLocalAnalyses(): AnalysisReport[] {
  try {
    const raw = localStorage.getItem(ANALYSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAnalyses(analyses: AnalysisReport[]) {
  try {
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(analyses));
  } catch (e) {
    console.warn('Failed to save analyses to localStorage', e);
  }
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at'>) {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString()
  };
  queue.push(newItem);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  return newItem;
}

export function clearSyncQueue() {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function getSavedActiveFarmId(): string | null {
  return localStorage.getItem(ACTIVE_FARM_KEY);
}

export function saveActiveFarmId(id: string) {
  localStorage.setItem(ACTIVE_FARM_KEY, id);
}

export function getSavedLanguage(): 'en' | 'sw' | 'ek' {
  const l = localStorage.getItem(LANG_KEY);
  if (l === 'sw' || l === 'ek' || l === 'en') return l;
  return 'en';
}

export function saveLanguage(lang: 'en' | 'sw' | 'ek') {
  localStorage.setItem(LANG_KEY, lang);
}
