const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkUserAvatar() {
  try {
    console.log('🔍 查询用户 123 的头像信息...');
    
    // 查找用户名为 123 或邮箱为 123@qq.com 的用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: '123' },
          { email: '123@qq.com' }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ 未找到用户 123 或 123@qq.com');
      return;
    }

    console.log('✅ 找到用户信息:');
    console.log('用户ID:', user.id);
    console.log('用户名:', user.username);
    console.log('邮箱:', user.email);
    console.log('头像字段:', user.avatar);
    console.log('最后更新时间:', user.updatedAt);
    
    if (user.avatar) {
      console.log('✅ 用户有头像数据');
    } else {
      console.log('❌ 用户头像字段为空');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAvatar();