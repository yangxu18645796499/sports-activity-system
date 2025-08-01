import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // 日志记录错误
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Prisma错误处理
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = '数据库操作失败';
    error = createError(message, 400);
  }

  // Prisma验证错误
  if (err.name === 'PrismaClientValidationError') {
    const message = '数据验证失败';
    error = createError(message, 400);
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    const message = '无效的访问令牌';
    error = createError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = '访问令牌已过期';
    error = createError(message, 401);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    const message = '输入数据验证失败';
    error = createError(message, 400);
  }

  // 类型转换错误
  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = createError(message, 404);
  }

  // 重复字段错误
  if (err.message && err.message.includes('duplicate key')) {
    const message = '资源已存在';
    error = createError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || '服务器内部错误',
      code: error.statusCode || 500,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

// 创建自定义错误
export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// 异步错误捕获包装器
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};