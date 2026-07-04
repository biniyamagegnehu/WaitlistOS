"use client";

import * as React from "react";
import axios from "axios";
import { User, Founder, AuthResponse } from "@/types/auth";
import { tokenStorage } from "@/lib/axios";
import { api } from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  founder: Founder | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse["data"]>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<AuthResponse["data"]>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  googleLogin: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [founder, setFounder] = React.useState<Founder | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const hasInitialized = React.useRef(false);

  const isAuthenticated = !!user;

  // Fetch current user
  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { user: User; founder?: Founder | null };
      }>(
        "/users/me"
      );
      setUser(response.data.data.user);
      setFounder(response.data.data.founder || null);
    } catch (error) {
      // If 401, user is not authenticated - clear tokens
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        tokenStorage.clearTokens();
        setUser(null);
        setFounder(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  React.useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const token = tokenStorage.getAccessToken();
    if (token) {
      const timer = window.setTimeout(() => {
        void fetchCurrentUser();
      }, 0);

      return () => window.clearTimeout(timer);
    } else {
      queueMicrotask(() => setIsLoading(false));
    }
  }, [fetchCurrentUser]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      const data = response.data.data;

      if (data.requiresTwoFactor) {
        return data;
      }

      if (data.accessToken && data.refreshToken) {
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
      }

      if (data.user) {
        setUser(data.user);
        setFounder(data.founder || null);
      }

      return data;
    },
    []
  );

  const register = React.useCallback(
    async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const response = await api.post<AuthResponse>("/auth/register", data);

      const responseData = response.data.data;

      if (responseData.accessToken && responseData.refreshToken) {
        tokenStorage.setTokens(responseData.accessToken, responseData.refreshToken);
      }

      if (responseData.user && responseData.accessToken) {
        setUser(responseData.user);
        setFounder(responseData.founder || null);
      }

      return responseData;
    },
    []
  );

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setFounder(null);
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const googleLogin = React.useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    const googleAuthUrl = `${apiUrl}/api/auth/google`;
    window.location.href = googleAuthUrl;
  }, []);

  const value: AuthContextValue = {
    user,
    founder,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    googleLogin,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useCurrentUser() {
  const { user, founder, isAuthenticated, isLoading } = useAuth();
  return { user, founder, isAuthenticated, isLoading };
}
