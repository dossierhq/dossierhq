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

export function resetDatabase(
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  createDatabase(null);
  showNotification({ color: 'success', message: 'New database created' });
}

export async function loadDatabaseFromUrl(
  url: string,
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void,
  navigate: NavigateFunction
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  // Cleanup url when running in dev mode
  if (url.startsWith('/../')) {
    url = url.replace('/../', '/node_modules/');
  }

  const response = await fetch(url);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    createDatabase(data);
    showNotification({ color: 'success', message: 'New database loaded' });
    navigate(ROUTE.adminEntities.url);
  } else {
    showNotification({ color: 'error', message: 'Failed downloading database' });
  }
}

export function uploadDatabase(
  file: File,
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const data = new Uint8Array(reader.result as ArrayBuffer);
    createDatabase(data);
    showNotification({ color: 'success', message: 'New database loaded' });
  };
  reader.readAsArrayBuffer(file);
}

export function downloadDatabase(database: Database) {
  const data = database.export();
  const blob = new Blob([data]);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.download = 'datadata.sqlite';
  a.onclick = () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}
