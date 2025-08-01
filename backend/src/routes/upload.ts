import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadSingleActivityImage } from '../middleware/upload';

const router = Router();

// 单个活动图片上传接口
router.post('/', authenticateToken, uploadSingleActivityImage, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片文件'
      });
    }

    // 构建图片访问URL
    const imageUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/activities/${req.file.filename}`;
    
    console.log('图片上传成功:', {
      filename: req.file.filename,
      imageUrl,
      originalname: req.file.originalname
    });
    
    res.status(200).json({
      success: true,
      message: '图片上传成功',
      url: imageUrl,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败，请重试'
    });
  }
});

export default router;