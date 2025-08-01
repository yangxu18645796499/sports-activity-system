import React, { useEffect } from 'react';
import { Layout, Typography, Button, Card, Row, Col, Space } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useStatsStore } from '../stores/useStatsStore';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, getProfile, _hasHydrated } = useAuthStore();
  const { stats, fetchStats, refreshStats, isLoading, error } = useStatsStore();

  useEffect(() => {
    // 获取用户信息
    if (isAuthenticated && !user) {
      getProfile().catch(() => {
        // 如果获取用户信息失败，可能token已过期
        logout();
        // 不再强制跳转，让路由组件处理
      });
    }
  }, [isAuthenticated, user, navigate, getProfile, logout]);

  useEffect(() => {
    // 获取统计数据 - 根据登录状态获取个人或默认数据
    fetchStats();
  }, [fetchStats, isAuthenticated, _hasHydrated]); // 添加认证状态依赖，状态变化时重新获取

  // 定期刷新统计数据
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleLogout = () => {
    logout();
    // 不再强制跳转，让路由组件处理
  };

  if (!user) {
    return null; // 或者显示加载状态
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-full max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-4">
            <Title level={3} className="m-0 text-blue-600">
              运动活动管理系统
            </Title>
          </div>
          
          <div className="flex items-center space-x-4">
            <Space>
              <Button 
                type="text" 
                icon={<UserOutlined />}
                onClick={() => navigate('/profile')}
                className="flex items-center"
              >
                <Text strong>{user.nickname || user.username}</Text>
              </Button>
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </Space>
          </div>
        </div>
      </Header>

      <Content className="bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* 欢迎区域 */}
          <div className="mb-8">
            <Title level={2} className="text-gray-800">
              欢迎回来，{user.nickname || user.username}！
            </Title>
            <Text type="secondary" className="text-lg">
              探索精彩的运动活动，开启健康生活
            </Text>
          </div>

          {/* 功能卡片 */}
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                className="text-center h-full"
                onClick={() => navigate('/activities')}
              >
                <CalendarOutlined className="text-4xl text-blue-500 mb-4" />
                <Title level={4}>浏览活动</Title>
                <Text type="secondary">发现感兴趣的运动活动</Text>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                className="text-center h-full"
                onClick={() => navigate('/my-activities')}
              >
                <TeamOutlined className="text-4xl text-green-500 mb-4" />
                <Title level={4}>我的活动</Title>
                <Text type="secondary">管理已报名的活动</Text>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                className="text-center h-full"
                onClick={() => navigate('/activities/create')}
              >
                <TrophyOutlined className="text-4xl text-orange-500 mb-4" />
                <Title level={4}>创建活动</Title>
                <Text type="secondary">组织新的运动活动</Text>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                className="text-center h-full"
                onClick={() => navigate('/profile')}
              >
                <UserOutlined className="text-4xl text-purple-500 mb-4" />
                <Title level={4}>个人中心</Title>
                <Text type="secondary">管理个人信息</Text>
              </Card>
            </Col>
            
            {/* 管理员功能 */}
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  className="text-center h-full"
                  onClick={() => navigate('/users')}
                >
                  <DatabaseOutlined className="text-4xl text-red-500 mb-4" />
                  <Title level={4}>用户管理</Title>
                  <Text type="secondary">查看和管理系统用户</Text>
                </Card>
              </Col>
            )}
          </Row>

          {/* 快速统计 */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card>
                <div className="text-center">
                  <TeamOutlined className="text-4xl text-blue-500 mb-2" />
                  <Title level={2} className="text-blue-600 mb-2">{stats?.registeredActivities || 0}</Title>
                  <Text type="secondary">已参加活动</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card>
                <div className="text-center">
                  <TrophyOutlined className="text-4xl text-green-500 mb-2" />
                  <Title level={2} className="text-green-600 mb-2">{stats?.createdActivities || 0}</Title>
                  <Text type="secondary">创建的活动</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card>
                <div className="text-center">
                  <CommentOutlined className="text-4xl text-orange-500 mb-2" />
                  <Title level={2} className="text-orange-600 mb-2">{stats?.comments || 0}</Title>
                  <Text type="secondary">活动评论</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;