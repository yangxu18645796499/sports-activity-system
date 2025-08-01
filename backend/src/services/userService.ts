import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken } from '../config/jwt';
import { User, UserRole } from '../generated/prisma';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  birthday?: Date;
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUserByEmail) {
      throw new Error('Email already exists');
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUserByUsername) {
      throw new Error('Username already exists');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async loginUser(loginData: LoginData): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 检查用户是否激活
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<Omit<User, 'password'>> {
    // 检查邮箱是否已被其他用户使用
    if (updateData.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new Error('Email already exists');
      }
    }

    // 检查用户名是否已被其他用户使用
    if (updateData.username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: updateData.username },
      });

      if (existingUserByUsername && existingUserByUsername.id !== userId) {
        throw new Error('Username already exists');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return {
      users: usersWithoutPassword,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const userService = new UserService();