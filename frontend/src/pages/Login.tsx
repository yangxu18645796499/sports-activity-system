import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values: LoginForm) => {
    try {
      setIsSubmitting(true);
      clearError();

      await login(values.email, values.password);

      message.success('登录成功！');
      // 延迟导航，确保用户看到成功消息
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.error || error.message || '登录失败，请重试';
      message.error(errorMessage, 5); // 显示5秒
      // 不要立即导航，让用户看到错误信息
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md shadow-lg'>
        <div className='text-center mb-8'>
          <Title level={2} className='text-gray-800 mb-2'>
            欢迎回来
          </Title>
          <Text type='secondary'>登录您的账户以继续使用运动活动管理系统</Text>
        </div>

        <Form
          form={form}
          name='login'
          onFinish={onFinish}
          layout='vertical'
          size='large'
        >
          <Form.Item
            name='email'
            label='邮箱'
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder='请输入邮箱地址'
              autoComplete='email'
            />
          </Form.Item>

          <Form.Item
            name='password'
            label='密码'
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='请输入密码'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              className='w-full'
              loading={isSubmitting || isLoading}
              size='large'
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className='text-center'>
          <Text type='secondary'>
            还没有账户？{' '}
            <Link to='/register' className='text-blue-600 hover:text-blue-800'>
              立即注册
            </Link>
          </Text>
        </div>

        {error && (
          <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
            <Text type='danger'>{error}</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;
