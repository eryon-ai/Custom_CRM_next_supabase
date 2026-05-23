import { create } from 'zustand';
import type { RoleId } from '@/config/permissions';

// ============================================================
// Auth Store — User session & role management
// ============================================================

export interface AuthState {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: RoleId;
    agentId?: string;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
