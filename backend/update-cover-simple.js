// 使用现有的Prisma客户端更新封面图片
const path = require('path');

// 尝试直接导入编译后的Prisma客户端
try {
  const { PrismaClient } = require('../node_modules/.prisma/client');
  
  const prisma = new PrismaClient();
  
  async function updateCoverImages() {
    try {
      console.log('开始更新活动封面图片...');
      
      // 获取所有活动
      const activities = await prisma.activity.findMany({
        select: {
          id: true,
          title: true,
          images: true,
          coverImage: true
        }
      });
      
      console.log(`总共找到 ${activities.length} 个活动`);
      
      let updatedCount = 0;
      
      for (const activity of activities) {
        // 检查是否有图片但没有封面
        if (activity.images && 
            Array.isArray(activity.images) && 
            activity.images.length > 0 && 
            (!activity.coverImage || activity.coverImage === '')) {
          
          const firstImage = activity.images[0];
          
          console.log(`\n更新活动: ${activity.title}`);
          console.log(`  - 活动ID: ${activity.id}`);
          console.log(`  - 当前封面: ${activity.coverImage || '无'}`);
          console.log(`  - 图片数组长度: ${activity.images.length}`);
          console.log(`  - 第一张图片: ${firstImage}`);
          console.log(`  - 设置封面为: ${firstImage}`);
          
          await prisma.activity.update({
            where: { id: activity.id },
            data: {
              coverImage: firstImage
            }
          });
          
          updatedCount++;
          console.log(`  ✅ 更新成功`);
        } else if (activity.images && Array.isArray(activity.images) && activity.images.length > 0) {
          console.log(`\n跳过活动: ${activity.title} (已有封面: ${activity.coverImage})`);
        }
      }
      
      console.log(`\n\n更新完成! 共更新了 ${updatedCount} 个活动的封面图片`);
      
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
        if (activity.images && activity.images.length > 0) {
          const isConsistent = activity.coverImage === activity.images[0];
          console.log(`\n活动: ${activity.title}`);
          console.log(`  - 封面: ${activity.coverImage}`);
          console.log(`  - 第一张图片: ${activity.images[0]}`);
          console.log(`  - 一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
        }
      }
      
    } catch (error) {
      console.error('更新封面图片时发生错误:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  updateCoverImages();
  
} catch (importError) {
  console.error('无法导入Prisma客户端:', importError.message);
  console.log('\n尝试使用备用方法...');
  
  // 备用方法：直接操作数据库文件
  const fs = require('fs');
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  
  if (fs.existsSync(dbPath)) {
    console.log('找到数据库文件，但需要安装sqlite3模块才能直接操作');
    console.log('请运行: npm install sqlite3');
  } else {
    console.log('未找到数据库文件:', dbPath);
  }
}