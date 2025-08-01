import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { userService } from '../services/userService';
import { AuthRequest } from '../middleware/auth';
import path from 'path';

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters long and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('nickname')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Nickname must be less than 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
];

// 新的登录验证函数
export const newLoginValidation = [
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

// 保留原来的loginValidation以防万一
export const loginValidation = newLoginValidation;

export const updateProfileValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters long and contain only letters, numbers, and underscores'),
  body('nickname')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Nickname must be less than 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a valid string'),
];

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Registration request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });
    
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { email, username, password, nickname, phone } = req.body;
    console.log('✅ Validation passed, creating user...');

    const result = await userService.createUser({
      email,
      username,
      password,
      nickname,
      phone,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already exists' || error.message === 'Username already exists') {
        res.status(409).json({
          error: error.message,
          code: 'DUPLICATE_USER',
        });
        return;
      }
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'REGISTRATION_FAILED',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 Login request received:', {
      body: req.body,
      headers: req.headers['content-type'],
      url: req.url,
      method: req.method
    });
    
    // 检查验证错误
    const errors = validationResult(req);
    console.log('🔍 Validation result:', {
      isEmpty: errors.isEmpty(),
      errors: errors.array()
    });
    
    if (!errors.isEmpty()) {
      console.log('❌ Login validation errors:', errors.array());
      res.status(400).json({
        message: '请求数据验证失败',
        errors: errors.array(),
      });
      return;
    }
    
    console.log('✅ Validation passed, proceeding with login...');

    const { email, password } = req.body;

    const result = await userService.loginUser({ email, password });

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      if (error.message === 'Account is deactivated') {
        res.status(403).json({
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
        });
        return;
      }
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'LOGIN_FAILED',
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'PROFILE_FETCH_FAILED',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { username, nickname, email, phone, avatar } = req.body;
    const userId = req.user.userId;

    const updatedUser = await userService.updateUser(userId, {
      username,
      nickname,
      email,
      phone,
      avatar,
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already exists' || error.message === 'Username already exists') {
        res.status(409).json({
          error: error.message,
          code: 'DUPLICATE_USER',
        });
        return;
      }
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'PROFILE_UPDATE_FAILED',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // 由于使用JWT，服务端无状态，客户端删除token即可
  res.status(200).json({
    message: 'Logout successful',
  });
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: '请选择要上传的头像文件' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '用户未认证' });
      return;
    }

    // 构建头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像
    const updatedUser = await userService.updateUser(userId, {
      avatar: avatarUrl
    });

    res.status(200).json({
      message: '头像上传成功',
      user: updatedUser,
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(500).json({ message: '头像上传失败' });
  }
};