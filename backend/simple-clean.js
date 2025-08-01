const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function simpleClear() {
  try {
    console.log('=== 简单清理数据 ===\n');
    
    // 使用原始SQL删除
    console.log('🗑️  删除所有数据...');
    
    await prisma.$executeRaw`DELETE FROM "activity_likes"`;
    console.log('✅ 删除活动点赞记录');
    
    await prisma.$executeRaw`DELETE FROM "comment_likes"`;
    console.log('✅ 删除评论点赞记录');
    
    await prisma.$executeRaw`DELETE FROM "comments"`;
    console.log('✅ 删除评论记录');
    
    await prisma.$executeRaw`DELETE FROM "orders"`;
    console.log('✅ 删除订单记录');
    
    await prisma.$executeRaw`DELETE FROM "activities"`;
    console.log('✅ 删除活动记录');
    
    console.log('\n🎉 清理完成!');
    
    // 检查结果
    const activityCount = await prisma.activity.count();
    const orderCount = await prisma.order.count();
    const commentCount = await prisma.comment.count();
    const activityLikeCount = await prisma.activityLike.count();
    const commentLikeCount = await prisma.commentLike.count();
    
    console.log('📊 清理后统计:');
    console.log(`- 活动: ${activityCount}`);
    console.log(`- 订单: ${orderCount}`);
    console.log(`- 评论: ${commentCount}`);
    console.log(`- 活动点赞: ${activityLikeCount}`);
    console.log(`- 评论点赞: ${commentLikeCount}`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleClear();