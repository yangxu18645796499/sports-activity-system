import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Card, Form, Input, Button, Avatar, message,
  Row, Col, Typography, Divider, Space, Descriptions,
  Spin, Alert
} from 'antd';
import {
  UserOutlined, EditOutlined, SaveOutlined, CameraOutlined,
  ArrowLeftOutlined, MailOutlined, PhoneOutlined, CalendarOutlined,
  TeamOutlined, TrophyOutlined, CommentOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useStatsStore } from '../stores/useStatsStore';


const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface ProfileFormData {
  username: string;
  nickname?: string;
  email: string;
  phone?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, updateProfile, getProfile, isLoading, error, clearError, _hasHydrated } = useAuthStore();
  const { stats, fetchStats, refreshStats } = useStatsStore();
  const [form] = Form.useForm<ProfileFormData>();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // 获取完整的头像URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) {
      // 添加时间戳避免缓存问题
      return `${avatar}?t=${Date.now()}`;
    }
    return `http://localhost:3000${avatar}?t=${Date.now()}`;
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        nickname: user.nickname || '',
        email: user.email,
        phone: user.phone || ''
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    // 获取统计数据 - 根据登录状态获取个人或默认数据
    fetchStats();
  }, [fetchStats, user]); // 用户信息变化时重新获取

  // 定期刷新统计数据
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleEdit = () => {
    setIsEditing(true);
    // 重置头像选择状态
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      form.setFieldsValue({
        username: user.username,
        nickname: user.nickname || '',
        email: user.email,
        phone: user.phone || ''
      });
    }
    // 重置头像选择状态
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl('');
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);

    if (!token) {
      throw new Error('未找到认证token，请重新登录');
    }

    const response = await fetch('http://localhost:3000/api/auth/upload-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('头像上传失败');
    }

    const result = await response.json();
    return result.avatarUrl;
  };

  const handleSubmit = async (values: ProfileFormData) => {
    try {
      setSubmitting(true);
      
      const updateData: any = {
        username: values.username,
        nickname: values.nickname,
        email: values.email,
        phone: values.phone
      };

      let avatarUploaded = false;
      
      // 如果有选择的新头像文件，先上传头像
      if (selectedAvatarFile) {
        try {
          const avatarUrl = await uploadAvatar(selectedAvatarFile);
          updateData.avatar = avatarUrl;
          avatarUploaded = true;
          message.success('头像上传成功！');
        } catch (error) {
          message.error('头像上传失败，请重试');
          return;
        }
      }

      // 检查是否有其他字段需要更新
      const hasOtherUpdates = user && (
        updateData.username !== user.username ||
        updateData.nickname !== user.nickname ||
        updateData.email !== user.email ||
        updateData.phone !== user.phone
      );

      // 如果有头像上传或其他字段更新，都调用updateProfile
      if (hasOtherUpdates || avatarUploaded) {
        await updateProfile(updateData);
        
        // 重新获取用户信息以确保数据同步
        await getProfile();
        
        message.success(avatarUploaded && hasOtherUpdates ? '头像和个人信息更新成功！' : 
                       avatarUploaded ? '头像更新成功！' : '个人信息更新成功！');
      }
      
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl('');
    } catch (error) {
      message.error('更新个人信息失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理头像文件选择
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return;
    }

    // 验证文件大小
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return;
    }

    // 设置选中的文件
    setSelectedAvatarFile(file);

    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 获取当前显示的头像URL
  const getCurrentAvatarUrl = () => {
    if (avatarPreviewUrl) {
      return avatarPreviewUrl; // 显示新选择的头像预览
    }
    return getAvatarUrl(user?.avatar); // 显示当前用户头像
  };

  if (!user) {
    return (
      <Layout className="min-h-screen">
        <Content className="flex items-center justify-center">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-full max-w-4xl mx-auto px-4">
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
              type="text"
            >
              返回首页
            </Button>
            <Title level={3} className="m-0 text-blue-600">
              个人中心
            </Title>
          </Space>
          {!isEditing && (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑资料
            </Button>
          )}
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-4xl mx-auto">
          <Row gutter={[24, 24]}>
            {/* 左侧：头像和基本信息 */}
            <Col xs={24} lg={8}>
              <Card className="text-center">
                <div className="mb-6">
                  <div className="relative inline-block">
                    {/* 头像显示 */}
                    <Avatar 
                      size={120} 
                      src={getCurrentAvatarUrl()} 
                      icon={<UserOutlined />}
                      className="mb-4"
                    />
                    
                    {/* 编辑模式下的头像上传按钮 */}
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <div className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors">
                            <CameraOutlined className="text-sm" />
                          </div>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleAvatarSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* 编辑模式下的提示文字 */}
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-2">
                      点击相机图标更换头像
                    </div>
                  )}
                </div>
                
                <Title level={4} className="mb-2">
                  {user.nickname || user.username}
                </Title>
                <Text type="secondary" className="block mb-4">
                  @{user.username}
                </Text>
                
                <Descriptions column={1} size="small">
                  <Descriptions.Item 
                    label={<><MailOutlined /> 邮箱</>}
                  >
                    {user.email}
                  </Descriptions.Item>
                  {user.phone && (
                    <Descriptions.Item 
                      label={<><PhoneOutlined /> 手机</>}
                    >
                      {user.phone}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item 
                    label={<><CalendarOutlined /> 注册时间</>}
                  >
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* 右侧：详细信息编辑 */}
            <Col xs={24} lg={16}>
              <Card 
                title="个人信息" 
                extra={
                  isEditing && (
                    <Space>
                      <Button onClick={handleCancel}>
                        取消
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                        loading={submitting}
                      >
                        保存
                      </Button>
                    </Space>
                  )
                }
              >
                {isLoading && (
                  <div className="text-center py-8">
                    <Spin size="large" />
                  </div>
                )}
                
                {!isLoading && (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    disabled={!isEditing}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="username"
                          label="用户名"
                          rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' },
                            { max: 20, message: '用户名不能超过20个字符' },
                            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                          ]}
                        >
                          <Input 
                            placeholder="请输入用户名"
                            disabled={!isEditing}
                          />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="nickname"
                          label="昵称"
                          rules={[
                            { max: 50, message: '昵称不能超过50个字符' }
                          ]}
                        >
                          <Input 
                            placeholder="请输入昵称（可选）"
                            disabled={!isEditing}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="email"
                          label="邮箱"
                          rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                          ]}
                        >
                          <Input 
                            placeholder="请输入邮箱"
                            disabled={!isEditing}
                          />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phone"
                          label="手机号"
                          rules={[
                            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                          ]}
                        >
                          <Input 
                            placeholder="请输入手机号（可选）"
                            disabled={!isEditing}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {isEditing && (
                      <>
                        <Divider />
                        <Alert
                          message="提示"
                          description="修改用户名和邮箱可能需要重新验证，请谨慎操作。"
                          type="info"
                          showIcon
                          className="mb-4"
                        />
                      </>
                    )}
                  </Form>
                )}
              </Card>

              {/* 账户统计信息 */}
              <Card title="账户统计" className="mt-6">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <TeamOutlined className="text-3xl text-blue-500 mb-2" />
                      <Title level={3} className="text-blue-600 mb-1">{stats?.registeredActivities || 0}</Title>
                      <Text type="secondary">参与活动</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrophyOutlined className="text-3xl text-green-500 mb-2" />
                      <Title level={3} className="text-green-600 mb-1">{stats?.createdActivities || 0}</Title>
                      <Text type="secondary">创建活动</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <CommentOutlined className="text-3xl text-purple-500 mb-2" />
                      <Title level={3} className="text-purple-600 mb-1">{stats?.comments || 0}</Title>
                      <Text type="secondary">活动评论</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>


    </Layout>
  );
};

export default Profile;