# 体育活动室管理系统

一个现代化的体育活动管理平台，基于 React + TypeScript + Node.js + SQLite 构建，提供完整的活动发布、报名、管理、评论和用户管理功能。

## 📖 项目概述

本系统是一个全栈的体育活动管理平台，旨在为体育场馆、学校、社区等机构提供便捷的活动组织和管理解决方案。系统支持多角色用户（管理员、普通用户），提供活动的全生命周期管理，从活动创建、发布、报名到结束评价的完整流程。

### 核心特性
- 🎯 **活动管理**: 创建、编辑、删除活动，支持封面图片上传
- 👥 **用户系统**: 完整的用户注册、登录、个人资料管理
- 📝 **报名系统**: 活动报名、取消报名、报名状态管理
- 💬 **评论互动**: 活动评论、点赞功能
- 📊 **数据统计**: 用户活动统计、系统数据分析
- 🔐 **权限控制**: 基于角色的访问控制（RBAC）
- 📱 **响应式设计**: 支持桌面端和移动端访问

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.0+ LTS
- **npm**: 10.0+
- **Git**: 2.40+
- **操作系统**: Windows 10+, macOS 12+, Ubuntu 20.04+

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd sports-activity-system
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装前后端依赖
npm run install:all
```

3. **环境配置**
```bash
# 复制环境变量文件到后端目录
cp .env.example backend/.env

# 编辑后端环境变量（可选，默认配置已可用）
# 主要配置：数据库路径、JWT密钥、端口等
```

4. **数据库初始化**
```bash
# 生成 Prisma 客户端
cd backend && npm run db:generate

# 推送数据库架构（SQLite 自动创建）
npm run db:push

# 可选：填充测试数据
npm run db:seed
```

5. **启动开发服务器**
```bash
# 方式一：同时启动前后端（推荐）
npm run dev

# 方式二：分别启动
# 启动后端服务 (端口 3000)
npm run dev:backend

# 启动前端服务 (端口 5173)
npm run dev:frontend
```

6. **访问应用**
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3000
- 数据库管理: `npm run db:studio`

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

## 📁 项目结构

```
sports-activity-system/
├── frontend/                    # React + TypeScript 前端应用
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   ├── pages/             # 页面组件
│   │   ├── stores/            # Zustand 状态管理
│   │   ├── hooks/             # 自定义 React Hooks
│   │   ├── config/            # 配置文件
│   │   └── assets/            # 静态资源
│   ├── public/                # 公共静态文件
│   ├── package.json           # 前端依赖配置
│   └── vite.config.ts         # Vite 构建配置
├── backend/                     # Node.js + Express 后端 API
│   ├── src/
│   │   ├── controllers/       # 控制器层
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件
│   │   ├── services/          # 业务逻辑层
│   │   ├── models/            # 数据模型
│   │   ├── config/            # 配置文件
│   │   ├── utils/             # 工具函数
│   │   └── types/             # TypeScript 类型定义
│   ├── prisma/
│   │   └── schema.prisma      # 数据库模式定义
│   ├── uploads/               # 文件上传目录
│   └── package.json           # 后端依赖配置
├── shared/                      # 前后端共享代码
├── docs/                        # 项目文档
├── infrastructure/              # 基础设施配置
├── tests/                       # 端到端测试
├── .github/                     # GitHub Actions CI/CD
├── .husky/                      # Git Hooks
├── docker-compose.yml           # Docker 容器编排
├── package.json                 # 根项目配置（Monorepo）
└── README.md                    # 项目说明文档
```

## 🛠️ 技术栈

### 前端技术
- **核心框架**: React 19.1+ with TypeScript 5.8+
- **构建工具**: Vite 7.0+ (快速开发和构建)
- **UI 组件库**: Ant Design 5.26+ (企业级UI设计语言)
- **状态管理**: Zustand 5.0+ (轻量级状态管理)
- **样式方案**: Tailwind CSS 3.4+ (原子化CSS框架)
- **路由管理**: React Router DOM 7.7+
- **HTTP 客户端**: Axios 1.11+ (API请求)
- **日期处理**: Day.js 1.11+ (轻量级日期库)
- **代码规范**: ESLint + Prettier + TypeScript

### 后端技术
- **运行时**: Node.js 20.0+ LTS
- **Web 框架**: Express.js 5.1+ (轻量级Web框架)
- **数据库**: SQLite 5.1+ with Prisma ORM 6.13+
- **认证授权**: JWT (jsonwebtoken 9.0+)
- **密码加密**: bcryptjs 3.0+
- **文件上传**: Multer 2.0+
- **数据验证**: Zod 4.0+ + express-validator 7.2+
- **安全防护**: Helmet 8.1+ + CORS 2.8+ + Rate Limiting
- **日志记录**: Morgan 1.10+
- **环境配置**: dotenv 17.2+

### 开发工具
- **包管理**: npm Workspaces (Monorepo 架构)
- **代码规范**: ESLint + Prettier + Husky
- **类型检查**: TypeScript 严格模式
- **Git Hooks**: Husky + lint-staged
- **容器化**: Docker + Docker Compose (可选)
- **API 测试**: 内置测试脚本

### 数据库设计
- **主数据库**: SQLite (开发环境，易于部署)
- **ORM**: Prisma (类型安全的数据库访问)
- **数据迁移**: Prisma Migrate
- **数据管理**: Prisma Studio (可视化数据库管理)

## 📋 需求分析

### 业务需求
本系统主要服务于体育场馆、学校、社区等需要组织体育活动的机构，解决以下核心问题：

1. **活动组织难题**: 传统的活动组织方式效率低下，信息传达不及时
2. **报名管理复杂**: 人工统计报名信息容易出错，缺乏实时性
3. **用户体验不佳**: 缺乏统一的平台进行活动浏览和报名
4. **数据分析缺失**: 无法有效分析活动数据，优化活动策划

### 用户角色
- **管理员**: 系统管理、用户管理、活动审核
- **活动组织者**: 创建和管理自己的活动
- **普通用户**: 浏览活动、报名参与、评论互动

### 功能需求
- **用户管理**: 注册、登录、个人资料、权限控制
- **活动管理**: CRUD操作、状态管理、图片上传
- **报名系统**: 报名/取消、状态跟踪、人数限制
- **互动功能**: 评论、点赞、活动分享
- **数据统计**: 用户活动数据、系统使用情况

## 📋 功能特性

### ✅ 已实现功能

#### 用户系统
- 🔐 用户注册、登录、登出
- 👤 个人资料管理（头像上传、信息编辑）
- 🛡️ 基于JWT的身份认证
- 👥 多角色权限控制（管理员/普通用户）
- 📊 个人活动统计（参与数量、创建数量等）

#### 活动管理
- 📝 活动创建、编辑、删除（支持富文本描述）
- 🖼️ 活动封面图片上传和管理
- 📅 活动时间、地点、人数限制设置
- 🔍 活动列表浏览、搜索、筛选
- 📖 活动详情页面展示
- 🏷️ 活动状态管理（进行中、已结束等）

#### 报名系统
- ✅ 活动报名、取消报名
- 👥 报名人数实时统计
- 📋 报名状态跟踪
- 🚫 人数限制控制
- 📊 报名用户列表管理

#### 互动功能
- 💬 活动评论系统
- 👍 评论点赞功能
- 🕒 评论时间排序
- 👤 评论用户信息展示

#### 数据统计
- 📈 用户活动参与统计
- 📊 系统整体数据概览
- 🎯 个人活动创建统计

### 🚧 技术特性
- 📱 响应式设计，支持移动端访问
- ⚡ 基于Vite的快速开发和构建
- 🔒 完善的安全防护（CORS、Helmet、Rate Limiting）
- 📝 TypeScript全栈类型安全
- 🎨 现代化UI设计（Ant Design + Tailwind CSS）
- 🗃️ 轻量级SQLite数据库，易于部署
- 🔄 实时数据更新和状态同步

## 🧪 测试与调试

### 开发调试
```bash
# 查看数据库内容
npm run db:studio

# 重置数据库
npm run db:reset

# 查看后端日志
# 后端服务会输出详细的请求日志和错误信息

# 前端开发工具
# 浏览器开发者工具 + React DevTools
```

### 代码质量
```bash
# 代码格式检查
npm run format:check

# 自动格式化代码
npm run format

# ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# TypeScript 类型检查
npm run type-check
```

### 测试功能
- 🔍 **API测试**: 使用内置的测试脚本验证后端API
- 🖥️ **前端测试**: 浏览器中直接测试用户界面
- 📊 **数据库测试**: 使用Prisma Studio查看和管理数据

## 📚 项目文档

### 核心文档
- **README.md**: 项目总体介绍和快速开始指南
- **PORT_CONFIG_LOCK.md**: 端口配置说明文档
- **backend/prisma/schema.prisma**: 数据库模式定义
- **frontend/README.md**: 前端项目详细说明

### 配置文件
- **.env.example**: 环境变量配置模板
- **docker-compose.yml**: Docker容器编排配置
- **package.json**: 项目依赖和脚本配置
- **tsconfig.json**: TypeScript编译配置

### 开发规范
- **ESLint配置**: 代码质量检查规则
- **Prettier配置**: 代码格式化规则
- **Husky配置**: Git提交钩子设置

## 🚀 部署说明

### 生产环境部署

1. **环境准备**
```bash
# 确保服务器已安装 Node.js 20+
node --version
npm --version
```

2. **项目部署**
```bash
# 克隆项目
git clone <repository-url>
cd sports-activity-system

# 安装依赖
npm run install:all

# 构建项目
npm run build

# 配置环境变量
cp .env.example backend/.env
# 编辑 backend/.env 文件，设置生产环境配置

# 初始化数据库
cd backend
npm run db:generate
npm run db:push

# 启动服务
npm run start
```

3. **Docker 部署（推荐）**
```bash
# 使用 Docker Compose 一键部署
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🤝 开发贡献

### 贡献流程
1. Fork 本项目到你的 GitHub 账户
2. 创建功能分支 (`git checkout -b feature/新功能名称`)
3. 提交你的更改 (`git commit -m '添加某某功能'`)
4. 推送到分支 (`git push origin feature/新功能名称`)
5. 创建 Pull Request

### 开发规范
- 遵循现有的代码风格和命名规范
- 提交前运行 `npm run lint` 和 `npm run format`
- 确保 TypeScript 类型检查通过
- 为新功能添加适当的注释和文档

### 问题反馈
- 🐛 **Bug 报告**: 请详细描述问题复现步骤
- 💡 **功能建议**: 欢迎提出改进建议
- ❓ **使用问题**: 查看文档或提交 Issue

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目为本系统提供的技术支持：
- [React](https://reactjs.org/) - 用户界面构建库
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [Express.js](https://expressjs.com/) - Web应用框架
- [Prisma](https://www.prisma.io/) - 现代数据库工具包
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

⭐ **如果这个项目对你有帮助，请给我们一个 Star！**

📧 **问题反馈**: 如有任何问题或建议，欢迎提交 Issue 或 Pull Request