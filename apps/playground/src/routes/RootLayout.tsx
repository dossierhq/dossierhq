import { NotificationContainer } from '@dossierhq/design';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DatabaseProvider } from '../components/DatabaseProvider.js';
import { UserContext, type User } from '../contexts/UserContext.js';

const users: User[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
];

export function RootLayout() {
  const [currentUserId, setCurrentUserId] = useState(users[0].id);
  return (
    <NotificationContainer>
      <UserContext.Provider value={{ currentUserId, users, setCurrentUserId }}>
        <DatabaseProvider>
          <Outlet />
        </DatabaseProvider>
      </UserContext.Provider>
    </NotificationContainer>
  );
}
