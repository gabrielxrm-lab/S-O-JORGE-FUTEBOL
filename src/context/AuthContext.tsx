import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../lib/api';

type Role = 'Jogador' | 'Membro' | 'Diretoria';

interface AuthContextType {
  role: Role;
  userName: string | null;
  userPhoto: string | null;
  permissions: string[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserPhoto: (photo: string | null) => void;
  canAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Jogador');
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const login = async (username: string, password: string) => {
    const correctPassword = import.meta.env.VITE_DIRETORIA_PASSWORD || 'admin123';
    
    // Default admin fallback
    if (username.toLowerCase() === 'admin' && password === correctPassword) {
      setRole('Diretoria');
      setUserName('Admin');
      setUserPhoto(null);
      setPermissions(['all']);
      return true;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const { user } = await res.json();
        setRole(user.role);
        setUserName(user.name);
        setUserPhoto(user.photo_file || null);
        setPermissions(user.permissions || (user.role === 'Diretoria' ? ['all'] : []));
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }

    return false;
  };

  const logout = () => {
    setRole('Jogador');
    setUserName(null);
    setUserPhoto(null);
    setPermissions([]);
  };

  const updateUserPhoto = (photo: string | null) => {
    setUserPhoto(photo);
  };

  const canAccess = (module: string) => {
    if (role === 'Diretoria') return true;
    if (permissions.includes('all')) return true;
    if (permissions.length > 0) return permissions.includes(module);
    return false;
  };

  return (
    <AuthContext.Provider value={{ role, userName, userPhoto, permissions, login, logout, updateUserPhoto, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
