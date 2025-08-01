import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import CreateActivity from './pages/CreateActivity';
import MyActivities from './pages/MyActivities';
import Profile from './pages/Profile';
import SimpleLogin from './pages/SimpleLogin';
import UserViewer from './pages/UserViewer';
import { useAuthStore } from './stores/useAuthStore';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  
  // 如果状态还没有恢复，显示加载状态
  if (!_hasHydrated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>加载中...</div>
      </div>
    );
  }
  
  // 如果未认证，不强制跳转，而是显示提示信息或返回null
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>请先登录</div>
        <a href="/login" style={{ marginTop: '10px' }}>前往登录</a>
      </div>
    );
  }
  
  return <>{children}</>;
};

// 公共路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  
  // 如果状态还没有恢复，显示加载状态
  if (!_hasHydrated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>加载中...</div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  const { token, getProfile, initializeAuth } = useAuthStore();

  useEffect(() => {
    // 延迟初始化认证状态，确保persist状态已恢复
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            {/* 公共路由 */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/simple-login" 
              element={<SimpleLogin />} 
            />
            
            {/* 受保护的路由 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/activities" 
              element={
                <ProtectedRoute>
                  <Activities />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/activities/:id" 
              element={
                <ProtectedRoute>
                  <ActivityDetail />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/activities/create" 
              element={
                <ProtectedRoute>
                  <CreateActivity />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-activities" 
              element={
                <ProtectedRoute>
                  <MyActivities />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-activity" 
              element={<Navigate to="/activities/create" replace />}
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <UserViewer />
                </ProtectedRoute>
              } 
            />
            
            {/* 默认重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App
