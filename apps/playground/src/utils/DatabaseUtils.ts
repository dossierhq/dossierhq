import type { NotificationInfo } from '@dossierhq/design';
import type { NavigateFunction } from 'react-router-dom';
import type { Database } from 'sql.js';
import { ROUTE } from './RouteUtils.js';

export function queryDatabaseSize(database: Database) {
  const result = database.exec('PRAGMA page_size; PRAGMA page_count');
  const pageSize = result[0].values[0][0] as number;
  const pageCount = result[1].values[0][0] as number;
  const byteSize = pageSize * pageCount;
  return { byteSize };
}

export async function createNewDatabase(
  createDatabase: (data: Uint8Array | null) => Promise<void>,
  showNotification: (notification: NotificationInfo) => void
) {
  await createDatabase(null);
  showNotification({ color: 'success', message: 'Created new database' });
}

export function resetDatabase(
  clearDatabase: (this: void) => void,
  showNotification: (notification: NotificationInfo) => void,
  navigate: NavigateFunction
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  clearDatabase();
  showNotification({ color: 'success', message: 'Deleted the database' });
  navigate(ROUTE.index.url);
}

export async function loadDatabaseFromUrl(
  url: string,
  createDatabase: (data: Uint8Array | null) => Promise<void>,
  showNotification: (notification: NotificationInfo) => void
) {
  // Cleanup url when running in dev mode
  if (url.startsWith('/../')) {
    url = url.replace('/../', '/node_modules/');
  }

  const response = await fetch(url);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    await createDatabase(data);
    showNotification({ color: 'success', message: 'Loaded example database' });
  } else {
    showNotification({ color: 'error', message: 'Failed downloading database' });
  }
}

export function uploadDatabase(
  file: File,
  createDatabase: (data: Uint8Array | null) => Promise<void>,
  showNotification: (notification: NotificationInfo) => void,
  navigate: NavigateFunction
) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = new Uint8Array(reader.result as ArrayBuffer);
    void createDatabase(data).then(() => {
      showNotification({ color: 'success', message: 'Loaded new database' });
      navigate(ROUTE.content.url('upload'));
    });
  };
  reader.readAsArrayBuffer(file);
}

export function downloadDatabase(database: Database) {
  const data = database.export();
  const blob = new Blob([data]);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.download = 'dossier.sqlite';
  a.onclick = () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}
