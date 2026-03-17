import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../lib/api';

type Role = 'Jogador' | 'Membro' | 'Diretoria';

interface AuthContextType {
  role: Role;
  userName: string | null;
  permissions: string[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Jogador');
  const [userName, setUserName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const login = async (username: string, password: string) => {
    const correctPassword = import.meta.env.VITE_DIRETORIA_PASSWORD || 'admin123';
    
    // Default admin fallback
    if (username.toLowerCase() === 'admin' && password === correctPassword) {
      setRole('Diretoria');
      setUserName('Admin');
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
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{ role, userName, permissions, login, logout }}>
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
