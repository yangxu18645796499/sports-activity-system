const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function createSampleActivities() {
  try {
    console.log('=== 创建示例活动 ===\n');
    
    // 获取第一个用户作为组织者
    const organizer = await prisma.user.findFirst();
    if (!organizer) {
      console.log('❌ 没有找到用户，请先创建用户');
      return;
    }
    
    console.log(`📝 使用用户 ${organizer.username} 作为组织者`);
    
    const activities = [
      {
        title: '🏀 周末篮球友谊赛',
        description: '欢迎所有篮球爱好者参加，不限水平，重在参与和交流！',
        content: '活动将在市体育馆举行，提供专业篮球场地。请自备运动装备，现场提供饮用水。',
        category: 'BASKETBALL',
        type: 'OFFLINE',
        status: 'PUBLISHED',
        maxParticipants: 20,
        currentParticipants: 0,
        price: 30.00,
        location: '市体育馆篮球场',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一周后
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2小时后
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
        images: JSON.stringify(['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop']),
        tags: JSON.stringify(['篮球', '友谊赛', '周末', '体育馆', '团队运动']),
        organizerId: organizer.id
      },
      {
        title: '🏸 羽毛球训练营',
        description: '专业教练指导，适合初学者和进阶选手',
        content: '由专业羽毛球教练带领，包含基础技巧训练和实战练习。',
        category: 'BADMINTON',
        type: 'OFFLINE',
        status: 'PUBLISHED',
        maxParticipants: 16,
        currentParticipants: 0,
        price: 50.00,
        location: '羽毛球馆A区',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        images: JSON.stringify(['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop']),
        tags: JSON.stringify(['羽毛球', '训练营', '专业教练', '技巧提升', '室内运动']),
        organizerId: organizer.id
      },
      {
        title: '🏃‍♂️ 晨跑健身团',
        description: '每周三次晨跑，强身健体，结交朋友',
        content: '早上6:30集合，沿着公园跑道进行5公里慢跑，适合所有体能水平。',
        category: 'RUNNING',
        type: 'OFFLINE',
        status: 'PUBLISHED',
        maxParticipants: 30,
        currentParticipants: 0,
        price: 0.00,
        location: '中央公园南门',
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        images: JSON.stringify(['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop']),
        tags: JSON.stringify(['晨跑', '健身', '免费', '公园', '社交', '有氧运动']),
        organizerId: organizer.id
      },
      {
        title: '🏊‍♀️ 游泳技巧提升班',
        description: '专业游泳教练指导，提升游泳技巧',
        content: '针对已有游泳基础的学员，重点提升游泳姿势和技巧。',
        category: 'SWIMMING',
        type: 'OFFLINE',
        status: 'PUBLISHED',
        maxParticipants: 12,
        currentParticipants: 0,
        price: 80.00,
        location: '市游泳馆',
        startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        images: JSON.stringify(['https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop']),
        tags: JSON.stringify(['游泳', '技巧提升', '专业教练', '室内', '水上运动']),
        organizerId: organizer.id
      },
      {
        title: '🧘‍♀️ 瑜伽放松课程',
        description: '缓解工作压力，身心放松的瑜伽课程',
        content: '专业瑜伽老师带领，包含基础瑜伽动作和冥想练习。',
        category: 'YOGA',
        type: 'OFFLINE',
        status: 'PUBLISHED',
        maxParticipants: 15,
        currentParticipants: 0,
        price: 40.00,
        location: '瑜伽工作室',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        images: JSON.stringify(['https://images.unsplash.com/photo-1506629905607-d405b7a30db9?w=800&h=600&fit=crop']),
        tags: JSON.stringify(['瑜伽', '放松', '减压', '冥想', '身心健康', '室内']),
        organizerId: organizer.id
      }
    ];
    
    console.log('🎯 创建活动中...');
    
    for (let i = 0; i < activities.length; i++) {
      const activity = await prisma.activity.create({
        data: activities[i]
      });
      console.log(`✅ 创建活动: ${activity.title}`);
    }
    
    console.log('\n🎉 示例活动创建完成!');
    
    // 统计结果
    const activityCount = await prisma.activity.count();
    console.log(`📊 当前活动总数: ${activityCount}`);
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleActivities();