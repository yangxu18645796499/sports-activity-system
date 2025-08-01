const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function deleteActivityByName() {
  try {
    console.log('正在查找名称为"真是个"的活动...');
    
    // 首先查找活动
    const activity = await prisma.activity.findFirst({
      where: {
        title: '真是个'
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!activity) {
      console.log('未找到名称为"真是个"的活动');
      return;
    }
    
    console.log('找到活动:', {
      id: activity.id,
      title: activity.title,
      organizer: activity.organizer.username,
      createdAt: activity.createdAt
    });
    
    // 使用事务删除活动及其相关数据
    await prisma.$transaction(async (tx) => {
      // 删除相关的活动点赞记录
      const deletedActivityLikes = await tx.activityLike.deleteMany({
        where: { activityId: activity.id }
      });
      console.log(`删除了 ${deletedActivityLikes.count} 条活动点赞记录`);
      
      // 删除相关评论的点赞记录
      const comments = await tx.comment.findMany({
        where: { activityId: activity.id },
        select: { id: true }
      });
      
      if (comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const deletedCommentLikes = await tx.commentLike.deleteMany({
          where: { commentId: { in: commentIds } }
        });
        console.log(`删除了 ${deletedCommentLikes.count} 条评论点赞记录`);
      }
      
      // 删除相关的评论
      const deletedComments = await tx.comment.deleteMany({
        where: { activityId: activity.id }
      });
      console.log(`删除了 ${deletedComments.count} 条评论`);
      
      // 删除相关的订单记录
      const deletedOrders = await tx.order.deleteMany({
        where: { activityId: activity.id }
      });
      console.log(`删除了 ${deletedOrders.count} 条订单记录`);
      
      // 最后删除活动本身
      await tx.activity.delete({
        where: { id: activity.id }
      });
      
      console.log('✅ 活动及其相关数据已成功删除');
    });
    
  } catch (error) {
    console.error('删除活动时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行删除操作
deleteActivityByName();