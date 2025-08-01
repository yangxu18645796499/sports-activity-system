import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../config/database';
import { z } from 'zod';

const router = express.Router();

// 用户更新验证模式
const updateUserSchema = z.object({
  nickname: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional()
});

// 获取公开统计信息 - 不需要认证
router.get('/stats/public', asyncHandler(async (req, res) => {
  try {
    // 获取总体统计信息
    const [totalActivities, totalUsers, totalComments] = await Promise.all([
      // 总活动数量
      prisma.activity.count(),
      // 总用户数量
      prisma.user.count(),
      // 总评论数量
      prisma.comment.count()
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        totalUsers,
        totalComments
      }
    });
  } catch (error) {
    console.error('获取公开统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
}));

// 获取用户个人统计信息 - 必须在 /:id 路由之前
router.get('/me/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 获取用户的统计信息
    const [createdActivitiesCount, registeredActivitiesCount, commentsCount] = await Promise.all([
      // 创建的活动数量
      prisma.activity.count({
        where: { organizerId: userId }
      }),
      // 参加的活动数量
      prisma.order.count({
        where: { 
          userId: userId,
          status: 'CONFIRMED'
        }
      }),
      // 评论的活动数量
      prisma.comment.count({
        where: { userId: userId }
      })
    ]);

    res.json({
      success: true,
      message: '获取个人统计成功',
      data: {
        createdActivities: createdActivitiesCount,
        registeredActivities: registeredActivitiesCount,
        comments: commentsCount
      }
    });
  } catch (error) {
    console.error('获取个人统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取个人统计失败'
    });
  }
}));

// 获取用户列表
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isActive = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search as string } },
        { email: { contains: search as string } },
        { nickname: { contains: search as string } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // 获取用户列表
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        phone: true,
        gender: true,
        birthday: true,
        bio: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // _count: {
        //   comments: true,
        //   activityLikes: true
        // }
      },
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 获取总数
    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      message: '获取用户列表成功',
      data: {
        users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
}));

// 获取用户详情
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        phone: true,
        gender: true,
        birthday: true,
        bio: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        activityLikes: {
          select: {
            id: true,
            createdAt: true,
            activity: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        orders: {
          select: {
            id: true,
            status: true,
            participants: true,
            createdAt: true,
            activity: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        comments: {
          select: {
            id: true,
            content: true,
            rating: true,
            createdAt: true,
            activity: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        // _count: {
        //   orders: true,
        //   comments: true,
        //   activityLikes: true
        // }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '获取用户详情成功',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    });
  }
}));

// 更新用户信息
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // 检查权限：只有管理员或用户本人可以更新
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userId !== id) {
      return res.status(403).json({
        success: false,
        message: '没有权限更新此用户信息'
      });
    }

    // 验证请求数据
    const validatedData = updateUserSchema.parse(req.body);

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 如果是普通用户，不能修改角色和激活状态
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      delete validatedData.role;
      delete validatedData.isActive;
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        phone: true,
        gender: true,
        birthday: true,
        bio: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
}));

// 删除用户（软删除）
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // 检查权限：只有管理员可以删除用户
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除用户'
      });
    }

    // 不能删除自己
    if (userId === id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 软删除：将用户设置为非激活状态
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
}));

// 获取用户创建的活动列表
router.get('/:id/created-activities', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const {
      page = 1,
      limit = 10,
      status = ''
    } = req.query;

    // 检查权限：只有用户本人或管理员可以查看
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userId !== id) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此用户的创建活动'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      organizerId: id
    };

    if (status) {
      where.status = status;
    }

    // 获取用户创建的活动
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          location: true,
          startTime: true,
          endTime: true,
          maxParticipants: true,
          price: true,
          status: true,
          coverImage: true,
          createdAt: true,
          _count: {
            select: {
              orders: {
                where: { status: 'CONFIRMED' }
              },
              comments: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.activity.count({ where })
    ]);

    res.json({
      success: true,
      message: '获取用户创建活动成功',
      data: {
        activities,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('获取用户创建活动失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户创建活动失败'
    });
  }
}));

// 获取用户报名的活动列表
router.get('/:id/registered-activities', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const {
      page = 1,
      limit = 10,
      status = ''
    } = req.query;

    // 检查权限：只有用户本人或管理员可以查看
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userId !== id) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此用户的报名活动'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      userId: id
    };

    if (status) {
      where.status = status;
    }

    // 获取用户报名的活动
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          participants: true,
          createdAt: true,
          activity: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              location: true,
              startTime: true,
              endTime: true,
              maxParticipants: true,
              price: true,
              status: true,
              coverImage: true,
              organizer: {
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  avatar: true
                }
              }
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      message: '获取用户报名活动成功',
      data: {
        orders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('获取用户报名活动失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户报名活动失败'
    });
  }
}));



// 获取用户统计信息
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userRole = req.user?.role;

    // 检查权限：只有管理员可以查看统计信息
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: '没有权限查看统计信息'
      });
    }

    // 获取用户统计
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const inactiveUsers = await prisma.user.count({ where: { isActive: false } });
    
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    // 最近30天新注册用户
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      message: '获取用户统计成功',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        newUsersLast30Days
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
}));

export default router;