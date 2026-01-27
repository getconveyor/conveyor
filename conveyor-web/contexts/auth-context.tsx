"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService, User, LoginData, RegisterData } from "@/lib/api/auth";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  token: string | null;
  currentWorkspace: Workspace | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_tokens";
const USER_KEY = "auth_user";
const WORKSPACE_KEY = "currentWorkspaceId";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load tokens, user, and workspace from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedTokens = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        const storedWorkspaceId = localStorage.getItem(WORKSPACE_KEY);

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);

          setTokens(parsedTokens);
          setUser(parsedUser);

          // Load workspace if available
          if (storedWorkspaceId) {
            setCurrentWorkspace({
              id: storedWorkspaceId,
              name: "Current Workspace",
            });
          }

          // Optionally refresh the user data from the server
          try {
            const freshUser = await authService.getCurrentUser(
              parsedTokens.access
            );
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          } catch (error) {
            // If getting fresh user fails, clear user and tokens
            console.error("Failed to refresh user data:", error);
            setUser(null);
            setTokens(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(WORKSPACE_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to load auth from storage:", error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(WORKSPACE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = useCallback(
    async (data: LoginData) => {
      try {
        const response = await authService.login(data);

        setUser(response.user);
        setTokens(response.tokens);

        localStorage.setItem(TOKEN_KEY, JSON.stringify(response.tokens));
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        // Clear any previously selected workspace
        localStorage.removeItem("currentWorkspaceId");

        // Redirect to workspace selection
        const redirectUrl =
          sessionStorage.getItem("redirectAfterLogin") || "/select-workspace";
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        const response = await authService.register(data);

        setUser(response.user);
        setTokens(response.tokens);

        localStorage.setItem(TOKEN_KEY, JSON.stringify(response.tokens));
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        // Clear any previously selected workspace
        localStorage.removeItem("currentWorkspaceId");

        // Redirect to workspace selection
        router.push("/select-workspace");
      } catch (error) {
        console.error("Registration failed:", error);
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      if (tokens) {
        await authService.logout(tokens.refresh, tokens.access);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("currentWorkspaceId");
      router.push("/login");
    }
  }, [tokens, router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokens?.access) return;

    try {
      const freshUser = await authService.getCurrentUser(tokens.access);
      setUser(freshUser);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      throw error;
    }
  }, [tokens]);

  const value = {
    user,
    tokens,
    token: tokens?.access || null,
    currentWorkspace,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
