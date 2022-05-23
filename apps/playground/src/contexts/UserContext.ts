import { createContext } from 'react';

export interface User {
  id: string;
  name: string;
}

export interface UserContextValue {
  currentUserId: string | null;
  users: User[];
  setCurrentUserId(id: string): void;
}

export const UserContext = createContext<UserContextValue>({
  defaultUserContentValue: true,
} as unknown as UserContextValue);
