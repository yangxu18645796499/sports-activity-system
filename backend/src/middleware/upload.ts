import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const avatarUploadDir = path.join(process.cwd(), 'uploads', 'avatars');
const activityUploadDir = path.join(process.cwd(), 'uploads', 'activities');

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

if (!fs.existsSync(activityUploadDir)) {
  fs.mkdirSync(activityUploadDir, { recursive: true });
}

// 头像存储配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// 活动图片存储配置
const activityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, activityUploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `activity-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件！'));
  }
};

// 创建multer实例
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB限制
  }
});

export const uploadActivityImage = multer({
  storage: activityStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  }
});

// 单个头像上传中间件
export const uploadSingleAvatar = uploadAvatar.single('avatar');

// 单个活动图片上传中间件
export const uploadSingleActivityImage = uploadActivityImage.single('image');

// 多个活动图片上传中间件（最多8张）
export const uploadMultipleActivityImages = uploadActivityImage.array('images', 8);