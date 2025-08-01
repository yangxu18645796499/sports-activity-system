const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLikes() {
  try {
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        likeCount: true,
        _count: {
          select: {
            likes: true
          }
        }
      }
    });
    
    console.log('活动点赞数据:');
    activities.forEach(activity => {
      console.log(`活动: ${activity.title}`);
      console.log(`  ID: ${activity.id}`);
      console.log(`  likeCount字段: ${activity.likeCount}`);
      console.log(`  实际点赞记录数: ${activity._count.likes}`);
      console.log('---');
    });
    
    // 检查点赞记录详情
    const likes = await prisma.like.findMany({
      include: {
        activity: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    console.log('\n点赞记录详情:');
    likes.forEach(like => {
      console.log(`用户 ${like.user.username} 点赞了活动 "${like.activity.title}"`);
    });
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLikes();