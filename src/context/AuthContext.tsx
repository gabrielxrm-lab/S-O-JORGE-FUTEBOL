import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'Jogador' | 'Diretoria';

interface AuthContextType {
  role: Role;
  loginAsDiretoria: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Jogador');

  const loginAsDiretoria = (password: string) => {
    // In a real app, this should be validated on the backend.
    // For this prototype, we'll use a simple check.
    const correctPassword = import.meta.env.VITE_DIRETORIA_PASSWORD || 'admin123';
    if (password === correctPassword) {
      setRole('Diretoria');
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole('Jogador');
  };

  return (
    <AuthContext.Provider value={{ role, loginAsDiretoria, logout }}>
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
