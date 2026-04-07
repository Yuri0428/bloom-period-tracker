import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const USERS_KEY = 'luna_users';
const SESSION_KEY = 'luna_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const found = users.find(u => u.id === sessionId);
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

const login = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Invalid email or password' }));
    throw new Error(error.message || 'Invalid email or password');
  }

  const data = await response.json();
  setUser(data.user);
  localStorage.setItem('token', data.token);
};

const signup = async (name: string, email: string, password: string) => {
  await new Promise(r => setTimeout(r, 600));

  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Signup failed');
  }

  setUser(data.user);
  localStorage.setItem('token', data.token); // Store the token instead of user ID
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

const updateUser = async (updates: Partial<User>) => {
  if (!user) return;

  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
    throw new Error(error.message || 'Failed to update user');
  }

  const data = await response.json();
  setUser(data.user);
};

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
