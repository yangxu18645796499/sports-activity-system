import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, DatePicker, Tag, Spin, Empty, message, Slider, Collapse, Space, Modal } from 'antd';
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined, UserOutlined, HeartOutlined, ShareAltOutlined, FilterOutlined, ClearOutlined, HomeOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../stores/useAuthStore';

import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

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
  isRecommended: boolean;
  viewCount: number;
  likeCount: number;
  organizer: {
    id: string;
    username: string;
    nickname?: string;
  };
}

interface ActivityFilters {
  search?: string;
  category?: string;
  status?: string;
  dateRange?: [string, string];
  priceRange?: [number, number];
  location?: string;
  tags?: string[];
  sortBy?: 'startTime' | 'price' | 'viewCount' | 'likeCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRegistrationStatus, setPreviewRegistrationStatus] = useState(false);
  const [registrationStatuses, setRegistrationStatuses] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<ActivityFilters>({
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 活动分类选项
  const categories = [
    { value: 'basketball', label: '篮球' },
    { value: 'football', label: '足球' },
    { value: 'badminton', label: '羽毛球' },
    { value: 'tennis', label: '网球' },
    { value: 'swimming', label: '游泳' },
    { value: 'running', label: '跑步' },
    { value: 'yoga', label: '瑜伽' },
    { value: 'fitness', label: '健身' },
    { value: 'volleyball', label: '排球' },
    { value: 'pingpong', label: '乒乓球' },
    { value: 'cycling', label: '骑行' },
    { value: 'hiking', label: '徒步' },
    { value: 'dancing', label: '舞蹈' },
    { value: 'martial_arts', label: '武术' },
    { value: 'golf', label: '高尔夫' },
    { value: 'skiing', label: '滑雪' },
    { value: 'climbing', label: '攀岩' },
    { value: 'boxing', label: '拳击' },
    { value: 'gymnastics', label: '体操' },
    { value: 'other', label: '其他' }
  ];

  // 状态选项
  const statusOptions = [
    { value: 'PUBLISHED', label: '报名中' },
    { value: 'COMPLETED', label: '已结束' },
    { value: 'CANCELLED', label: '已取消' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'startTime-asc', label: '时间升序' },
    { value: 'startTime-desc', label: '时间降序' },
    { value: 'price-asc', label: '价格升序' },
    { value: 'price-desc', label: '价格降序' },
    { value: 'viewCount-desc', label: '热度降序' },
    { value: 'likeCount-desc', label: '点赞降序' }
  ];

  // 检查活动报名状态
  const checkRegistrationStatus = async (activityId: string) => {
    if (!isAuthenticated) {
      setPreviewRegistrationStatus(false);
      return;
    }
    
    try {
      const response = await api.get(`/activities/${activityId}/registration-status`);
      setPreviewRegistrationStatus(response.data.isRegistered);
    } catch (error) {
      console.error('检查报名状态失败:', error);
      setPreviewRegistrationStatus(false);
    }
  };

  // 批量检查所有活动的报名状态
  const checkAllRegistrationStatuses = async (activities: Activity[]) => {
    if (!isAuthenticated) {
      setRegistrationStatuses({});
      return;
    }

    const statuses: Record<string, boolean> = {};
    
    // 并发检查所有活动的报名状态
    const promises = activities.map(async (activity) => {
      try {
        const response = await api.get(`/activities/${activity.id}/registration-status`);
        statuses[activity.id] = response.data.isRegistered;
      } catch (error) {
        console.error(`检查活动 ${activity.id} 报名状态失败:`, error);
        statuses[activity.id] = false;
      }
    });

    await Promise.all(promises);
    setRegistrationStatuses(statuses);
  };

  // 获取活动列表
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pageSize
      };
      
      // 只添加有值的筛选参数
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.location) params.location = filters.location;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
      if (filters.dateRange?.[0]) params.startDate = filters.dateRange[0];
      if (filters.dateRange?.[1]) params.endDate = filters.dateRange[1];
      if (filters.priceRange?.[0] !== undefined) params.priceMin = filters.priceRange[0];
      if (filters.priceRange?.[1] !== undefined) params.priceMax = filters.priceRange[1];
      if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');
      
      console.log('API请求参数:', params);
      
      const response = await api.get('/activities', { params });
      // 处理活动数据，解析tags字段
      const processedActivities = response.data.data.activities.map((activity: any) => ({
        ...activity,
        tags: typeof activity.tags === 'string' ? JSON.parse(activity.tags || '[]') : activity.tags || [],
        images: typeof activity.images === 'string' ? JSON.parse(activity.images || '[]') : activity.images || []
      }));
      setActivities(processedActivities);
      setTotal(response.data.data.total);
      
      // 提取可用的地点和标签
      const locations = [...new Set(processedActivities.map((activity: Activity) => activity.location).filter(Boolean))];
      const tags = [...new Set(processedActivities.flatMap((activity: Activity) => activity.tags || []))];
      setAvailableLocations(locations as string[]);
      setAvailableTags(tags as string[]);
      
      // 检查每个活动的报名状态
      if (isAuthenticated) {
        checkAllRegistrationStatuses(processedActivities);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, filters]);

  // 监听页面可见性变化，当页面重新获得焦点时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 [DEBUG] 页面重新获得焦点，刷新活动列表');
        fetchActivities();
      }
    };

    const handleFocus = () => {
      console.log('🔍 [DEBUG] 窗口重新获得焦点，刷新活动列表');
      fetchActivities();
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // 监听窗口焦点变化
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1);
  };

  // 处理筛选
  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // 处理排序
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
    setPage(1);
  };

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilters({
      sortBy: 'startTime',
      sortOrder: 'asc'
    });
    setPage(1);
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = () => {
    return !!(filters.search || filters.category || filters.status || 
             filters.dateRange || filters.priceRange || filters.location || 
             (filters.tags && filters.tags.length > 0));
  };



  // 获取活动真实状态文本（基于时间判断）
  const getStatusText = (activity: Activity) => {
    const now = dayjs();
    const registrationDeadline = dayjs(activity.registrationDeadline);
    const startTime = dayjs(activity.startTime);
    const endTime = dayjs(activity.endTime);
    
    // 如果活动被取消
    if (activity.status === 'CANCELLED') {
      return '已取消';
    }
    
    // 如果活动已结束
    if (now.isAfter(endTime)) {
      return '已结束';
    }
    
    // 如果活动正在进行中
    if (now.isAfter(startTime) && now.isBefore(endTime)) {
      return '进行中';
    }
    
    // 如果报名时间已截止但活动未开始
    if (now.isAfter(registrationDeadline) && now.isBefore(startTime)) {
      return '报名截止';
    }
    
    // 如果在报名时间内且活动未开始
    if (now.isBefore(registrationDeadline) && now.isBefore(startTime)) {
      return '报名中';
    }
    
    return '已结束';
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

  // 格式化价格
  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  // 计算剩余名额
  const getRemainingSlots = (activity: Activity) => {
    return activity.maxParticipants - activity.currentParticipants;
  };

  // 检查是否可以报名
  const canRegister = (activity: Activity) => {
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
    if (getRemainingSlots(activity) <= 0) {
      return false;
    }
    
    return true;
  };

  const handlePreview = (activity: Activity) => {
    setPreviewActivity(activity);
    setPreviewVisible(true);
    checkRegistrationStatus(activity.id);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewActivity(null);
    setPreviewRegistrationStatus(false);
  };

  return (
    <div className="activities-page" style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>体育活动</h1>
          <p>发现精彩的体育活动，享受运动的乐趣</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            size="large"
          >
            返回首页
          </Button>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/activities/create')}
          >
            创建活动
          </Button>
        </div>
      </div>

      {/* 筛选和搜索区域 */}
      <Card style={{ marginBottom: '24px' }}>
        {/* 基础筛选 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索活动名称、地点..."
              allowClear
              value={filters.search}
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleFilterChange('search', undefined)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="活动分类"
              allowClear
              style={{ width: '100%' }}
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="活动状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              style={{ width: '100%' }}
              value={filters.dateRange ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])] : null}
              onChange={(dates) => {
                const dateRange = dates ? [dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')] as [string, string] : undefined;
                handleFilterChange('dateRange', dateRange);
              }}
            />
          </Col>
        </Row>
        
        {/* 排序和操作按钮 */}
        <Row style={{ marginTop: '16px' }} gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={handleSortChange}
            >
              {sortOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                高级筛选
              </Button>
              {hasActiveFilters() && (
                <Button 
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                >
                  清除筛选
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* 高级筛选面板 */}
        {showAdvancedFilters && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
            <Row gutter={[16, 16]}>
              {/* 价格范围 */}
              <Col xs={24} sm={12} md={8}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>价格范围</label>
                  <Slider
                    range
                    min={0}
                    max={1000}
                    step={10}
                    value={filters.priceRange || [0, 1000]}
                    onChange={(value) => handleFilterChange('priceRange', value as [number, number])}
                    marks={{
                      0: '免费',
                      200: '¥200',
                      500: '¥500',
                      1000: '¥1000+'
                    }}
                  />
                  <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    ¥{filters.priceRange?.[0] || 0} - ¥{filters.priceRange?.[1] || 1000}
                  </div>
                </div>
              </Col>
              
              {/* 地点筛选 */}
              <Col xs={24} sm={12} md={8}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>活动地点</label>
                  <Select
                    placeholder="选择地点"
                    allowClear
                    style={{ width: '100%' }}
                    value={filters.location}
                    onChange={(value) => handleFilterChange('location', value)}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {availableLocations.map(location => (
                      <Option key={location} value={location}>{location}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              
              {/* 标签筛选 */}
              <Col xs={24} sm={12} md={8}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>活动标签</label>
                  <Select
                    mode="multiple"
                    placeholder="选择标签"
                    allowClear
                    style={{ width: '100%' }}
                    value={filters.tags}
                    onChange={(value) => handleFilterChange('tags', value)}
                    maxTagCount={2}
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}个标签`}
                  >
                    {availableTags.map(tag => (
                      <Option key={tag} value={tag}>{tag}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        )}
        
        {/* 当前筛选条件显示 */}
        {hasActiveFilters() && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #d6e4ff' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1890ff' }}>当前筛选条件：</div>
            <Space wrap>
              {filters.search && (
                <Tag closable onClose={() => handleFilterChange('search', undefined)}>搜索: {filters.search}</Tag>
              )}
              {filters.category && (
                <Tag closable onClose={() => handleFilterChange('category', undefined)}>
                  分类: {categories.find(c => c.value === filters.category)?.label}
                </Tag>
              )}
              {filters.status && (
                <Tag closable onClose={() => handleFilterChange('status', undefined)}>
                  状态: {statusOptions.find(s => s.value === filters.status)?.label}
                </Tag>
              )}
              {filters.dateRange && (
                <Tag closable onClose={() => handleFilterChange('dateRange', undefined)}>
                  时间: {filters.dateRange[0]} 至 {filters.dateRange[1]}
                </Tag>
              )}
              {filters.priceRange && (
                <Tag closable onClose={() => handleFilterChange('priceRange', undefined)}>
                  价格: ¥{filters.priceRange[0]} - ¥{filters.priceRange[1]}
                </Tag>
              )}
              {filters.location && (
                <Tag closable onClose={() => handleFilterChange('location', undefined)}>地点: {filters.location}</Tag>
              )}
              {filters.tags && filters.tags.map(tag => (
                <Tag key={tag} closable onClose={() => {
                  const newTags = filters.tags?.filter(t => t !== tag);
                  handleFilterChange('tags', newTags?.length ? newTags : undefined);
                }}>标签: {tag}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* 活动列表 */}
      <Spin spinning={loading}>
        {activities.length === 0 && !loading ? (
          <Empty description="暂无活动" />
        ) : (
          <Row gutter={[16, 16]}>
            {activities.map(activity => (
              <Col key={activity.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  cover={
                    (() => {
                      console.log(`[活动封面调试] 活动ID: ${activity.id}, 标题: ${activity.title}`);
                      console.log(`[活动封面调试] coverImage: ${activity.coverImage || '未设置'}`);
                      console.log(`[活动封面调试] images数组:`, activity.images);
                      
                      const coverImageUrl = activity.coverImage || activity.images?.[0];
                      console.log(`[活动封面调试] 最终使用的封面URL: ${coverImageUrl || '无封面'}`);
                      
                      return coverImageUrl ? (
                        <img
                          alt={activity.title}
                          src={coverImageUrl}
                          style={{ height: 200, objectFit: 'cover' }}
                          onLoad={() => console.log(`[活动封面调试] 封面图片加载成功: ${coverImageUrl}`)}
                          onError={(e) => {
                            console.error(`[活动封面调试] 封面图片加载失败: ${coverImageUrl}`, e);
                          }}
                        />
                      ) : (
                        <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                        </div>
                      );
                    })()
                  }
                  actions={[
                    <Space key="actions" size="small">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          navigate(`/activities/${activity.id}`);
                        }}
                        style={{ minWidth: '80px' }}
                      >
                        {!isAuthenticated ? '请先登录' : (registrationStatuses[activity.id] ? '您已报名' : (canRegister(activity) ? '立即报名' : '查看详情'))}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handlePreview(activity)}
                        type="text"
                      >
                        快速预览
                      </Button>
                      {!canRegister(activity) && activity.status === 'PUBLISHED' && getRemainingSlots(activity) === 0 && (
                        <Button
                          size="small"
                          disabled
                          style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                        >
                          已满员
                        </Button>
                      )}
                      {activity.status === 'COMPLETED' && (
                        <Button
                          size="small"
                          onClick={() => navigate(`/activities/${activity.id}#comments`)}
                        >
                          查看评价
                        </Button>
                      )}
                    </Space>
                  ]}
                >
                  <Card.Meta
                    title={
                      <div>
                        {activity.isRecommended && (
                          <Tag color="red" style={{ marginRight: 8 }}>推荐</Tag>
                        )}
                        <span>{activity.title}</span>
                      </div>
                    }
                    description={
                      <div>
                        <p style={{ margin: '8px 0', color: '#666', fontSize: '12px', height: '36px', overflow: 'hidden' }}>
                          {activity.description}
                        </p>
                        <div style={{ marginBottom: '8px' }}>
                          <EnvironmentOutlined style={{ marginRight: '4px' }} />
                          <span style={{ fontSize: '12px' }}>{activity.location}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <CalendarOutlined style={{ marginRight: '4px' }} />
                          <span style={{ fontSize: '12px' }}>
                            {dayjs(activity.startTime).format('MM-DD HH:mm')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <UserOutlined style={{ marginRight: '4px' }} />
                            <span style={{ fontSize: '12px' }}>
                              {activity.currentParticipants}/{activity.maxParticipants}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
                            {formatPrice(activity.price)}
                          </div>
                        </div>
                        {/* 活动类别显示 */}
                        <div style={{ marginTop: '8px' }}>
                          <Tag color="blue" style={{ fontSize: '12px' }}>
                            {categories.find(cat => cat.value === activity.category)?.label || activity.category}
                          </Tag>
                        </div>
                        
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag color={getStatusColor(getStatusText(activity))}>
                              {getStatusText(activity)}
                            </Tag>
                            {activity.status === 'PUBLISHED' && (
                              <Tag color={getRemainingSlots(activity) > 0 ? 'green' : 'red'}>
                                {getRemainingSlots(activity) > 0 ? `剩余${getRemainingSlots(activity)}名额` : '已满员'}
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            <HeartOutlined style={{ marginRight: '4px' }} />
                            {activity.likeCount}
                            <span style={{ margin: '0 8px' }}>·</span>
                            <EyeOutlined style={{ marginRight: '4px' }} />
                            {Math.floor(activity.viewCount / 2)}
                          </div>
                        </div>
                        
                        {/* 用户自定义标签显示 */}
                        {activity.tags && activity.tags.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>标签:</div>
                            {activity.tags.slice(0, 3).map(tag => (
                              <Tag key={tag} color="orange" style={{ fontSize: '12px', padding: '0 4px', marginBottom: '4px' }}>{tag}</Tag>
                            ))}
                            {activity.tags.length > 3 && (
                              <Tag style={{ fontSize: '12px', padding: '0 4px', color: '#999' }}>+{activity.tags.length - 3}个</Tag>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button
            loading={loading}
            onClick={() => setPage(prev => prev + 1)}
            disabled={page * pageSize >= total}
          >
            加载更多
          </Button>
        </div>
      )}

      {/* 预览模态框 */}
      <Modal
        title="活动预览"
        open={previewVisible}
        onCancel={handleClosePreview}
        footer={[
          <Button key="close" onClick={handleClosePreview}>
            关闭
          </Button>,
          <Button 
            key="detail" 
            type="primary" 
            onClick={() => {
              if (previewRegistrationStatus) {
                message.info('您已报名此活动');
                return;
              }
              handleClosePreview();
              navigate(`/activities/${previewActivity?.id}`);
            }}
          >
            {(() => {
              if (!isAuthenticated) return '请先登录';
              if (previewRegistrationStatus) return '您已报名';
              return '查看详情';
            })()}
          </Button>
        ]}
        width={800}
      >
        {previewActivity && (
          <div>
            {/* 活动图片 */}
            {previewActivity.images?.[0] && (
              <img
                src={previewActivity.images[0]}
                alt={previewActivity.title}
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
              />
            )}
            
            {/* 活动基本信息 */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ marginBottom: '8px' }}>
                {previewActivity.isRecommended && (
                  <Tag color="red" style={{ marginRight: 8 }}>推荐</Tag>
                )}
                {previewActivity.title}
              </h2>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Tag color="blue" style={{ fontSize: '14px' }}>
                  {categories.find(cat => cat.value === previewActivity.category)?.label || previewActivity.category}
                </Tag>
                <Tag color={getStatusColor(getStatusText(previewActivity))}>
                  {getStatusText(previewActivity)}
                </Tag>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  {formatPrice(previewActivity.price)}
                </span>
              </div>
            </div>

            {/* 活动详情 */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <strong>开始时间：</strong>
                  {dayjs(previewActivity.startTime).format('YYYY-MM-DD HH:mm')}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <strong>结束时间：</strong>
                  {dayjs(previewActivity.endTime).format('YYYY-MM-DD HH:mm')}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <strong>活动地点：</strong>
                  {previewActivity.location}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <strong>参与人数：</strong>
                  {previewActivity.currentParticipants}/{previewActivity.maxParticipants}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <strong>报名截止：</strong>
                  {dayjs(previewActivity.registrationDeadline).format('YYYY-MM-DD HH:mm')}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>组织者：</strong>
                  {previewActivity.organizer.nickname || previewActivity.organizer.username}
                </div>
              </Col>
            </Row>

            {/* 活动描述 */}
            <div style={{ marginTop: '16px' }}>
              <h4>活动描述</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {previewActivity.description}
              </p>
            </div>

            {/* 用户自定义标签 */}
            {previewActivity.tags && previewActivity.tags.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4>用户标签</h4>
                <div>
                  {previewActivity.tags.map(tag => (
                    <Tag key={tag} color="orange" style={{ marginBottom: '4px', marginRight: '8px' }}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 统计信息 */}
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <Row gutter={16}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                    {Math.floor(previewActivity.viewCount / 2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>浏览量</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {previewActivity.likeCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>点赞数</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    {getRemainingSlots(previewActivity)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>剩余名额</div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Activities;