import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Descriptions,
  Pagination,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;

interface User {
  id: string;
  email: string;
  username: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthday?: string;
  bio?: string;
  isActive: boolean;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    comments: number;
    activityLikes: number;
  };
}

interface UserDetail extends User {
  activityLikes: Array<{
    id: string;
    createdAt: string;
    activity: {
      id: string;
      title: string;
      status: string;
    };
  }>;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    USER: number;
    ADMIN: number;
    SUPER_ADMIN: number;
  };
  newUsersLast30Days: number;
}

const UserViewer: React.FC = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  // 获取用户统计信息
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { isActive: statusFilter })
      });

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotal(data.data.total);
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户详情
  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.data.user);
        setDetailModalVisible(true);
      } else {
        message.error('获取用户详情失败');
      }
    } catch (error) {
      console.error('获取用户详情失败:', error);
      message.error('获取用户详情失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？此操作不可撤销。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            message.success('用户删除成功');
            fetchUsers();
            fetchUserStats();
          } else {
            message.error('删除用户失败');
          }
        } catch (error) {
          console.error('删除用户失败:', error);
          message.error('删除用户失败');
        }
      }
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter]);

  const columns: ColumnsType<User> = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string, record: User) => (
        <Avatar
          size={40}
          src={avatar ? `/uploads/avatars/${avatar}` : undefined}
          icon={!avatar ? <UserOutlined /> : undefined}
        />
      )
    },
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_, record: User) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.nickname || record.username}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.email}</div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleColors = {
          'USER': 'blue',
          'ADMIN': 'orange',
          'SUPER_ADMIN': 'red'
        };
        const roleNames = {
          'USER': '用户',
          'ADMIN': '管理员',
          'SUPER_ADMIN': '超级管理员'
        };
        return <Tag color={roleColors[role as keyof typeof roleColors]}>{roleNames[role as keyof typeof roleNames]}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? 'success' : 'error'}
          text={isActive ? '活跃' : '禁用'}
        />
      )
    },
    {
      title: '统计',
      key: 'stats',
      width: 150,
      render: (_, record: User) => (
        <div style={{ fontSize: '12px' }}>
          <div>活动点赞: {record._count?.activityLikes || 0}</div>
          <div>订单: {record._count?.orders || 0}</div>
          <div>评论: {record._count?.comments || 0}</div>
        </div>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => fetchUserDetail(record.id)}
          >
            查看
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="📊 用户数据库查看器" style={{ marginBottom: '24px' }}>
        {/* 统计信息 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Statistic
                title="总用户数"
                value={stats.totalUsers}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="活跃用户"
                value={stats.activeUsers}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="禁用用户"
                value={stats.inactiveUsers}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="30天新增"
                value={stats.newUsersLast30Days}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
          </Row>
        )}

        {/* 搜索和过滤 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Search
              placeholder="搜索用户名、邮箱或昵称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={fetchUsers}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="角色筛选"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="USER">用户</Option>
              <Option value="ADMIN">管理员</Option>
              <Option value="SUPER_ADMIN">超级管理员</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="true">活跃</Option>
              <Option value="false">禁用</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('');
                setRoleFilter('');
                setStatusFilter('');
                setCurrentPage(1);
                fetchUsers();
                fetchUserStats();
              }}
            >
              重置
            </Button>
          </Col>
        </Row>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />

        {/* 分页 */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            }}
          />
        </div>
      </Card>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="头像" span={2}>
                <Avatar
                  size={64}
                  src={selectedUser.avatar ? `/uploads/avatars/${selectedUser.avatar}` : undefined}
                  icon={!selectedUser.avatar ? <UserOutlined /> : undefined}
                />
              </Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="昵称">{selectedUser.nickname || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
              <Descriptions.Item label="手机">{selectedUser.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {selectedUser.gender === 'MALE' ? '男' : selectedUser.gender === 'FEMALE' ? '女' : '其他'}
              </Descriptions.Item>
              <Descriptions.Item label="生日">
                {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString() : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={selectedUser.role === 'USER' ? 'blue' : selectedUser.role === 'ADMIN' ? 'orange' : 'red'}>
                  {selectedUser.role === 'USER' ? '用户' : selectedUser.role === 'ADMIN' ? '管理员' : '超级管理员'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={selectedUser.isActive ? 'success' : 'error'}
                  text={selectedUser.isActive ? '活跃' : '禁用'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="个人简介" span={2}>
                {selectedUser.bio || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedUser.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {/* 相关数据统计 */}
            <Row gutter={16} style={{ marginTop: '24px' }}>
              <Col span={8}>
                  <Card size="small" title="点赞的活动">
                  <Statistic value={selectedUser._count.activityLikes} />
                  {selectedUser.activityLikes.slice(0, 3).map(like => (
                     <div key={like.id} style={{ fontSize: '12px', marginTop: '8px' }}>
                       {like.activity.title}
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="订单数量">
                  <Statistic value={selectedUser._count.orders} />
                  {selectedUser.orders.slice(0, 3).map(order => (
                    <div key={order.id} style={{ fontSize: '12px', marginTop: '8px' }}>
                      {order.status} - ¥{order.totalAmount}
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="评论数量">
                  <Statistic value={selectedUser._count.comments} />
                  {selectedUser.comments.slice(0, 3).map(comment => (
                    <div key={comment.id} style={{ fontSize: '12px', marginTop: '8px' }}>
                      {comment.content.substring(0, 30)}...
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserViewer;