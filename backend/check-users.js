const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('📊 查询数据库中的所有用户...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n✅ 找到 ${users.length} 个用户:`);
    console.log('=' .repeat(80));
    
    if (users.length === 0) {
      console.log('❌ 数据库中没有用户');
    } else {
      users.forEach((user, index) => {
        console.log(`\n用户 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  邮箱: ${user.email}`);
        console.log(`  用户名: ${user.username}`);
        console.log(`  昵称: ${user.nickname || '未设置'}`);
        console.log(`  手机: ${user.phone || '未设置'}`);
        console.log(`  角色: ${user.role}`);
        console.log(`  状态: ${user.isActive ? '激活' : '未激活'}`);
        console.log(`  创建时间: ${user.createdAt}`);
        console.log(`  更新时间: ${user.updatedAt}`);
      });
    }
    
    console.log('\n=' .repeat(80));
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();