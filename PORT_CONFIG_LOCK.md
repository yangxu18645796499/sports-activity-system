# 端口配置锁定文件

**重要提示：此文件用于锁定项目端口配置，请勿修改！**

## 固定端口配置

### 前端端口
- **端口**: 5180
- **配置文件**: `frontend/vite.config.ts`
- **访问地址**: http://localhost:5180/

### 后端端口
- **端口**: 3000
- **配置文件**: `backend/.env` 和 `backend/src/index.ts`
- **API地址**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/health

## 配置文件位置

1. **前端端口配置**: `frontend/vite.config.ts`
   ```typescript
   server: {
     port: 5180,
     host: true
   }
   ```

2. **后端端口配置**: `backend/.env`
   ```
   PORT=3000
   CORS_ORIGIN="http://localhost:5180"
   ```

3. **后端CORS配置**: `backend/src/index.ts`
   ```typescript
   origin: process.env.CORS_ORIGIN || ['http://localhost:5180']
   ```

## 注意事项

- ⚠️ **禁止修改端口**: 这些端口已经过测试和优化，修改可能导致系统无法正常工作
- 🔒 **配置锁定**: 所有相关配置文件中的端口都已固定
- 🚫 **避免冲突**: 请确保这些端口不被其他应用占用

## 如果必须修改端口

如果因为特殊原因必须修改端口，请同时修改以下文件：
1. `frontend/vite.config.ts` - 前端端口
2. `frontend/src/config/api.ts` - API基础URL
3. `backend/.env` - 后端端口和CORS配置
4. `backend/src/index.ts` - CORS fallback配置
5. 更新此文档

---
**创建时间**: 2025-01-31
**最后更新**: 2025-01-31
**状态**: 🔒 已锁定