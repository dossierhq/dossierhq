import type { ReactNode } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import type { NotificationInfo } from '../../contexts/NotificationContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { toClassName } from '../../utils/ClassNameUtils';

export interface NotificationContainerProps {
  children: ReactNode;
}

interface NotificationState extends NotificationInfo {
  id: number;
}

const COLOR_CLASSNAMES = {
  success: 'is-success',
  error: 'is-error',
};

export function NotificationContainer({ children }: NotificationContainerProps) {
  const notificationId = useRef(1);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback((notification: NotificationInfo) => {
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      { id: notificationId.current++, ...notification },
    ]);
  }, []);

  const hideNotification = useCallback((id: number) => {
    setNotifications((prevNotifications) => [...prevNotifications].filter((it) => it.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <div className="isolation-isolate">{children}</div>
      {notifications.length > 0 ? (
        <div className="notification-center isolation-isolate">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={toClassName('notification is-light', COLOR_CLASSNAMES[notification.color])}
            >
              <button className="delete" onClick={() => hideNotification(notification.id)} />
              {notification.message}
            </div>
          ))}
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
}
