import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tabs, Empty, message, Spin, Tag, Modal, Typography } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, EyeOutlined, HeartOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../stores/useAuthStore';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { confirm } = Modal;

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  status: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  viewCount: number;
  likeCount: number;
  organizer: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Registration {
  id: string;
  status: string;
  participants: number;
  createdAt: string;
  activity: Activity;
}

const MyActivities: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [registeredActivities, setRegisteredActivities] = useState<Registration[]>([]);
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('registered');

  // 获取已报名的活动
  const fetchRegisteredActivities = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/users/${userId}/registered-activities`);
      if (response.data.success) {
        setRegisteredActivities(response.data.data.orders || []);
      }
    } catch (error: any) {
      console.error('获取已报名活动失败:', error);
      message.error(error.response?.data?.message || '获取已报名活动失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取创建的活动
  const fetchCreatedActivities = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/users/${userId}/created-activities`);
      if (response.data.success) {
        const processedActivities = response.data.data.activities.map((activity: any) => ({
          ...activity,
          images: typeof activity.images === 'string' ? JSON.parse(activity.images || '[]') : activity.images || []
        }));
        setCreatedActivities(processedActivities);
      }
    } catch (error: any) {
      console.error('获取创建的活动失败:', error);
      message.error(error.response?.data?.message || '获取创建的活动失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'registered') {
      fetchRegisteredActivities();
    } else {
      fetchCreatedActivities();
    }
  }, [activeTab]);

  // 获取活动状态
  const getActivityStatus = (activity: Activity) => {
    const now = dayjs();
    const registrationDeadline = dayjs(activity.registrationDeadline);
    const startTime = dayjs(activity.startTime);
    const endTime = dayjs(activity.endTime);
    
    if (now.isAfter(endTime)) {
      return { text: '已结束', color: 'default' };
    } else if (now.isAfter(startTime)) {
      return { text: '进行中', color: 'processing' };
    } else if (now.isAfter(registrationDeadline)) {
      return { text: '报名截止', color: 'warning' };
    } else if (activity.currentParticipants >= activity.maxParticipants) {
      return { text: '已满员', color: 'error' };
    } else {
      return { text: '报名中', color: 'success' };
    }
  };

  // 取消报名
  const handleCancelRegistration = (activityId: string, activityTitle: string) => {
    confirm({
      title: '确认取消报名',
      content: `确定要取消报名「${activityTitle}」吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/activities/${activityId}/cancel-registration`);
          message.success('取消报名成功');
          fetchRegisteredActivities();
        } catch (error: any) {
          message.error(error.response?.data?.message || '取消报名失败');
        }
      },
    });
  };

  // 删除活动
  const handleDeleteActivity = (activityId: string, activityTitle: string) => {
    confirm({
      title: '确认删除活动',
      content: `确定要删除活动「${activityTitle}」吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/activities/${activityId}`);
          message.success('删除活动成功');
          fetchCreatedActivities();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除活动失败');
        }
      },
    });
  };

  // 渲染活动卡片
  const renderActivityCard = (activity: Activity, isRegistered = false, registration?: Registration) => {
    const status = getActivityStatus(activity);
    
    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={activity.id}>
        <Card
          hoverable
          cover={
            activity.coverImage ? (
              <img
                alt={activity.title}
                src={activity.coverImage}
                style={{ height: 200, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              >
                {activity.title.charAt(0)}
              </div>
            )
          }
          actions={[
            <Button
              key="view"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/activities/${activity.id}`)}
            >
              查看详情
            </Button>,
            ...(isRegistered ? [
              <Button
                key="cancel"
                type="text"
                danger
                onClick={() => handleCancelRegistration(activity.id, activity.title)}
              >
                取消报名
              </Button>
            ] : [
              <Button
                key="edit"
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/activities/${activity.id}/edit`)}
              >
                编辑
              </Button>,
              <Button
                key="delete"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteActivity(activity.id, activity.title)}
              >
                删除
              </Button>
            ])
          ]}
        >
          <div style={{ marginBottom: '12px' }}>
            <Tag color={status.color}>{status.text}</Tag>
            <Tag color="blue">{activity.category}</Tag>
          </div>
          
          <Card.Meta
            title={
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                {activity.title}
              </div>
            }
            description={
              <div>
                <div style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                  {activity.description.length > 60 
                    ? `${activity.description.substring(0, 60)}...` 
                    : activity.description
                  }
                </div>
                
                <div style={{ marginBottom: '6px', fontSize: '13px' }}>
                  <CalendarOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                  {dayjs(activity.startTime).format('MM-DD HH:mm')}
                </div>
                
                <div style={{ marginBottom: '6px', fontSize: '13px' }}>
                  <EnvironmentOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                  {activity.location}
                </div>
                
                <div style={{ marginBottom: '6px', fontSize: '13px' }}>
                  <UserOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                  {activity.currentParticipants}/{activity.maxParticipants}人
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f50' }}>
                    {activity.price === 0 ? '免费' : `¥${activity.price}`}
                  </span>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    <EyeOutlined style={{ marginRight: '4px' }} />
                    {activity.viewCount}
                    <HeartOutlined style={{ marginLeft: '8px', marginRight: '4px' }} />
                    {activity.likeCount}
                  </div>
                </div>
                
                {isRegistered && registration && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    报名时间: {dayjs(registration.createdAt).format('YYYY-MM-DD HH:mm')}
                    <br />
                    报名人数: {registration.participants}人
                  </div>
                )}
              </div>
            }
          />
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>我的活动</Title>
          <Text type="secondary">管理您参与和创建的活动</Text>
        </div>
        <Button 
          icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          size="large"
        >
          返回首页
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab={`已报名活动 (${registeredActivities.length})`} key="registered">
          <Spin spinning={loading}>
            {registeredActivities.length > 0 ? (
              <Row gutter={[16, 16]}>
                {registeredActivities.map((registration) => 
                  renderActivityCard(registration.activity, true, registration)
                )}
              </Row>
            ) : (
              <Empty
                description="暂无已报名的活动"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/activities')}>
                  去报名活动
                </Button>
              </Empty>
            )}
          </Spin>
        </TabPane>
        
        <TabPane tab={`创建的活动 (${createdActivities.length})`} key="created">
          <Spin spinning={loading}>
            {createdActivities.length > 0 ? (
              <Row gutter={[16, 16]}>
                {createdActivities.map((activity) => 
                  renderActivityCard(activity, false)
                )}
              </Row>
            ) : (
              <Empty
                description="暂无创建的活动"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/activities/create')}>
                  创建活动
                </Button>
              </Empty>
            )}
          </Spin>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MyActivities;