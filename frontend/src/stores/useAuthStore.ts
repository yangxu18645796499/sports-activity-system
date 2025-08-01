import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../config/api';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const errorObj = error as { response?: { data?: { error?: string } } };
    return errorObj.response?.data?.error || defaultMessage;
  }
  return defaultMessage;
};

export interface User {
  id: string;
  email: string;
  username: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post('/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Login failed');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async userData => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post('/auth/register', userData);

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Registration failed');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      getProfile: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.get('/auth/profile');
          const { user } = response.data;

          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to get profile');
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateProfile: async userData => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.put('/auth/profile', userData);
          const { user } = response.data;

          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(
            error,
            'Failed to update profile'
          );
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async () => {
        const state = useAuthStore.getState();
        set({ _hasHydrated: true });

        if (state.token && state.user) {
          try {
            // 验证token是否仍然有效
            await get().getProfile();
            // 如果getProfile成功，说明token有效
            set({ isAuthenticated: true });
          } catch {
            // token无效，清除认证状态
            // Token expired or invalid, logging out
            get().logout();
          }
        } else {
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => _state => {
        // 状态恢复后异步验证认证状态
        setTimeout(() => {
          const currentState = useAuthStore.getState();
          currentState.initializeAuth();
        }, 0);
      },
    }
  )
);
