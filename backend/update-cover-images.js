const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCoverImages() {
  try {
    console.log('开始更新活动封面图片...');
    
    // 获取所有有图片但没有封面的活动
    const activities = await prisma.activity.findMany({
      where: {
        AND: [
          {
            images: {
              not: {
                equals: []
              }
            }
          },
          {
            OR: [
              { coverImage: null },
              { coverImage: '' }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        images: true,
        coverImage: true
      }
    });
    
    console.log(`找到 ${activities.length} 个需要更新封面的活动`);
    
    let updatedCount = 0;
    
    for (const activity of activities) {
      if (activity.images && activity.images.length > 0) {
        const firstImage = activity.images[0];
        
        console.log(`更新活动: ${activity.title}`);
        console.log(`  - 活动ID: ${activity.id}`);
        console.log(`  - 当前封面: ${activity.coverImage || '无'}`);
        console.log(`  - 图片数组: ${JSON.stringify(activity.images)}`);
        console.log(`  - 设置封面为: ${firstImage}`);
        
        await prisma.activity.update({
          where: { id: activity.id },
          data: {
            coverImage: firstImage
          }
        });
        
        updatedCount++;
        console.log(`  ✅ 更新成功\n`);
      }
    }
    
    console.log(`\n更新完成! 共更新了 ${updatedCount} 个活动的封面图片`);
    
    // 验证更新结果
    console.log('\n验证更新结果:');
    const updatedActivities = await prisma.activity.findMany({
      where: {
        images: {
          not: {
            equals: []
          }
        }
      },
      select: {
        id: true,
        title: true,
        images: true,
        coverImage: true
      }
    });
    
    for (const activity of updatedActivities) {
      const isConsistent = activity.coverImage === activity.images[0];
      console.log(`活动: ${activity.title}`);
      console.log(`  - 封面: ${activity.coverImage}`);
      console.log(`  - 第一张图片: ${activity.images[0]}`);
      console.log(`  - 一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}\n`);
    }
    
  } catch (error) {
    console.error('更新封面图片时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCoverImages();