
import { PrismaClient, ActivityCategory, ActivityStatus } from '../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import * as express from 'express';

const prisma = new PrismaClient();
const router = express.Router();

// 分类到英文枚举的映射（支持中文和英文）
const categoryMapping: Record<string, ActivityCategory> = {
  // 中文分类
  '足球': 'FOOTBALL',
  '篮球': 'BASKETBALL',
  '排球': 'VOLLEYBALL',
  '网球': 'TENNIS',
  '羽毛球': 'BADMINTON',
  '乒乓球': 'PINGPONG',
  '游泳': 'SWIMMING',
  '跑步': 'RUNNING',
  '健身': 'FITNESS',
  '瑜伽': 'YOGA',
  '舞蹈': 'DANCING',
  '骑行': 'CYCLING',
  '徒步': 'HIKING',
  '武术': 'MARTIAL_ARTS',
  '高尔夫': 'GOLF',
  '滑雪': 'SKIING',
  '攀岩': 'CLIMBING',
  '拳击': 'BOXING',
  '体操': 'GYMNASTICS',
  '其他': 'OTHER',
  // 英文分类（前端使用）
  'basketball': 'BASKETBALL',
  'football': 'FOOTBALL',
  'badminton': 'BADMINTON',
  'tennis': 'TENNIS',
  'swimming': 'SWIMMING',
  'running': 'RUNNING',
  'yoga': 'YOGA',
  'fitness': 'FITNESS',
  'volleyball': 'VOLLEYBALL',
  'pingpong': 'PINGPONG',
  'cycling': 'CYCLING',
  'hiking': 'HIKING',
  'dancing': 'DANCING',
  'martial_arts': 'MARTIAL_ARTS',
  'golf': 'GOLF',
  'skiing': 'SKIING',
  'climbing': 'CLIMBING',
  'boxing': 'BOXING',
  'gymnastics': 'GYMNASTICS',
  'other': 'OTHER'
};

// 转换中文分类到英文枚举
function mapCategoryToEnum(chineseCategory: string): ActivityCategory {
  return categoryMapping[chineseCategory] || 'OTHER';
}

// 反向映射：英文枚举到中文分类
const reverseCategoryMapping: Record<ActivityCategory, string> = {
  'BASKETBALL': '篮球',
  'FOOTBALL': '足球',
  'BADMINTON': '羽毛球',
  'TENNIS': '网球',
  'SWIMMING': '游泳',
  'RUNNING': '跑步',
  'YOGA': '瑜伽',
  'FITNESS': '健身',
  'VOLLEYBALL': '排球',
  'PINGPONG': '乒乓球',
  'CYCLING': '骑行',
  'HIKING': '徒步',
  'DANCING': '舞蹈',
  'MARTIAL_ARTS': '武术',
  'GOLF': '高尔夫',
  'SKIING': '滑雪',
  'CLIMBING': '攀岩',
  'BOXING': '拳击',
  'GYMNASTICS': '体操',
  'OTHER': '其他'
};

// 转换英文枚举到中文分类
function mapEnumToCategory(enumCategory: ActivityCategory): string {
  return reverseCategoryMapping[enumCategory] || '其他';
}

// 定义更新活动数据的接口
interface UpdateActivityData {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  registrationDeadline?: Date | null;
  maxParticipants?: number;
  price?: number;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  requirements?: string;
  contactInfo?: string;
  isRecommended?: boolean;
}

// 创建活动路由
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }
  
  const validatedData = createActivitySchema.parse(req.body);
  
  // 验证时间逻辑
  const startTime = new Date(validatedData.startTime);
  const endTime = new Date(validatedData.endTime);
  const registrationDeadline = new Date(validatedData.registrationDeadline);
  
  if (endTime <= startTime) {
    return res.status(400).json({
      success: false,
      message: '活动结束时间必须晚于开始时间'
    });
  }
  
  if (registrationDeadline >= startTime) {
    return res.status(400).json({
      success: false,
      message: '报名截止时间必须早于活动开始时间'
    });
  }
  
  // 确保coverImage是images数组的第一个元素
  let finalCoverImage = validatedData.coverImage;
  let finalImages = validatedData.images;
  
  if (validatedData.images && validatedData.images.length > 0) {
    // 如果有images数组，coverImage应该是第一个图片
    finalCoverImage = validatedData.images[0];
  } else if (validatedData.coverImage) {
    // 如果只有coverImage，将其作为images数组的第一个元素
    finalImages = [validatedData.coverImage];
  }
  
  console.log('创建活动 - 封面图片设置:', {
    originalCoverImage: validatedData.coverImage,
    originalImages: validatedData.images,
    finalCoverImage,
    finalImages
  });

  // 创建活动
  const activity = await prisma.activity.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      category: mapCategoryToEnum(validatedData.category),
      location: validatedData.location,
      startTime,
      endTime,
      registrationDeadline,
      maxParticipants: validatedData.maxParticipants,
      price: validatedData.price,
      coverImage: finalCoverImage,
      images: finalImages ? JSON.stringify(finalImages) : null,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      requirements: validatedData.requirements,
      contactInfo: validatedData.contactInfo,
      isRecommended: validatedData.isRecommended || false,
      organizerId: userId,
      status: 'PUBLISHED' as const,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0
    },
    include: {
      organizer: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          email: true
        }
      }
    }
  });
  
  res.status(201).json({
    success: true,
    message: '活动创建成功',
    data: {
      activity
    }
  });
}));



// 验证schemas
const createActivitySchema = z.object({
  title: z.string().min(1, '活动标题不能为空').max(100, '活动标题不能超过100字符'),
  description: z.string().min(1, '活动描述不能为空').max(2000, '活动描述不能超过2000字符'),
  category: z.string().min(1, '活动分类不能为空'),
  location: z.string().min(1, '活动地点不能为空'),
  startTime: z.string().datetime('开始时间格式不正确'),
  endTime: z.string().datetime('结束时间格式不正确'),
  registrationDeadline: z.string().datetime('报名截止时间格式不正确'),
  maxParticipants: z.number().int().min(1, '最大参与人数必须大于0'),
  price: z.number().min(0, '价格不能为负数'),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  contactInfo: z.string().optional(),
  isRecommended: z.boolean().optional().default(false)
});

const updateActivitySchema = createActivitySchema.partial();

const registerActivitySchema = z.object({
  participants: z.number().int().min(1, '参与人数必须大于0'),
  notes: z.string().optional()
});

const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(500, '评论内容不能超过500字符'),
  rating: z.number().int().min(1).max(5, '评分必须在1-5之间'),
  images: z.array(z.string().url()).optional()
});

// 获取活动列表
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    priceMin,
    priceMax,
    startDate,
    endDate,
    location,
    tags
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // 构建查询条件
  interface WhereClause {
    category?: ActivityCategory;
    status?: ActivityStatus;
    OR?: Array<{[key: string]: any}>;
    price?: {gte?: number; lte?: number};
    startTime?: {gte?: Date; lte?: Date};
    location?: {contains?: string; mode?: 'insensitive'};
    tags?: {hasSome?: string[]};
    AND?: Array<{[key: string]: any}>;
  }

  const where: WhereClause = {};

  if (category) {
    // 使用映射函数转换分类值
    const mappedCategory = categoryMapping[category as string];
    if (mappedCategory) {
      where.category = mappedCategory;
    }
  }

  if (status) {
    where.status = status as ActivityStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { description: { contains: search as string } },
      { location: { contains: search as string } }
    ];
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) {
      where.price.gte = parseFloat(priceMin as string);
    }
    if (priceMax !== undefined) {
      where.price.lte = parseFloat(priceMax as string);
    }
  }

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) {
      where.startTime.gte = new Date(startDate as string);
    }
    if (endDate) {
      where.startTime.lte = new Date(endDate as string);
    }
  }

  // 地点筛选
  if (location) {
    where.location = {
      contains: location as string
    };
  }

  // 标签筛选
  if (tags) {
    const tagArray = (tags as string).split(',').filter(tag => tag.trim());
    if (tagArray.length > 0) {
      // 由于tags字段存储为JSON字符串，需要使用字符串包含查询
      const tagConditions = tagArray.map(tag => ({
        tags: {
          contains: `"${tag}"`
        }
      }));
      
      // 如果已经有搜索条件（OR条件），需要使用AND来组合
      if (where.OR) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: tagConditions
        });
      } else {
        // 如果没有搜索条件，直接使用OR进行标签匹配
        where.OR = tagConditions;
      }
    }
  }

  // 构建排序条件
  interface OrderByClause {
    [key: string]: 'asc' | 'desc';
  }

  const orderBy: OrderByClause = {};
  orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

  try {
    // 执行查询
  const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              email: true
            }
          },
          _count: {
            select: {
              orders: true,
              comments: true
            }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    // 计算当前参与人数并转换分类为中文
    const activitiesWithParticipants = activities.map((activity: any) => ({
      ...activity,
      category: mapEnumToCategory(activity.category),
      currentParticipants: activity._count.orders,
      commentCount: activity._count.comments,
      creatorId: activity.organizer.id, // 添加creatorId字段供前端使用
      _count: undefined
    }));

    // 解析 JSON 字符串字段
    const processedActivities = activitiesWithParticipants.map((activity: any) => ({
      ...activity,
      tags: activity.tags ? JSON.parse(activity.tags) : [],
      images: activity.images ? JSON.parse(activity.images) : []
    }));

    res.status(200).json({
      success: true,
      message: '获取活动列表成功',
      data: {
        activities: processedActivities,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    return; // 添加明确的返回语句
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取活动列表失败'
    });
  }
}));

// 获取单个活动详情
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            email: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true
              }
            },
            likes: {
              include: {
                user: {
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
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            orders: true,
            comments: true
          }
        }
      }
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 处理活动数据
    const processedActivity = {
      ...activity,
      category: mapEnumToCategory(activity.category),
      tags: activity.tags ? JSON.parse(activity.tags) : [],
      images: activity.images ? JSON.parse(activity.images) : [],
      currentParticipants: activity._count.orders,
      commentCount: activity._count.comments,
      creatorId: activity.organizer.id, // 添加creatorId字段供前端使用
      comments: activity.comments.map(comment => ({
        ...comment,
        images: comment.images ? JSON.parse(comment.images) : []
      })),
      _count: undefined
    };
    
    res.status(200).json({
      success: true,
      message: '获取活动详情成功',
      data: processedActivity
    });
    
  } catch (error) {
    console.error('获取活动详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取活动详情失败'
    });
  }
}));

// 更新活动
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }
    
    const validatedData = updateActivitySchema.parse(req.body);
    
    // 检查活动是否存在且用户是否为组织者
    const activity = await prisma.activity.findUnique({
      where: { id }
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    if (activity.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有活动组织者可以修改活动'
      });
    }
    
    // 如果更新时间相关字段，需要验证时间逻辑
    if (validatedData.startTime || validatedData.endTime || validatedData.registrationDeadline) {
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : activity.startTime;
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : activity.endTime;
      const registrationDeadline = validatedData.registrationDeadline ? new Date(validatedData.registrationDeadline) : activity.registrationDeadline;
      
      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: '活动结束时间必须晚于开始时间'
        });
      }
      
      if (registrationDeadline && registrationDeadline >= startTime) {
        return res.status(400).json({
          success: false,
          message: '报名截止时间必须早于活动开始时间'
        });
      }
    }
    
    interface UpdateActivityData {
      [key: string]: any;
      startTime?: Date | undefined;
      endTime?: Date | undefined;
      registrationDeadline?: Date | undefined;
    }
    
    // 创建一个不包含时间字段的更新数据对象
    const { startTime, endTime, registrationDeadline, category, coverImage, images, ...restData } = validatedData;
    const updateData: UpdateActivityData = { ...restData };
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.registrationDeadline) updateData.registrationDeadline = new Date(validatedData.registrationDeadline);
    if (validatedData.category) updateData.category = validatedData.category as ActivityCategory;
    
    // 确保coverImage是images数组的第一个元素
    let finalCoverImage = coverImage;
    let finalImages = images;
    
    if (images && images.length > 0) {
      // 如果有images数组，coverImage应该是第一个图片
      finalCoverImage = images[0];
    } else if (coverImage) {
      // 如果只有coverImage，将其作为images数组的第一个元素
      finalImages = [coverImage];
    }
    
    // 只有在提供了图片相关字段时才更新
    if (coverImage !== undefined || images !== undefined) {
      updateData.coverImage = finalCoverImage;
      updateData.images = finalImages;
      
      console.log('更新活动 - 封面图片设置:', {
        originalCoverImage: coverImage,
        originalImages: images,
        finalCoverImage,
        finalImages
      });
    }
    
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            email: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: '活动更新成功',
      data: {
        activity: updatedActivity
      }
    });
    return; // 添加明确的返回语句
  } catch (error: any) {
    console.error('更新活动失败:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: '更新活动失败'
    });
  }
}));



// 活动报名
router.post('/:id/register', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }
    
    const validatedData = registerActivitySchema.parse(req.body);

    // 检查活动是否存在
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: 'CONFIRMED' },
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }

    // 检查活动状态
    if (activity.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: '活动未开放报名'
      });
    }

    // 检查报名截止时间
    if (activity.registrationDeadline && new Date() > activity.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: '报名已截止'
      });
    }

    // 检查是否已报名
    const existingOrder = await prisma.order.findFirst({
      where: {
        activityId: id,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: '您已报名此活动'
      });
    }

    // 检查剩余名额
    // 计算当前参与人数
    const currentParticipants = activity.orders.reduce((sum: number, order: { participants: number }) => sum + order.participants, 0);
    
    // 获取参与者列表（去重）
    const participantsMap = new Map();
    activity.orders.forEach((order: { user: { id: string } }) => {
    if (!participantsMap.has(order.user.id)) {
    participantsMap.set(order.user.id, order.user);
    }
    });
    // 不需要将participantsMap转换为数组，因为我们只需要计算剩余名额
    
    // 如果maxParticipants为null,则表示无人数限制
    const remainingSlots = activity.maxParticipants === null ? Number.MAX_SAFE_INTEGER : activity.maxParticipants - currentParticipants;

    // 确保validatedData.participants是数字类型
    const requestedParticipants = Number(validatedData.participants);
    if (requestedParticipants > remainingSlots) {
      return res.status(400).json({
        success: false,
        message: `剩余名额不足，仅剩${remainingSlots}个名额`
      });
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        activityId: id,
        userId,
        participants: requestedParticipants,
        totalAmount: new Decimal(activity.price.toString()).mul(requestedParticipants),
        notes: validatedData.notes,
        status: activity.price.equals(0) ? 'CONFIRMED' : 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: '报名成功',
      data: {
        order
      }
    });
    return; // 添加明确的返回语句
  } catch (error: any) {
    console.error('活动报名失败:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: '报名失败'
    });
  }
}));

// 取消报名
router.delete('/:id/register', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 检查活动是否存在
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }

    // 检查活动开始时间
    if (new Date() > activity.startTime) {
      return res.status(400).json({
        success: false,
        message: '活动已开始，无法取消报名'
      });
    }

    // 检查用户是否已经报名
    const existingOrder = await prisma.order.findFirst({
      where: {
        activityId: id,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (!existingOrder) {
      return res.status(400).json({
        success: false,
        message: '您尚未报名此活动'
      });
    }

    // 删除订单记录
    await prisma.order.delete({
      where: {
        id: existingOrder.id
      }
    });

    res.status(200).json({
      success: true,
      message: '取消报名成功'
    });
    return;
  } catch (error: any) {
    console.error('取消报名失败:', error);
    return res.status(500).json({
      success: false,
      message: '取消报名失败'
    });
  }
}));

// 增加浏览量
router.post('/:id/view', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    await prisma.activity.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      success: true,
      message: '浏览量更新成功'
    });
    return; // 添加明确的返回语句
  } catch (error) {
    console.error('更新浏览量失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新浏览量失败'
    });
  }
}));

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 检查是否已点赞
    const existingLike = await prisma.activityLike.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId: id
        }
      }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.activityLike.delete({
          where: {
            userId_activityId: {
              userId,
              activityId: id
            }
          }
        }),
        prisma.activity.update({
          where: { id },
          data: {
            likeCount: {
              decrement: 1
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        message: '取消点赞成功',
        data: { liked: false }
      });
      return; // 添加明确的返回语句
    } else {
      // 添加点赞
      await prisma.$transaction([
        prisma.activityLike.create({
          data: {
            userId,
            activityId: id
          }
        }),
        prisma.activity.update({
          where: { id },
          data: {
            likeCount: {
              increment: 1
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        message: '点赞成功',
        data: { liked: true }
      });
      return; // 添加明确的返回语句
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    return res.status(500).json({
      success: false,
      message: '点赞操作失败'
    });
  }
}));

// 获取点赞状态
router.get('/:id/like-status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 检查是否已点赞
    const existingLike = await prisma.activityLike.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId: id
        }
      }
    });

    res.status(200).json({
      success: true,
      message: '获取点赞状态成功',
      data: { isLiked: !!existingLike }
    });
    return;
  } catch (error) {
    console.error('获取点赞状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取点赞状态失败'
    });
  }
}));

// 分享
router.post('/:id/share', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    await prisma.activity.update({
      where: { id },
      data: {
        shareCount: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      success: true,
      message: '分享成功'
    });
    return; // 添加明确的返回语句
  } catch (error) {
    console.error('分享失败:', error);
    return res.status(500).json({ // 添加return语句
      success: false,
      message: '分享失败'
    });
  }
}));

// 添加评论
router.post('/:id/comments', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }
    
    const validatedData = commentSchema.parse(req.body);

    // 检查活动是否存在
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }

    // 检查用户是否参与了活动（允许PENDING和CONFIRMED状态）
    const userOrder = await prisma.order.findFirst({
      where: {
        activityId: id,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (!userOrder) {
      return res.status(403).json({
        success: false,
        message: '只有参与活动的用户才能评论'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        rating: validatedData.rating,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        activityId: id,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '评论成功',
      data: {
        comment
      }
    });
    return; // 添加明确的返回语句
  } catch (error: any) {
    console.error('评论失败:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: '评论失败'
    });
  }
}));

// 检查用户是否已报名活动
router.get('/:id/registration-status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未登录'
    });
  }

  try {
    // 检查是否已报名
    const existingOrder = await prisma.order.findFirst({
      where: {
        activityId: id,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    res.json({
      success: true,
      data: {
        isRegistered: !!existingOrder,
        order: existingOrder ? {
          id: existingOrder.id,
          participants: existingOrder.participants,
          status: existingOrder.status,
          createdAt: existingOrder.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('检查报名状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查报名状态失败'
    });
  }
}));

// 删除活动
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '活动ID不能为空'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }
    
    console.log('🗑️ [DEBUG] 删除活动请求 - 活动ID:', id, '用户ID:', userId);
    
    // 查找活动
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        organizer: true,
        orders: true
      }
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 检查权限：只有活动创建者可以删除
    if (activity.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: '您没有权限删除此活动'
      });
    }
    
    // 检查活动状态：只能删除尚未开始的活动
    const now = new Date();
    const startTime = new Date(activity.startTime);
    
    if (startTime <= now) {
      return res.status(400).json({
        success: false,
        message: '活动已开始，无法删除'
      });
    }
    
    // 检查是否有人已报名
    if (activity.orders && activity.orders.length > 0) {
      return res.status(400).json({
        success: false,
        message: '已有用户报名，无法删除活动。请联系管理员处理。'
      });
    }
    
    console.log('🗑️ [DEBUG] 开始删除活动相关数据...');
    
    // 使用事务删除所有相关数据
    await prisma.$transaction(async (tx) => {
      // 删除活动点赞记录
      await tx.activityLike.deleteMany({
        where: { activityId: id }
      });
      
      // 删除评论点赞记录
      await tx.commentLike.deleteMany({
        where: {
          comment: {
            activityId: id
          }
        }
      });
      
      // 删除评论记录
      await tx.comment.deleteMany({
        where: { activityId: id }
      });
      
      // 删除订单记录（虽然前面已经检查过，但为了安全起见）
      await tx.order.deleteMany({
        where: { activityId: id }
      });
      
      // 最后删除活动本身
      await tx.activity.delete({
        where: { id }
      });
    });
    
    console.log('✅ [DEBUG] 活动删除成功:', id);
    
    res.status(200).json({
      success: true,
      message: '活动删除成功'
    });
    
  } catch (error: any) {
    console.error('❌ [DEBUG] 删除活动失败:', error);
    
    // 处理特定的Prisma错误
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '删除活动失败，请稍后重试'
    });
  }
}));

// 按名称删除活动
router.delete('/delete-by-name/:name', authenticateToken, asyncHandler(async (req, res) => {
  const { name } = req.params;
  const userId = req.user?.userId;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: '活动名称不能为空'
    });
  }
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }
  
  console.log('🗑️ [DEBUG] 按名称删除活动请求 - 活动名称:', decodeURIComponent(name), '用户ID:', userId);
  
  // 查找活动
  const activity = await prisma.activity.findFirst({
    where: { 
      title: decodeURIComponent(name)
    },
    include: {
      organizer: true
    }
  });
  
  if (!activity) {
    return res.status(404).json({
      success: false,
      message: '活动不存在'
    });
  }
  
  // 检查权限：只有活动创建者可以删除
  if (activity.organizerId !== userId) {
    return res.status(403).json({
      success: false,
      message: '您没有权限删除此活动'
    });
  }
  
  console.log('🗑️ [DEBUG] 开始删除活动相关数据...');
  
  // 使用事务删除所有相关数据
  await prisma.$transaction(async (tx) => {
    // 删除活动点赞记录
    const deletedActivityLikes = await tx.activityLike.deleteMany({
      where: { activityId: activity.id }
    });
    console.log(`删除了 ${deletedActivityLikes.count} 条活动点赞记录`);
    
    // 删除评论点赞记录
    const deletedCommentLikes = await tx.commentLike.deleteMany({
      where: {
        comment: {
          activityId: activity.id
        }
      }
    });
    console.log(`删除了 ${deletedCommentLikes.count} 条评论点赞记录`);
    
    // 删除评论记录
    const deletedComments = await tx.comment.deleteMany({
      where: { activityId: activity.id }
    });
    console.log(`删除了 ${deletedComments.count} 条评论`);
    
    // 删除订单记录
    const deletedOrders = await tx.order.deleteMany({
      where: { activityId: activity.id }
    });
    console.log(`删除了 ${deletedOrders.count} 条订单记录`);
    
    // 最后删除活动本身
    await tx.activity.delete({
      where: { id: activity.id }
    });
  });
  
  console.log('✅ [DEBUG] 活动删除成功:', activity.id);
  
  res.status(200).json({
    success: true,
    message: '活动删除成功'
  });
  
}));

export default router;