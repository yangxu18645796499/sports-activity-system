const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    console.log('🔍 查询所有用户信息...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`✅ 找到 ${users.length} 个用户:`);
    console.log('\n用户列表:');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户信息:`);
      console.log(`   📧 邮箱: ${user.email}`);
      console.log(`   👤 用户名: ${user.username}`);
      console.log(`   🏷️ 昵称: ${user.nickname || '未设置'}`);
      console.log(`   🔑 角色: ${user.role}`);
      console.log(`   🟢 状态: ${user.isActive ? '活跃' : '禁用'}`);
      console.log(`   📅 创建时间: ${user.createdAt}`);
    });
    
    // 特别显示管理员账户
    const admins = users.filter(user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    if (admins.length > 0) {
      console.log('\n👑 管理员账户:');
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();