import { createContext } from 'react';

export interface User {
  id: string;
  name: string;
}

export interface UserContextValue {
  currentUserId: string | null;
  users: User[];
  setCurrentUserId(this: void, id: string): void;
}

export const UserContext = createContext<UserContextValue>({
  defaultUserContextValue: true,
} as unknown as UserContextValue);
