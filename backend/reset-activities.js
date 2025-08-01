const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function resetActivities() {
  try {
    console.log('=== 重置活动数据 ===\n');
    
    // 删除所有相关数据
    console.log('🗑️  删除所有点赞记录...');
    await prisma.like.deleteMany({});
    
    console.log('🗑️  删除所有评论记录...');
    await prisma.comment.deleteMany({});
    
    console.log('🗑️  删除所有订单记录...');
    await prisma.order.deleteMany({});
    
    console.log('🗑️  删除所有活动记录...');
    await prisma.activity.deleteMany({});
    
    console.log('✅ 所有活动数据已清空\n');
    
    // 获取现有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ 没有找到用户，无法创建示例活动');
      return;
    }
    
    const organizer = users[0]; // 使用第一个用户作为组织者
    console.log(`📝 使用用户 "${organizer.username}" 创建示例活动...\n`);
    
    // 创建一些示例活动
    const sampleActivities = [
      {
        title: '🏀 周末篮球友谊赛',
        description: '欢迎所有篮球爱好者参加我们的周末友谊赛！无论你是新手还是老手，都能在这里找到属于自己的快乐。我们提供专业的篮球场地和裁判，只需要带上你的热情和运动装备即可。',
        category: 'BASKETBALL',
        location: '体育馆篮球场A',
        startTime: new Date('2025-01-11T14:00:00Z'),
        endTime: new Date('2025-01-11T17:00:00Z'),
        registrationDeadline: new Date('2025-01-10T20:00:00Z'),
        maxParticipants: 20,
        price: 0,
        contactInfo: 'basketball@sports.com',
        images: JSON.stringify(['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800']),
        tags: JSON.stringify(['篮球', '友谊赛', '周末', '免费'])
      },
      {
        title: '🧘‍♀️ 瑜伽冥想体验课',
        description: '在忙碌的生活中给自己一个放松的机会。专业瑜伽老师将带领大家进行基础瑜伽练习和冥想，适合所有水平的练习者。课程包含瑜伽垫和道具使用。',
        category: 'YOGA',
        location: '瑜伽室201',
        startTime: new Date('2025-01-12T10:00:00Z'),
        endTime: new Date('2025-01-12T11:30:00Z'),
        registrationDeadline: new Date('2025-01-11T18:00:00Z'),
        maxParticipants: 15,
        price: 50,
        contactInfo: 'yoga@sports.com',
        images: JSON.stringify(['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800']),
        tags: JSON.stringify(['瑜伽', '冥想', '放松', '健康'])
      },
      {
        title: '🏊‍♂️ 游泳技能提升班',
        description: '专业游泳教练指导，帮助大家提升游泳技能。课程包含自由泳、蛙泳技巧讲解和实践。适合有一定游泳基础的朋友参加。',
        category: 'SWIMMING',
        location: '游泳馆',
        startTime: new Date('2025-01-13T19:00:00Z'),
        endTime: new Date('2025-01-13T20:30:00Z'),
        registrationDeadline: new Date('2025-01-12T20:00:00Z'),
        maxParticipants: 12,
        price: 80,
        contactInfo: 'swimming@sports.com',
        images: JSON.stringify(['https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800']),
        tags: JSON.stringify(['游泳', '技能提升', '教练指导'])
      },
      {
        title: '🥾 户外徒步登山活动',
        description: '走出城市，拥抱自然！我们将前往附近的山区进行徒步登山活动。路线适中，风景优美，是放松身心的绝佳选择。请准备好登山装备和充足的水。',
        category: 'HIKING',
        location: '青山风景区',
        startTime: new Date('2025-01-14T08:00:00Z'),
        endTime: new Date('2025-01-14T16:00:00Z'),
        registrationDeadline: new Date('2025-01-13T18:00:00Z'),
        maxParticipants: 25,
        price: 30,
        contactInfo: 'hiking@sports.com',
        images: JSON.stringify(['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800']),
        tags: JSON.stringify(['徒步', '登山', '户外', '自然'])
      },
      {
        title: '🏓 乒乓球团体赛',
        description: '乒乓球爱好者的盛会！团体赛形式，既有竞技性又充满乐趣。我们提供专业球桌和比赛用球，欢迎各个水平的选手参加。',
        category: 'PINGPONG',
        location: '乒乓球馆',
        startTime: new Date('2025-01-15T14:00:00Z'),
        endTime: new Date('2025-01-15T18:00:00Z'),
        registrationDeadline: new Date('2025-01-14T20:00:00Z'),
        maxParticipants: 16,
        price: 25,
        contactInfo: 'pingpong@sports.com',
        images: JSON.stringify(['https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800']),
        tags: JSON.stringify(['乒乓球', '团体赛', '比赛'])
      }
    ];
    
    // 创建活动
    for (const activityData of sampleActivities) {
      const activity = await prisma.activity.create({
        data: {
          ...activityData,
          organizerId: organizer.id,
          status: 'PUBLISHED',
          viewCount: 0,
          likeCount: 0,
          shareCount: 0,
          currentParticipants: 0
        }
      });
      
      console.log(`✅ 创建活动: ${activity.title}`);
    }
    
    console.log('\n🎉 活动数据重置完成!');
    
    // 显示最终统计
    const finalCount = await prisma.activity.count();
    console.log(`📊 当前活动总数: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ 重置过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetActivities();