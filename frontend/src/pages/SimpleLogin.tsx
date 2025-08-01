import React, { useState } from 'react';
import { Button, Input, Card, Typography, Space, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SimpleLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    setResult('✅ 存储已清理');
  };

  const testDirectLogin = async () => {
    try {
      setLoading(true);
      setResult('🔄 正在测试登录...');
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 登录成功！\n用户: ${data.user.username}\nToken: ${data.token.substring(0, 20)}...`);
        
        // 手动存储到localStorage
        const authData = {
          state: {
            user: data.user,
            token: data.token,
            isAuthenticated: true
          },
          version: 0
        };
        localStorage.setItem('auth-storage', JSON.stringify(authData));
        
        setResult(prev => prev + '\n✅ 认证信息已保存到localStorage');
        
        // 延迟跳转
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } else {
        setResult(`❌ 登录失败: ${data.error || '未知错误'}`);
      }
      
    } catch (error: any) {
      setResult(`❌ 网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStorage = () => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        setResult(`📦 当前存储:\n${JSON.stringify(parsed, null, 2)}`);
      } catch (e) {
        setResult('❌ 存储数据格式错误');
      }
    } else {
      setResult('📦 localStorage中无认证信息');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <Title level={3}>简化登录测试</Title>
        
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text>邮箱:</Text>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
            />
          </div>
          
          <div>
            <Text>密码:</Text>
            <Input.Password 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
            />
          </div>
          
          <Space wrap>
            <Button 
              type="primary" 
              onClick={testDirectLogin}
              loading={loading}
            >
              直接登录测试
            </Button>
            
            <Button onClick={clearStorage}>
              清理存储
            </Button>
            
            <Button onClick={checkStorage}>
              检查存储
            </Button>
            
            <Button 
              onClick={() => navigate('/login')}
            >
              返回正常登录
            </Button>
          </Space>
          
          {result && (
            <Alert 
              message="测试结果" 
              description={<pre style={{whiteSpace: 'pre-wrap'}}>{result}</pre>} 
              type={result.includes('✅') ? 'success' : result.includes('❌') ? 'error' : 'info'} 
              showIcon 
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default SimpleLogin;