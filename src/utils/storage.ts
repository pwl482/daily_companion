import { AppData } from '../types';

const STORAGE_KEY = 'auradaily_app_data_v2';

export const EMPTY_APP_DATA: AppData = {
  recurringPayments: [],
  oneTimePayments: [],
  people: [],
  events: [],
  tickets: [],
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppData(EMPTY_APP_DATA);
      return EMPTY_APP_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      recurringPayments: parsed.recurringPayments || [],
      oneTimePayments: parsed.oneTimePayments || [],
      people: parsed.people || [],
      events: parsed.events || [],
      tickets: parsed.tickets || [],
    };
  } catch (err) {
    console.warn('Failed to parse local storage data, using empty state', err);
    return EMPTY_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export function exportDataAsJson(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auradaily-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJson(jsonStr: string): AppData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.recurringPayments || !parsed.oneTimePayments) {
    throw new Error('Invalid AuraDaily backup format');
  }
  const appData: AppData = {
    recurringPayments: parsed.recurringPayments || [],
    oneTimePayments: parsed.oneTimePayments || [],
    people: parsed.people || [],
    events: parsed.events || [],
    tickets: parsed.tickets || [],
  };
  saveAppData(appData);
  return appData;
}
