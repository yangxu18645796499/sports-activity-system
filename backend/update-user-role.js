const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    console.log('查找用户 123@qq.com...');
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: {
        email: '123@qq.com'
      }
    });
    
    if (!user) {
      console.log('用户 123@qq.com 不存在');
      return;
    }
    
    console.log('找到用户:', {
      id: user.id,
      username: user.username,
      email: user.email,
      currentRole: user.role
    });
    
    // 更新用户角色为超级管理员
    console.log('正在更新用户角色为超级管理员...');
    
    const updatedUser = await prisma.user.update({
      where: {
        email: '123@qq.com'
      },
      data: {
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('用户角色更新成功!');
    console.log('更新后的用户信息:', {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt
    });
    
    showSuperAdminFeatures();
    
  } catch (error) {
    console.error('更新用户角色失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 显示超级管理员功能说明
function showSuperAdminFeatures() {
  console.log('\n超级管理员功能权限说明:');
  console.log('1. 系统管理: 可以管理整个系统的配置和设置');
  console.log('2. 用户管理: 可以管理所有用户账号');
  console.log('3. 角色管理: 可以设置和修改用户角色');
  console.log('4. 数据管理: 可以访问和管理所有数据');
  console.log('5. 审计日志: 可以查看系统所有操作记录');
}

// 运行脚本
updateUserRole();
