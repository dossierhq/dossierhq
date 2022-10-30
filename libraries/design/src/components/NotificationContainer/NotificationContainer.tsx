import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { NotificationInfo } from '../../contexts/NotificationContext.js';
import { NotificationContext } from '../../contexts/NotificationContext.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface NotificationContainerProps {
  children: ReactNode;
}

interface NotificationState extends NotificationInfo {
  id: number;
  hideHandle: number;
}

const COLOR_CLASSNAMES = {
  success: 'is-success',
  error: 'is-error',
};

export function NotificationContainer({ children }: NotificationContainerProps) {
  const notificationId = useRef(1);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const hideNotification = useCallback((id: number) => {
    setNotifications((prevNotifications) => {
      const newNotifications = [...prevNotifications];
      const notificationIndex = newNotifications.findIndex((it) => it.id === id);
      if (notificationIndex >= 0) {
        clearTimeout(newNotifications[notificationIndex].hideHandle);
      }
      newNotifications.splice(notificationIndex, 1);

      return newNotifications;
    });
  }, []);

  const showNotification = useCallback(
    (notification: NotificationInfo) => {
      const id = notificationId.current++;
      const hideHandle = setTimeout(() => {
        hideNotification(id);
      }, 2_000);
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { id, hideHandle, ...notification },
      ]);
    },
    [hideNotification]
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <div className="isolation-isolate">{children}</div>
      {notifications.length > 0 ? (
        <div className="notification-center isolation-isolate is-max-width-40rem">
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
