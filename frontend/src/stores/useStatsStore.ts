import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

interface UserStats {
  createdActivities: number;
  registeredActivities: number;
  comments: number;
}

interface StatsState {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearError: () => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { isAuthenticated, token } = useAuthStore.getState();
      
      if (!isAuthenticated || !token) {
        set({ 
          stats: null,
          isLoading: false,
          error: '用户未登录' 
        });
        return;
      }
      
      // 直接从数据库获取用户统计数据
      const response = await fetch('/api/users/me/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取统计数据失败: ${response.status}`);
      }
      
      const data = await response.json();
      set({ 
        stats: data.data || data,
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      set({ 
        stats: null,
        isLoading: false,
        error: error.message || '获取统计数据失败'
      });
    }
  },

  refreshStats: async () => {
    // 直接调用fetchStats方法，避免重复代码和API调用问题
    const store = useStatsStore.getState();
    await store.fetchStats();
  },

  clearError: () => {
    set({ error: null });
  }
}));