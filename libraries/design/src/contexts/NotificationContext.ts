'use client';
import { createClientContext } from '../utils/ContextUtils.js';

export interface NotificationInfo {
  color: 'error' | 'success';
  message: string;
}

interface NotificationContextValue {
  showNotification(this: void, notification: NotificationInfo): void;
}

export const NotificationContext = createClientContext<NotificationContextValue>(undefined);
