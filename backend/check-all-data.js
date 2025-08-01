const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('=== 数据库完整状态检查 ===\n');
    
    // 检查用户数据
    console.log('📊 用户数据:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
            orders: true,
            activityLikes: true,
            comments: true
          }
        }
      }
    });
    console.log(`总用户数: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - 活动:${user._count.activities} 订单:${user._count.orders} 点赞:${user._count.activityLikes} 评论:${user._count.comments}`);
    });
    console.log();
    
    // 检查活动数据
    console.log('🏃 活动数据:');
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        likeCount: true,
        viewCount: true,
        shareCount: true,
        currentParticipants: true,
        maxParticipants: true,
        createdAt: true,
        organizer: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            likes: true,
            orders: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`总活动数: ${activities.length}`);
    activities.forEach(activity => {
      console.log(`- [${activity.id}] ${activity.title}`);
      console.log(`  组织者: ${activity.organizer.username}`);
      console.log(`  状态: ${activity.status} | 分类: ${activity.category}`);
      console.log(`  点赞: ${activity.likeCount} (实际记录:${activity._count.likes}) | 浏览: ${activity.viewCount} | 分享: ${activity.shareCount}`);
      console.log(`  参与: ${activity.currentParticipants}/${activity.maxParticipants} (实际记录:${activity._count.orders})`);
      console.log(`  评论: ${activity._count.comments}`);
      console.log();
    });
    
    // 检查点赞记录
    console.log('❤️ 点赞记录:');
    const likes = await prisma.activityLike.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        },
        activity: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`总点赞记录数: ${likes.length}`);
    likes.forEach(like => {
      console.log(`- ${like.user.username} 点赞了 "${like.activity.title}" (${like.createdAt.toLocaleString()})`);
    });
    console.log();
    
    // 检查订单记录
    console.log('📝 订单记录:');
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        },
        activity: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`总订单记录数: ${orders.length}`);
    orders.forEach(order => {
      console.log(`- ${order.user.username} 订购了 "${order.activity.title}" (${order.participants}人) - ${order.status} - ¥${order.totalAmount} (${order.createdAt.toLocaleString()})`);
    });
    console.log();
    
    // 检查评论记录
    console.log('💬 评论记录:');
    const comments = await prisma.comment.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        },
        activity: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`总评论记录数: ${comments.length}`);
    comments.forEach(comment => {
      console.log(`- ${comment.user.username} 评论了 "${comment.activity.title}": ${comment.content.substring(0, 50)}... (评分:${comment.rating}) (${comment.createdAt.toLocaleString()})`);
    });
    console.log();
    
    // 数据一致性检查
    console.log('🔍 数据一致性检查:');
    for (const activity of activities) {
      const actualLikes = activity._count.likes;
      const storedLikes = activity.likeCount;
      const actualOrders = activity._count.orders;
      const storedParticipants = activity.currentParticipants;
      
      if (actualLikes !== storedLikes) {
        console.log(`⚠️  活动 "${activity.title}" 点赞数不一致: 存储=${storedLikes}, 实际=${actualLikes}`);
      }
      
      if (actualOrders !== storedParticipants) {
        console.log(`⚠️  活动 "${activity.title}" 参与人数不一致: 存储=${storedParticipants}, 实际=${actualOrders}`);
      }
    }
    
    console.log('\n=== 检查完成 ===');
    
  } catch (error) {
    console.error('检查数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();