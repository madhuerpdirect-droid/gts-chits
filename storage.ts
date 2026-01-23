
import { ChitGroup, Member, Payment } from './types';

const STORAGE_KEYS = {
  GROUPS: 'gts_chits_groups',
  MEMBERS: 'gts_chits_members',
  PAYMENTS: 'gts_chits_payments',
  LAST_BACKUP: 'gts_chits_last_backup',
  LAST_CHANGE: 'gts_chits_last_change',
};

export const loadData = <T,>(key: string, defaultValue: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return defaultValue;
  }
};

export const saveData = <T,>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Update the last change timestamp whenever data is saved to localStorage
    localStorage.setItem(STORAGE_KEYS.LAST_CHANGE, new Date().toISOString());
  } catch (e) {
    console.error(`Error saving ${key}`, e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert("Storage quota exceeded! Please export your data and clear some records to continue.");
    }
  }
};

export const updateLastBackupTimestamp = () => {
  localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
};

export const getLastBackupDate = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
};

export const getLastChangeDate = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_CHANGE);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName] ?? '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  updateLastBackupTimestamp();
};
