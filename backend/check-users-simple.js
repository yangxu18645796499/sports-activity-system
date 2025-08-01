const { PrismaClient } = require('./src/generated/prisma');

async function checkUsers() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    console.log('用户数量:', users.length);
    users.forEach(user => {
      console.log('用户:', user.username, user.email);
    });
  } catch (error) {
    console.error('查询用户失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();