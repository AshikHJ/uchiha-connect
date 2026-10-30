import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStoredToken } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  attemptsLeft: number | null;
  lockoutRemaining: number;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check auth status on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        const status = await api.auth.getStatus();
        setIsAuthenticated(status.isAuthenticated);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const login = async (pin: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.auth.login(pin);
      if (res.success) {
        setIsAuthenticated(true);
        setAttemptsLeft(null);
        setLockoutRemaining(0);
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setError(message);
      if (err.attemptsLeft !== undefined) {
        setAttemptsLeft(err.attemptsLeft);
      }
      if (err.lockoutRemaining) {
        setLockoutRemaining(err.lockoutRemaining);
      }
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setIsAuthenticated(false);
      setStoredToken(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        attemptsLeft,
        lockoutRemaining,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
