const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkCreatorUser() {
  try {
    console.log('🔍 查询creator_user用户信息...');
    
    const user = await prisma.user.findUnique({
      where: { username: 'creator_user' },
      include: {
        activities: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            activity: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
    
    if (user) {
      console.log('✅ 找到creator_user用户:');
      console.log('📧 邮箱:', user.email);
      console.log('👤 用户名:', user.username);
      console.log('🏷️ 昵称:', user.nickname || '未设置');
      console.log('🔑 角色:', user.role);
      console.log('📅 创建时间:', user.createdAt);
      console.log('🟢 状态:', user.isActive ? '活跃' : '禁用');
      console.log('\n📊 统计信息:');
      console.log('  - 创建的活动数:', user.activities.length);
      console.log('  - 订单数:', user.orders.length);
      
      if (user.activities.length > 0) {
        console.log('\n🎯 创建的活动:');
        user.activities.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.title} (${activity.id})`);
          console.log(`     创建时间: ${activity.createdAt}`);
        });
      }
      
      if (user.orders.length > 0) {
        console.log('\n🛒 订单记录:');
        user.orders.forEach((order, index) => {
          console.log(`  ${index + 1}. 订单号: ${order.orderNumber}`);
          console.log(`     状态: ${order.status}, 活动: ${order.activity.title}`);
        });
      }
    } else {
      console.log('❌ 未找到creator_user用户');
      console.log('\n💡 这个用户可能是测试文件中定义的，但尚未在数据库中创建。');
      console.log('   可以运行测试文件来创建这个用户:');
      console.log('   node test-delete-activity.js');
    }
    
  } catch (error) {
    console.error('❌ 查询过程中发生错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCreatorUser();