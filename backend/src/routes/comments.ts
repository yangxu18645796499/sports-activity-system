import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../config/database';

const router = express.Router();

// 获取评论列表
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: '获取评论列表成功',
    data: {
      comments: [],
      total: 0,
      page: 1,
      limit: 10
    }
  });
}));

// 获取特定活动的评论
router.get('/activity/:activityId', asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  res.status(200).json({
    success: true,
    message: '获取活动评论成功',
    data: {
      comments: [],
      activityId,
      total: 0
    }
  });
}));

// 创建评论
router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    message: '评论创建成功',
    data: {
      comment: {
        message: '评论创建功能待实现'
      }
    }
  });
}));

// 更新评论
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  res.status(200).json({
    success: true,
    message: '评论更新成功',
    data: {
      comment: {
        id,
        message: '评论更新功能待实现'
      }
    }
  });
}));

// 删除评论
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }

  // 检查评论是否存在
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      activity: {
        select: {
          organizerId: true
        }
      }
    }
  });

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: '评论不存在'
    });
  }

  // 检查权限：只有评论作者或活动创建者可以删除评论
  if (comment.userId !== userId && comment.activity.organizerId !== userId) {
    return res.status(403).json({
      success: false,
      message: '您没有权限删除此评论'
    });
  }

  // 使用事务删除评论及其相关数据
  await prisma.$transaction(async (tx) => {
    // 删除评论的点赞记录
    await tx.commentLike.deleteMany({
      where: { commentId: id }
    });

    // 删除评论
    await tx.comment.delete({
      where: { id }
    });
  });

  res.status(200).json({
    success: true,
    message: '评论删除成功'
  });
}));

// 点赞/取消点赞评论
router.post('/:id/like', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }

  // 检查评论是否存在
  const comment = await prisma.comment.findUnique({
    where: { id }
  });

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: '评论不存在'
    });
  }

  // 检查是否已点赞
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId: id
      }
    }
  });

  if (existingLike) {
    // 取消点赞
    await prisma.$transaction([
      prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId: id
          }
        }
      }),
      prisma.comment.update({
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
      data: {
        liked: false,
        likeCount: comment.likeCount - 1
      }
    });
  } else {
    // 添加点赞
    await prisma.$transaction([
      prisma.commentLike.create({
        data: {
          userId,
          commentId: id
        }
      }),
      prisma.comment.update({
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
      data: {
        liked: true,
        likeCount: comment.likeCount + 1
      }
    });
  }
}));

// 获取评论点赞状态
router.get('/:id/like-status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId: id
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      liked: !!existingLike
    }
  });
}));

export default router;