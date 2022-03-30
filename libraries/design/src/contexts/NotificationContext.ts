import { createContext } from 'react';

export interface NotificationInfo {
  color: 'error' | 'success';
  message: string;
}

interface NotificationContextValue {
  showNotification(notification: NotificationInfo): void;
}

export const NotificationContext = createContext<NotificationContextValue>(
  undefined as unknown as NotificationContextValue
);
