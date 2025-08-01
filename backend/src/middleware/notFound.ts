import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      message: `路由 ${req.originalUrl} 未找到`,
      code: 404,
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
};