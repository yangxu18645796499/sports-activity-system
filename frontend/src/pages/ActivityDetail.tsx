import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Button, Tag, Descriptions, Image, Avatar, List,
  Rate, Input, Form, Modal, InputNumber, message, Spin, Divider,
  Space, Typography, Badge
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, PhoneOutlined,
  MailOutlined, HeartOutlined, ShareAltOutlined, EyeOutlined,
  ClockCircleOutlined, DollarOutlined, TeamOutlined, ArrowLeftOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../config/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

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
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  images?: string[];
  coverImage?: string;
  tags?: string[];
  requirements?: string;
  contactInfo?: string;
  isRecommended: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  organizer: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
    email: string;
    phone?: string;
  };


  participants?: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  }[];
  comments?: ActivityComment[];
}

interface ActivityComment {
  id: string;
  content: string;
  rating?: number;
  images?: string[];
  likeCount: number;
  createdAt: string;
  isLiked?: boolean;
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  likes?: {
    id: string;
    user: {
      id: string;
      username: string;
      nickname?: string;
      avatar?: string;
    };
  }[];
  replies?: ActivityComment[];
}

interface RegistrationForm {
  participants: number;
  notes?: string;
}

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationOrder, setRegistrationOrder] = useState<any>(null);
  const [form] = Form.useForm<RegistrationForm>();
  const [commentForm] = Form.useForm();
  const [commentLikeLoading, setCommentLikeLoading] = useState<string | null>(null);
  const [deleteCommentLoading, setDeleteCommentLoading] = useState<string | null>(null);

  // 处理评论点赞
  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      return;
    }

    if (commentLikeLoading === commentId) return;

    try {
      setCommentLikeLoading(commentId);
      const response = await api.post(`/comments/${commentId}/like`);
      
      if (response.data.success) {
        message.success(response.data.message);
        
        // 更新本地状态
        setActivity(prev => {
          if (!prev) return prev;
          
          const updatedComments = prev.comments?.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: response.data.data.liked,
                likeCount: response.data.data.likeCount
              };
            }
            return comment;
          });
          
          return {
            ...prev,
            comments: updatedComments
          };
        });
      }
    } catch (error: any) {
      console.error('评论点赞操作失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setCommentLikeLoading(null);
    }
  };

  // 处理删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      return;
    }

    if (deleteCommentLoading === commentId) return;

    try {
      setDeleteCommentLoading(commentId);
      
      const response = await api.delete(`/comments/${commentId}`);
      
      if (response.data.success) {
        message.success('评论删除成功');
        
        // 更新本地状态
        setActivity(prev => {
          if (!prev) return prev;
          
          const updatedComments = prev.comments?.filter(comment => comment.id !== commentId);
          
          return {
            ...prev,
            comments: updatedComments
          };
        });
      }
    } catch (error: any) {
      console.error('删除评论失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    } finally {
      setDeleteCommentLoading(null);
    }
  };

  // 检查报名状态
  const checkRegistrationStatus = async () => {
    if (!id) return;
    
    try {
      console.log('🔍 [DEBUG] checkRegistrationStatus - 检查活动报名状态');
      console.log('🔍 [DEBUG] 认证状态:', isAuthenticated);
      console.log('🔍 [DEBUG] 用户信息:', user);
      
      if (!isAuthenticated) {
        console.warn('⚠️ [DEBUG] checkRegistrationStatus - 用户未登录');
        setIsRegistered(false);
        setRegistrationOrder(null);
        return;
      }
      
      const response = await api.get(`/activities/${id}/registration-status`);
      
      console.log('✅ [DEBUG] checkRegistrationStatus - 请求成功:', response.data);
      
      if (response.data.success) {
        setIsRegistered(response.data.data.isRegistered);
        setRegistrationOrder(response.data.data.order);
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] checkRegistrationStatus - 请求失败:', error);
      console.error('❌ [DEBUG] checkRegistrationStatus - 错误详情:', error.response?.data);
      setIsRegistered(false);
      setRegistrationOrder(null);
    }
  };

  // 检查评论点赞状态
  const checkCommentLikeStatus = async (comments: ActivityComment[]) => {
    if (!isAuthenticated || !comments.length) return comments;
    
    try {
      const commentsWithLikeStatus = await Promise.all(
        comments.map(async (comment) => {
          try {
            const response = await api.get(`/comments/${comment.id}/like-status`);
            return {
              ...comment,
              isLiked: response.data.data.liked
            };
          } catch (error) {
            console.error(`检查评论 ${comment.id} 点赞状态失败:`, error);
            return {
              ...comment,
              isLiked: false
            };
          }
        })
      );
      return commentsWithLikeStatus;
    } catch (error) {
      console.error('检查评论点赞状态失败:', error);
      return comments.map(comment => ({ ...comment, isLiked: false }));
    }
  };

  // 获取活动详情
  const fetchActivityDetail = async (shouldUpdateView = true) => {
    console.log('📋 [DEBUG] fetchActivityDetail 函数被调用');
    console.log('📋 [DEBUG] shouldUpdateView:', shouldUpdateView);
    console.log('📋 [DEBUG] viewCountUpdated:', viewCountUpdated);
    
    try {
      setLoading(true);
      console.log('🚀 [DEBUG] 开始获取活动详情...');
      const response = await api.get(`/activities/${id}`);
      console.log('✅ [DEBUG] 活动详情获取成功:', response.data);
      
      const activityData = response.data.data;
      
      // 检查评论点赞状态
      if (activityData.comments && activityData.comments.length > 0) {
        const commentsWithLikeStatus = await checkCommentLikeStatus(activityData.comments);
        activityData.comments = commentsWithLikeStatus;
      }
      
      setActivity(activityData);
      
      // 增加浏览量（只在首次访问时调用一次）
      if (shouldUpdateView && !viewCountUpdated) {
        try {
          console.log('👁️ [DEBUG] 开始更新浏览量...');
          await api.post(`/activities/${id}/view`);
          console.log('✅ [DEBUG] 浏览量更新成功');
          setViewCountUpdated(true);
        } catch (viewError) {
          console.log('❌ [DEBUG] 更新浏览量失败:', viewError);
          console.warn('更新浏览量失败:', viewError);
          // 浏览量更新失败不影响页面显示
        }
      } else {
        console.log('⏭️ [DEBUG] 跳过浏览量更新 (shouldUpdateView:', shouldUpdateView, ', viewCountUpdated:', viewCountUpdated, ')');
      }
    } catch (error: any) {
      console.log('❌ [DEBUG] 获取活动详情失败:', error);
      console.log('❌ [DEBUG] 错误响应状态:', error.response?.status);
      console.log('❌ [DEBUG] 错误响应数据:', error.response?.data);
      message.error(error.response?.data?.message || '获取活动详情失败');
      navigate('/activities');
    } finally {
      setLoading(false);
      console.log('🏁 [DEBUG] fetchActivityDetail 完成');
    }
  };

  // 检查点赞状态
  const checkLikeStatus = async () => {
    console.log('🔍 [DEBUG] checkLikeStatus 函数被调用');
    console.log('🔍 [DEBUG] 活动ID:', id);
    console.log('🔍 [DEBUG] 认证状态:', isAuthenticated);
    console.log('🔍 [DEBUG] 用户信息:', user);
    
    if (!id || !isAuthenticated) {
      console.log('❌ [DEBUG] 活动ID不存在或用户未登录，跳过点赞状态检查');
      return;
    }
    
    try {
      console.log('🚀 [DEBUG] 开始检查点赞状态...');
      
      const response = await api.get(`/activities/${id}/like-status`);
      console.log('✅ [DEBUG] 点赞状态检查响应:', response.data);
      
      if (response.data.success) {
        console.log('✅ [DEBUG] 点赞状态检查成功，设置状态为:', response.data.data.isLiked);
        setLiked(response.data.data.isLiked);
      } else {
        console.log('❌ [DEBUG] 点赞状态检查返回失败状态:', response.data);
        setLiked(false);
      }
    } catch (error: any) {
      console.log('❌ [DEBUG] 检查点赞状态发生错误:', error);
      console.log('❌ [DEBUG] 错误响应状态:', error.response?.status);
      console.log('❌ [DEBUG] 错误响应数据:', error.response?.data);
      console.error('检查点赞状态失败:', error);
      setLiked(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [DEBUG] useEffect 被触发');
    console.log('🔄 [DEBUG] 活动ID:', id);
    console.log('🔄 [DEBUG] 认证状态:', isAuthenticated);
    console.log('🔄 [DEBUG] 用户信息:', user);
    
    if (id) {
      console.log('📋 [DEBUG] 开始获取活动详情...');
      fetchActivityDetail();
      
      // 只有在用户已登录时才检查报名状态和点赞状态
      if (isAuthenticated && user) {
        console.log('👤 [DEBUG] 用户已登录，检查报名状态和点赞状态');
        checkRegistrationStatus();
        checkLikeStatus();
      } else {
        console.log('🚫 [DEBUG] 用户未登录，重置状态');
        // 用户未登录时重置状态
        setIsRegistered(false);
        setRegistrationOrder(null);
        setLiked(false);
      }
    } else {
      console.log('❌ [DEBUG] 活动ID不存在');
    }
  }, [id, isAuthenticated, user]);

  // 处理URL锚点跳转
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && activity) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500); // 等待页面渲染完成
    }
  }, [activity]);

  // 处理报名
  const handleRegistration = async (values: RegistrationForm) => {
    try {
      setRegistering(true);
      
      console.log('📝 [DEBUG] handleRegistration - 开始报名流程');
      console.log('📝 [DEBUG] 认证状态:', isAuthenticated);
      console.log('📝 [DEBUG] 用户信息:', user);
      
      if (!isAuthenticated) {
        message.error('请先登录后再报名');
        setRegistering(false);
        return;
      }
      
      await api.post(`/activities/${id}/register`, values);
      
      console.log('✅ [DEBUG] handleRegistration - 报名请求成功');
      message.success('报名成功！');
      setShowRegistrationModal(false);
      form.resetFields();
      fetchActivityDetail(false); // 刷新数据，不增加浏览量
      checkRegistrationStatus(); // 更新报名状态
    } catch (error: any) {
      console.error('❌ [DEBUG] handleRegistration - 报名请求失败:', error);
      console.error('❌ [DEBUG] handleRegistration - 错误详情:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('请先登录后再报名');
      } else {
        message.error(error.response?.data?.message || '报名失败');
      }
    } finally {
      setRegistering(false);
    }
  };

  // 处理取消报名
  const handleCancelRegistration = async () => {
    try {
      setRegistering(true);
      
      console.log('🗑️ [DEBUG] handleCancelRegistration - 开始取消报名流程');
      
      if (!isAuthenticated) {
        message.error('请先登录');
        setRegistering(false);
        return;
      }
      
      await api.delete(`/activities/${id}/register`);
      
      console.log('✅ [DEBUG] handleCancelRegistration - 取消报名请求成功');
      
      message.success('已取消报名');
      
      // 重新获取活动详情和报名状态
      fetchActivityDetail(false); // 刷新数据，不增加浏览量
      checkRegistrationStatus(); // 更新报名状态
      
      console.log('🔄 [DEBUG] handleCancelRegistration - 状态更新完成');
    } catch (error: any) {
      console.error('❌ [DEBUG] handleCancelRegistration - 取消报名失败:', error);
      message.error(error.response?.data?.message || '取消报名失败，请重试');
    } finally {
      setRegistering(false);
    }
  };

  // 处理点赞
  const handleLike = async () => {
    console.log('🔥 [DEBUG] handleLike 函数被调用');
    console.log('🔥 [DEBUG] 活动ID:', id);
    console.log('🔥 [DEBUG] 认证状态:', isAuthenticated);
    console.log('🔥 [DEBUG] 用户信息:', user);
    console.log('🔥 [DEBUG] 当前点赞状态:', liked);
    
    if (!id) {
      console.log('❌ [DEBUG] 活动ID不存在，退出');
      return;
    }
    
    // 检查用户是否已登录
    if (!isAuthenticated || !user) {
      console.log('❌ [DEBUG] 用户未登录，跳转到登录页面');
      message.warning('请先登录后再进行点赞操作');
      navigate('/login');
      return;
    }
    
    try {
      console.log('🚀 [DEBUG] 开始发送点赞请求...');
      
      const response = await api.post(`/activities/${id}/like`);
      console.log('✅ [DEBUG] 点赞请求响应:', response.data);
      
      if (response.data.success) {
        console.log('✅ [DEBUG] 点赞操作成功');
        console.log('✅ [DEBUG] 新的点赞状态:', response.data.data.liked);
        // 更新点赞状态
        setLiked(response.data.data.liked);
        console.log('🔄 [DEBUG] 开始重新获取活动详情...');
        // 重新获取活动详情以更新点赞数
        await fetchActivityDetail(false);
        console.log('✅ [DEBUG] 活动详情更新完成');
      } else {
        console.log('❌ [DEBUG] 点赞请求返回失败状态:', response.data);
      }
    } catch (error: any) {
      console.log('❌ [DEBUG] 点赞请求发生错误:', error);
      console.log('❌ [DEBUG] 错误响应状态:', error.response?.status);
      console.log('❌ [DEBUG] 错误响应数据:', error.response?.data);
      
      // 如果是401错误，说明用户未登录，提示登录
      if (error.response?.status === 401) {
        console.log('❌ [DEBUG] 401错误 - 用户未授权');
        alert('请先登录后再进行点赞操作');
      } else {
        console.error('点赞操作失败:', error);
        alert('点赞操作失败，请稍后重试');
      }
    }
  };

  // 处理分享
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: activity?.title,
          text: activity?.description,
          url: window.location.href
        });
        
        // 增加分享数
        await api.post(`/activities/${id}/share`);
        if (activity) {
          setActivity({
            ...activity,
            shareCount: activity.shareCount + 1
          });
        }
      } else {
        // 如果不支持原生分享，复制链接到剪贴板
        await navigator.clipboard.writeText(window.location.href);
        message.success('链接已复制到剪贴板');
        
        // 增加分享数
        await api.post(`/activities/${id}/share`);
        if (activity) {
          setActivity({
            ...activity,
            shareCount: activity.shareCount + 1
          });
        }
      }
    } catch (error) {
      console.error('分享失败:', error);
      message.error('分享失败，请稍后重试');
    }
  };

  // 处理评论提交
  const handleCommentSubmit = async (values: any) => {
    try {
      console.log('💬 [DEBUG] handleCommentSubmit - 开始提交评论');
      console.log('💬 [DEBUG] 认证状态:', isAuthenticated);
      console.log('💬 [DEBUG] 用户信息:', user);
      
      if (!isAuthenticated) {
        message.error('请先登录后再评论');
        return;
      }
      
      await api.post(`/activities/${id}/comments`, values);
      
      console.log('✅ [DEBUG] handleCommentSubmit - 评论提交成功');
      message.success('评论提交成功');
      setShowCommentModal(false);
      commentForm.resetFields();
      fetchActivityDetail(false); // 刷新数据，不增加浏览量
    } catch (error: any) {
      console.error('❌ [DEBUG] handleCommentSubmit - 评论提交失败:', error);
      console.error('❌ [DEBUG] handleCommentSubmit - 错误详情:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('请先登录后再评论');
      } else {
        message.error(error.response?.data?.message || '评论失败');
      }
    }
  };

  // 处理删除活动
  const handleDeleteActivity = async () => {
    if (!activity || !user) {
      return;
    }
    
    // 检查是否是活动创建者
    if (activity.organizer.id === user.id) {
      try {
        // 调用删除API
        await api.delete(`/activities/delete-by-name/${encodeURIComponent(activity.title)}`);
        message.success('活动删除成功');
      } catch (error: any) {
        console.error('删除活动失败:', error);
        message.error('删除活动失败');
      }
    }
    
    // 跳转到活动列表页面
    window.location.href = 'http://localhost:5180/activities';
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  // 计算剩余名额
  const getRemainingSlots = () => {
    if (!activity) return 0;
    return activity.maxParticipants - activity.currentParticipants;
  };

  // 检查是否可以报名
  const canRegister = () => {
    if (!activity) return false;
    if (isRegistered) return false; // 已报名则不能再报名
    
    if (activity.status === 'CANCELLED') {
      return false;
    }
    
    const now = dayjs();
    const registrationDeadline = dayjs(activity.registrationDeadline);
    const startTime = dayjs(activity.startTime);
    const endTime = dayjs(activity.endTime);
    
    // 活动已结束或已开始则不能报名
    if (now.isAfter(endTime) || now.isAfter(startTime)) {
      return false;
    }
    
    // 报名截止时间已过则不能报名
    if (now.isAfter(registrationDeadline)) {
      return false;
    }
    
    // 名额已满则不能报名
    if (getRemainingSlots() <= 0) {
      return false;
    }
    
    return true;
  };

  // 获取状态标签颜色
  const getStatusColor = (statusText: string) => {
    switch (statusText) {
      case '报名中': return 'green';
      case '进行中': return 'blue';
      case '报名截止': return 'orange';
      case '已结束': return 'default';
      case '已取消': return 'red';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (activity: Activity) => {
    if (activity.status === 'CANCELLED') {
      return '已取消';
    }
    
    const now = dayjs();
    const registrationDeadline = dayjs(activity.registrationDeadline);
    const startTime = dayjs(activity.startTime);
    const endTime = dayjs(activity.endTime);
    
    if (now.isAfter(endTime)) {
      return '已结束';
    } else if (now.isAfter(startTime)) {
      return '进行中';
    } else if (now.isAfter(registrationDeadline)) {
      return '报名截止';
    } else {
      return '报名中';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>活动不存在</Title>
        <Button type="primary" onClick={() => navigate('/activities')}>
          返回活动列表
        </Button>
      </div>
    );
  }

  return (
    <div className="activity-detail" style={{ padding: '24px' }}>
      {/* 返回按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/activities')}
          type="text"
        >
          返回活动列表
        </Button>
      </div>
      
      <Row gutter={[24, 24]}>
        {/* 左侧主要内容 */}
        <Col xs={24} lg={16}>
          {/* 活动基本信息 */}
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Space>
                {activity.isRecommended && (
                  <Tag color="red">推荐</Tag>
                )}
                <Tag color={getStatusColor(getStatusText(activity))}>
                  {getStatusText(activity)}
                </Tag>
                <Tag>{activity.category}</Tag>
              </Space>
            </div>
            
            <Title level={2}>{activity.title}</Title>
            
            <div style={{ marginBottom: '24px' }}>
              <Space size="large">
                <Space>
                  <EyeOutlined />
                  <Text type="secondary">{Math.floor(activity.viewCount / 2)}</Text>
                </Space>
                <Space>
                  <HeartOutlined style={{ color: liked ? '#ff4d4f' : undefined }} />
                  <Text type="secondary">{activity.likeCount}</Text>
                </Space>
                <Space>
                  <ShareAltOutlined />
                  <Text type="secondary">{activity.shareCount}</Text>
                </Space>
              </Space>
            </div>

            {/* 活动图片 */}
            {(() => {
              console.log(`[活动详情封面调试] 活动ID: ${activity.id}, 标题: ${activity.title}`);
              console.log(`[活动详情封面调试] coverImage: ${activity.coverImage || '未设置'}`);
              console.log(`[活动详情封面调试] images数组:`, activity.images);
              
              // 构建显示图片数组，优先显示封面图片
              const displayImages = [];
              if (activity.coverImage) {
                displayImages.push(activity.coverImage);
                console.log(`[活动详情封面调试] 添加封面图片: ${activity.coverImage}`);
              }
              if (activity.images) {
                // 添加其他图片，但排除已经作为封面的图片
                activity.images.forEach(img => {
                  if (img !== activity.coverImage) {
                    displayImages.push(img);
                  }
                });
              }
              
              console.log(`[活动详情封面调试] 最终显示图片数组:`, displayImages);
              
              return displayImages.length > 0 ? (
                <div style={{ marginBottom: '24px' }}>
                  <Image.PreviewGroup>
                    <Row gutter={[8, 8]}>
                      {displayImages.map((image, index) => (
                        <Col key={index} xs={12} sm={8} md={6}>
                          <Image
                            src={image}
                            alt={`${activity.title}-${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: 120, 
                              objectFit: 'cover', 
                              borderRadius: 8,
                              border: index === 0 && activity.coverImage ? '2px solid #1890ff' : 'none'
                            }}
                            onLoad={() => console.log(`[活动详情封面调试] 图片加载成功: ${image}`)}
                            onError={(e) => {
                              console.error(`[活动详情封面调试] 图片加载失败: ${image}`, e);
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Image.PreviewGroup>
                </div>
              ) : null;
            })()}

            {/* 活动描述 */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>活动介绍</Title>
              <Paragraph>{activity.description}</Paragraph>
            </div>

            {/* 活动要求 */}
            {activity.requirements && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>参与要求</Title>
                <Paragraph>{activity.requirements}</Paragraph>
              </div>
            )}

            {/* 活动标签 */}
            {activity.tags && activity.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>活动标签</Title>
                <Space wrap>
                  {activity.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>

          {/* 参与者列表 */}
          {activity.participants && activity.participants.length > 0 && (
            <Card title="参与者" style={{ marginTop: '24px' }}>
              <List
                grid={{ gutter: 16, xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }}
                dataSource={activity.participants}
                renderItem={participant => (
                  <List.Item>
                    <div style={{ textAlign: 'center' }}>
                      <Avatar
                        src={participant.avatar}
                        size={48}
                        style={{ marginBottom: '8px' }}
                      >
                        {participant.nickname?.[0] || participant.username[0]}
                      </Avatar>
                      <div style={{ fontSize: '12px' }}>
                        {participant.nickname || participant.username}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* 评论区 */}
          <Card 
            id="comments"
            title={`活动评价 (${activity.comments?.length || 0}条)`}
            style={{ marginTop: '24px' }}
            extra={
              <Button 
                type="primary" 
                onClick={() => setShowCommentModal(true)}
              >
                写评价
              </Button>
            }
          >
            {activity.comments && activity.comments.length > 0 ? (
              <div style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                <List
                  itemLayout="vertical"
                  dataSource={activity.comments}
                  renderItem={comment => (
                    <List.Item
                      key={comment.id}
                      style={{
                        margin: '16px 0',
                        padding: '16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <Space align="start">
                          <Avatar src={comment.user.avatar} size={40}>
                            {comment.user.nickname?.[0] || comment.user.username[0]}
                          </Avatar>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
                              {comment.user.nickname || comment.user.username}
                            </div>
                            <div style={{ color: '#7f8c8d', fontSize: '12px' }}>
                              📅 {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                            </div>
                          </div>
                        </Space>
                      </div>
                      
                      <div style={{ marginBottom: '12px', color: '#34495e', lineHeight: '1.6' }}>
                        {comment.content}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {comment.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#e67e22', fontSize: '12px' }}>⭐ 评分:</span>
                            <Rate disabled value={comment.rating} style={{ fontSize: '14px' }} />
                            <span style={{ color: '#e67e22', fontSize: '12px' }}>({comment.rating}/5)</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<HeartOutlined style={{ color: comment.isLiked ? '#e74c3c' : '#999' }} />}
                            onClick={() => handleCommentLike(comment.id)}
                            loading={commentLikeLoading === comment.id}
                            style={{ 
                              padding: '0 4px',
                              height: 'auto',
                              color: comment.isLiked ? '#e74c3c' : '#999'
                            }}
                          >
                            {comment.likeCount}
                          </Button>
                          {(user?.id === comment.user.id || user?.id === activity.organizer.id) && (
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteComment(comment.id)}
                              loading={deleteCommentLoading === comment.id}
                              style={{ 
                                padding: '0 4px',
                                height: 'auto',
                                color: '#999'
                              }}
                              danger
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {comment.images && comment.images.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <Image.PreviewGroup>
                            <Space>
                              {comment.images.map((image, index) => (
                                <Image
                                  key={index}
                                  src={image}
                                  width={80}
                                  height={80}
                                  style={{ objectFit: 'cover', borderRadius: 4 }}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        </div>
                      )}
                      
                      {comment.likes && comment.likes.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px',
                          backgroundColor: '#ecf0f1',
                          borderRadius: '6px'
                        }}>
                          <div style={{ color: '#2980b9', fontSize: '12px', marginBottom: '6px' }}>
                            💙 点赞用户:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {comment.likes.map(like => (
                              <Tag
                                key={like.id}
                                color="blue"
                                style={{
                                  margin: 0,
                                  borderRadius: '12px',
                                  fontSize: '11px'
                                }}
                              >
                                {like.user.nickname || like.user.username}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无评价
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧信息栏 */}
        <Col xs={24} lg={8}>
          {/* 报名信息 */}
          <Card title="报名信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="活动时间">
                <Space direction="vertical" size={0}>
                  <Text>
                    <CalendarOutlined style={{ marginRight: '4px' }} />
                    {dayjs(activity.startTime).format('YYYY-MM-DD HH:mm')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    至 {dayjs(activity.endTime).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="活动地点">
                <Text>
                  <EnvironmentOutlined style={{ marginRight: '4px' }} />
                  {activity.location}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="报名截止">
                <Text>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  {dayjs(activity.registrationDeadline).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="活动费用">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  <DollarOutlined style={{ marginRight: '4px' }} />
                  {formatPrice(activity.price)}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="参与人数">
                <Space>
                  <Text>
                    <TeamOutlined style={{ marginRight: '4px' }} />
                    {activity.currentParticipants}/{activity.maxParticipants}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    剩余{getRemainingSlots()}个名额
                  </Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                type="primary"
                size="large"
                block
                disabled={!canRegister() && !isRegistered}
                onClick={() => {
                  if (isRegistered) {
                    handleCancelRegistration();
                    return;
                  }
                  setShowRegistrationModal(true);
                }}
                loading={registering}
              >
                {(() => {
                  if (!activity) return '加载中...';
                  if (isRegistered) return '取消报名';
                  if (activity.status === 'CANCELLED') return '活动已取消';
                  
                  const now = dayjs();
                  const registrationDeadline = dayjs(activity.registrationDeadline);
                  const startTime = dayjs(activity.startTime);
                  const endTime = dayjs(activity.endTime);
                  
                  if (now.isAfter(endTime)) return '活动已结束';
                  if (now.isAfter(startTime)) return '活动进行中';
                  if (now.isAfter(registrationDeadline)) return '报名已截止';
                  if (getRemainingSlots() <= 0) return '名额已满';
                  
                  return '立即报名';
                })()}
              </Button>
              
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  icon={<HeartOutlined />} 
                  onClick={handleLike}
                  type={liked ? 'primary' : 'default'}
                  danger={liked}
                >
                  {liked ? '取消点赞' : '点赞'} ({activity.likeCount})
                </Button>
                <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                  分享
                </Button>
              </Space>
              
              {/* 调试信息 */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>🔧 调试信息</div>
                <div>认证状态: {isAuthenticated ? '✅ 已登录' : '❌ 未登录'}</div>
                <div>用户ID: {user?.id || '无'}</div>
                <div>用户名: {user?.username || '无'}</div>
                <div>点赞状态: {liked ? '❤️ 已点赞' : '🤍 未点赞'}</div>
                <div>活动ID: {id}</div>
                <Button 
                  size="small" 
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    console.log('🔧 [手动调试] 当前状态:');
                    console.log('- 认证状态:', isAuthenticated);
                    console.log('- 用户信息:', user);
                    console.log('- 点赞状态:', liked);
                    console.log('- 活动ID:', id);
                    console.log('- 活动信息:', activity);
                  }}
                >
                  打印状态到控制台
                </Button>
              </div>
            </Space>
          </Card>

          {/* 组织者信息 */}
          <Card title="组织者" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar 
                src={activity.organizer.avatar} 
                size={48} 
                style={{ marginRight: '12px' }}
              >
                {activity.organizer.nickname?.[0] || activity.organizer.username[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {activity.organizer.nickname || activity.organizer.username}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  @{activity.organizer.username}
                </div>
              </div>
            </div>
            
            {activity.contactInfo && (
              <div>
                <Title level={5}>联系方式</Title>
                <Paragraph style={{ fontSize: '12px' }}>
                  {activity.contactInfo}
                </Paragraph>
              </div>
            )}
            
            <Space direction="vertical" style={{ width: '100%' }}>
              {activity.organizer.email && (
                <Text style={{ fontSize: '12px' }}>
                  <MailOutlined style={{ marginRight: '4px' }} />
                  {activity.organizer.email}
                </Text>
              )}
              {activity.organizer.phone && (
                <Text style={{ fontSize: '12px' }}>
                  <PhoneOutlined style={{ marginRight: '4px' }} />
                  {activity.organizer.phone}
                </Text>
              )}
              
              {/* 删除活动按钮 - 仅对创建者显示且活动未开始 */}
              {(() => {
                const isUserLoggedIn = !!user;
                const isCreator = user && user.id === activity.organizer.id;
                const isBeforeStart = dayjs().isBefore(dayjs(activity.startTime));
                const shouldShowButton = isUserLoggedIn && isCreator && isBeforeStart;
                
                console.log('🔍 [DEBUG] ========== 删除按钮渲染检查 ==========');
                console.log('🔍 [DEBUG] 删除按钮显示条件检查:');
                console.log('  - 用户已登录:', isUserLoggedIn);
                console.log('  - 当前用户:', user);
                console.log('  - 活动创建者:', activity.organizer);
                console.log('  - 是否为创建者:', isCreator);
                console.log('  - 当前时间:', dayjs().format('YYYY-MM-DD HH:mm:ss'));
                console.log('  - 活动开始时间:', dayjs(activity.startTime).format('YYYY-MM-DD HH:mm:ss'));
                console.log('  - 活动未开始:', isBeforeStart);
                console.log('  - 应该显示删除按钮:', shouldShowButton);
                console.log('🔍 [DEBUG] ========== 删除按钮渲染检查结束 ==========');
                
                return shouldShowButton ? (
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ marginTop: '12px' }}
                    onClick={() => {
                      console.log('🖱️ [DEBUG] 删除按钮被点击！');
                      handleDeleteActivity();
                    }}
                  >
                    删除活动
                  </Button>
                ) : null;
              })()}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 报名弹窗 */}
      <Modal
        title="活动报名"
        open={showRegistrationModal}
        onCancel={() => setShowRegistrationModal(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegistration}
          initialValues={{ participants: 1 }}
        >
          <Form.Item
            label="参与人数"
            name="participants"
            rules={[
              { required: true, message: '请选择参与人数' },
              { type: 'number', min: 1, max: getRemainingSlots(), message: `人数范围：1-${getRemainingSlots()}` }
            ]}
          >
            <InputNumber
              min={1}
              max={getRemainingSlots()}
              style={{ width: '100%' }}
              placeholder="请输入参与人数"
            />
          </Form.Item>
          
          <Form.Item
            label="备注信息"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="请输入备注信息（可选）"
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowRegistrationModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={registering}>
                确认报名
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 评论弹窗 */}
      <Modal
        title="写评价"
        open={showCommentModal}
        onCancel={() => setShowCommentModal(false)}
        footer={null}
      >
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleCommentSubmit}
        >
          <Form.Item
            label="评分"
            name="rating"
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>
          
          <Form.Item
            label="评价内容"
            name="content"
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="请分享您的活动体验..."
              maxLength={500}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCommentModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交评价
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivityDetail;