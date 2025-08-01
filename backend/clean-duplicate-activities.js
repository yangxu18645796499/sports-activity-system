const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function cleanDuplicateActivities() {
  try {
    console.log('=== 开始清理重复活动 ===\n');
    
    // 获取所有活动
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: 'asc' // 按创建时间排序，保留最早的
      },
      include: {
        organizer: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            orders: true,
            comments: true,
            likes: true
          }
        }
      }
    });

    console.log(`📊 总活动数: ${activities.length}`);
    
    // 按标题分组，找出重复的活动
    const titleGroups = {};
    activities.forEach(activity => {
      const title = activity.title.trim();
      if (!titleGroups[title]) {
        titleGroups[title] = [];
      }
      titleGroups[title].push(activity);
    });

    // 找出重复的活动组
    const duplicateGroups = Object.entries(titleGroups).filter(([title, group]) => group.length > 1);
    
    console.log(`🔍 发现 ${duplicateGroups.length} 组重复活动:\n`);
    
    let totalToDelete = 0;
    const activitiesToDelete = [];
    
    for (const [title, group] of duplicateGroups) {
      console.log(`📝 "${title}" - ${group.length} 个重复:`);
      
      // 按优先级排序：有订单/评论/点赞的优先保留，然后按创建时间
      group.sort((a, b) => {
        const aHasData = a._count.orders + a._count.comments + a._count.likes;
        const bHasData = b._count.orders + b._count.comments + b._count.likes;
        
        if (aHasData !== bHasData) {
          return bHasData - aHasData; // 有数据的排前面
        }
        
        return new Date(a.createdAt) - new Date(b.createdAt); // 创建时间早的排前面
      });
      
      // 保留第一个，删除其余的
      const toKeep = group[0];
      const toDelete = group.slice(1);
      
      console.log(`  ✅ 保留: ${toKeep.id} (${toKeep.organizer.username}) - 订单:${toKeep._count.orders} 评论:${toKeep._count.comments} 点赞:${toKeep._count.likes}`);
      
      toDelete.forEach(activity => {
        console.log(`  ❌ 删除: ${activity.id} (${activity.organizer.username}) - 订单:${activity._count.orders} 评论:${activity._count.comments} 点赞:${activity._count.likes}`);
        activitiesToDelete.push(activity.id);
      });
      
      totalToDelete += toDelete.length;
      console.log('');
    }
    
    // 也检查一些明显的测试活动
    const testActivities = activities.filter(activity => {
      const title = activity.title.toLowerCase();
      return title.includes('test') || 
             title.includes('测试') || 
             title.includes('nihao') ||
             title.includes('chengg') ||
             title === '差一点' ||
             (activity._count.orders === 0 && activity._count.comments === 0 && activity._count.likes === 0 && activity.viewCount === 0);
    });
    
    console.log(`🧪 发现 ${testActivities.length} 个测试/无用活动:`);
    testActivities.forEach(activity => {
      if (!activitiesToDelete.includes(activity.id)) {
        console.log(`  ❌ 删除测试活动: ${activity.id} - "${activity.title}" (${activity.organizer.username})`);
        activitiesToDelete.push(activity.id);
        totalToDelete++;
      }
    });
    
    console.log(`\n📊 统计:`);
    console.log(`- 总活动数: ${activities.length}`);
    console.log(`- 计划删除: ${totalToDelete}`);
    console.log(`- 保留活动: ${activities.length - totalToDelete}`);
    
    if (totalToDelete === 0) {
      console.log('\n✅ 没有需要删除的活动!');
      return;
    }
    
    // 确认删除
    console.log('\n⚠️  即将删除以上活动，请确认...');
    console.log('如果确认删除，请在5秒内按 Ctrl+C 取消，否则将自动执行删除操作...');
    
    // 等待5秒
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🗑️  开始删除活动...');
    
    // 批量删除活动（会自动删除相关的订单、评论、点赞等）
    for (const activityId of activitiesToDelete) {
      try {
        // 先删除相关数据
        await prisma.like.deleteMany({
          where: { activityId }
        });
        
        await prisma.comment.deleteMany({
          where: { activityId }
        });
        
        await prisma.order.deleteMany({
          where: { activityId }
        });
        
        // 最后删除活动
        await prisma.activity.delete({
          where: { id: activityId }
        });
        
        console.log(`✅ 已删除活动: ${activityId}`);
      } catch (error) {
        console.error(`❌ 删除活动 ${activityId} 失败:`, error.message);
      }
    }
    
    console.log('\n🎉 清理完成!');
    
    // 重新检查数据
    const remainingActivities = await prisma.activity.count();
    console.log(`📊 剩余活动数: ${remainingActivities}`);
    
  } catch (error) {
    console.error('❌ 清理过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateActivities();