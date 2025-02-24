'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';

interface UserGuardContextType {
  user: User;
}

const UserGuardContext = createContext<UserGuardContextType | undefined>(undefined);

export function UserGuardProvider({ children, user }: { children: ReactNode; user: User }) {
  return (
    <UserGuardContext.Provider value={{ user }}>
      {children}
    </UserGuardContext.Provider>
  );
}

export function useUserGuardContext() {
  const context = useContext(UserGuardContext);
  if (!context) {
    throw new Error('useUserGuardContext must be used within a UserGuardProvider');
  }
  return context;
} 