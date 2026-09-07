/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoginPayload, RegisterPayload, User } from '../types/auth';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate user session on app load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        let currentUser = await getCurrentUser();
        if (!currentUser) {
          // Attempt silent session refresh if cookies exist
          const refreshRes = await refreshAuthSession();
          if (refreshRes?.user) {
            currentUser = refreshRes.user;
          }
        }
        if (isMounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginUser(credentials);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await registerUser(payload);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
