import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  registerValidation,
  updateProfileValidation,
  uploadAvatar,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { uploadSingleAvatar } from '../middleware/upload';

const router = Router();

// 直接在路由中定义登录验证，避免缓存问题
const directLoginValidation = [
  body('email')
    .exists()
    .withMessage('邮箱地址是必填的')
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .exists()
    .withMessage('密码是必填的')
    .notEmpty()
    .withMessage('密码不能为空'),
];

// 用户注册
router.post('/register', registerValidation, register);

// 用户登录
router.post('/login', directLoginValidation, login);

// 用户登出
router.post('/logout', logout);

// 获取用户信息（需要认证）
router.get('/profile', authenticateToken, getProfile);

// 更新用户信息（需要认证）
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);

// 上传头像（需要认证）
router.post('/upload-avatar', authenticateToken, uploadSingleAvatar, uploadAvatar);

export default router;