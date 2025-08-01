const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkSpecificUser() {
  try {
    const email = 'a15245552850@qq.com';
    const password = 'a1234567';
    
    console.log(`🔍 检查用户: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log('✅ 用户存在:');
    console.log('邮箱:', user.email);
    console.log('用户名:', user.username);
    console.log('昵称:', user.nickname || '无');
    console.log('是否激活:', user.isActive);
    console.log('角色:', user.role);
    console.log('创建时间:', user.createdAt);
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('\n🔐 密码验证:', isPasswordValid ? '✅ 正确' : '❌ 错误');
    
    if (!isPasswordValid) {
      console.log('\n💡 建议:');
      console.log('1. 检查密码是否正确');
      console.log('2. 尝试重置密码');
      console.log('3. 检查是否有特殊字符或空格');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificUser();