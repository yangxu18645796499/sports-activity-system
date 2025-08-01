const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkActivities() {
  try {
    console.log('检查当前活动数据...');
    
    const activities = await prisma.activity.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      }
    });
    
    console.log(`\n找到 ${activities.length} 个活动:`);
    
    activities.forEach((activity, index) => {
      console.log(`\n活动 ${index + 1}:`);
      console.log(`- ID: ${activity.id}`);
      console.log(`- 标题: ${activity.title}`);
      console.log(`- 分类: ${activity.category}`);
      console.log(`- 封面图片 (coverImage): ${activity.coverImage || '无'}`);
      console.log(`- 图片数组 (images): ${activity.images}`);
      console.log(`- 标签: ${activity.tags}`);
      console.log(`- 组织者: ${activity.organizer.username}`);
      console.log(`- 状态: ${activity.status}`);
    });
    
  } catch (error) {
    console.error('检查活动失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();