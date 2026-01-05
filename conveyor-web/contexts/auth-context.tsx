"use client";

import { createContext, useContext } from "react";

interface Workspace {
  id: string;
  name: string;
}

interface AuthContextType {
  token: string | null;
  currentWorkspace: Workspace | null;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  currentWorkspace: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // For now, return a basic implementation
  // This should be connected to your actual auth system
  const value: AuthContextType = {
    token: null,
    currentWorkspace: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
