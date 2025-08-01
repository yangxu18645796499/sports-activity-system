import axios from 'axios';

// API基础配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 创建axios实例
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 登录和注册请求不需要Authorization头
    const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
    
    if (!isAuthRequest) {
      // 从localStorage获取token (zustand persist存储)
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to parse auth storage:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误（未授权）
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('auth-storage');
      
      // 同步更新zustand store状态
      // 动态导入useAuthStore以避免循环依赖
      import('../stores/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      }).catch(console.error);
    }
    return Promise.reject(error);
  }
);

export default api;