# PerfPulseAI 前端文档

欢迎来到 PerfPulseAI 前端技术文档。本文档提供完整的前端开发指南、架构说明和最佳实践。

## 📖 文档导航

### 🏗️ 核心概念
- [📋 前端概述](./README.md) - 项目概述和快速开始（本文档）
- [🏛️ 架构设计](./ARCHITECTURE.md) - 前端架构和设计原则

### 🛠️ 开发指南
- [🧩 组件库](./COMPONENTS.md) - 组件使用指南和开发规范
- [🔌 API 集成](./API.md) - API 调用和数据管理
- [🎨 样式指南](./STYLING.md) - 样式规范和主题系统

### 🚀 专项功能
- [🔔 通知与时区](./module/notify-time.md) - 通知功能与时区处理
- [🔐 权限管理](./PERMISSION_MANAGEMENT.md) - 权限控制机制

### ⚡ 优化与测试
- [📈 性能优化](./PERFORMANCE.md) - 性能优化策略和最佳实践

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- 现代浏览器支持

### 安装和运行
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 开发环境配置
```bash
# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_APP_NAME=PerfPulseAI
```

## 🛠️ 技术栈

### 核心框架
- **Next.js 14** - React 全栈框架，支持 App Router
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript 超集

### UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Shadcn/ui** - 基于 Radix UI 的组件库
- **Lucide React** - 图标库
- **Recharts** - 图表库

### 状态管理与数据获取
- **React Context** - 用户认证状态管理
- **SWR** - 数据获取和缓存
- **React Hooks** - 本地状态管理

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **PostCSS** - CSS 处理

## 📁 项目结构

```
frontend/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # 认证相关页面
│   ├── api/               # API 路由
│   ├── dashboard/         # 仪表板页面
│   ├── notifications/     # 通知页面
│   ├── org/              # 组织管理页面
│   └── layout.tsx        # 根布局
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   ├── forms/            # 表单组件
│   ├── layout/           # 布局组件
│   └── dashboard/        # 仪表板组件
├── hooks/                # 自定义 Hooks
│   ├── useAuth.ts        # 认证状态管理
│   ├── useNotifications.ts # 通知数据管理
│   └── usePoints.ts      # 积分数据管理
├── lib/                  # 工具函数和配置
│   ├── utils.ts          # 通用工具函数
│   ├── api.ts            # API 客户端
│   ├── auth.ts           # 认证工具
│   └── timezone-utils.ts # 时区处理工具
├── public/               # 静态资源
│   ├── favicon.ico       # 网站图标
│   └── images/           # 图片资源
├── styles/               # 样式文件
│   └── globals.css       # 全局样式
└── docs/                 # 技术文档
```

## 🎯 核心功能模块

### 1. 用户认证系统
- JWT 令牌认证
- RSA 加密登录
- 会话管理
- 权限控制

### 2. 仪表板系统
- 实时数据展示
- 图表可视化
- 性能指标监控
- 任务管理

### 3. 积分系统
- 积分获取和消费
- 等级系统
- 兑换记录
- 争议处理

### 4. 组织管理
- 公司管理
- 部门管理
- 成员管理
- 权限分配

### 5. 通知系统
- 实时通知推送
- 通知分类管理
- 已读/未读状态
- 通知中心界面
- 时区自动转换

## 📝 开发规范

### 代码风格
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件使用 PascalCase 命名
- 文件和目录使用 kebab-case 命名
- Hook 使用 camelCase 并以 'use' 开头

### 组件开发
```typescript
// 组件模板
import React, { memo } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export const Component = memo<ComponentProps>(({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  )
})

Component.displayName = 'Component'
```

### API 调用
```typescript
// 使用 SWR 进行数据获取
import useSWR from 'swr'
import { fetcher } from '@/lib/api'

function useData(id: string) {
  const { data, error, mutate } = useSWR(
    id ? `/api/data/${id}` : null,
    fetcher
  )

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

### 状态管理
- 使用 React Context 管理全局状态
- 使用 SWR 处理服务器状态
- 使用 useState 和 useReducer 管理本地状态

## 🔧 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题

# 类型检查
npm run type-check   # TypeScript 类型检查

# 测试
npm run test         # 运行测试
npm run test:watch   # 监听模式运行测试
npm run test:coverage # 生成测试覆盖率报告
```

## 📚 学习资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Shadcn/ui 文档](https://ui.shadcn.com)

### 项目特定资源
- [API 文档](./API.md) - 了解后端 API 接口
- [组件库](./COMPONENTS.md) - 学习项目组件使用
- [架构设计](./ARCHITECTURE.md) - 理解项目架构

## 🤝 贡献指南

### 开发流程
1. 从 main 分支创建功能分支
2. 进行开发并确保代码质量
3. 运行测试确保功能正常
4. 提交 Pull Request

### 代码提交
```bash
# 提交格式
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "docs: 更新文档"
git commit -m "style: 代码格式调整"
git commit -m "refactor: 代码重构"
```

### 文档更新
- 新功能需要更新相应文档
- API 变更需要更新 API 文档
- 组件变更需要更新组件文档

## 🆘 故障排除

### 常见问题
1. **端口占用**: 修改 `.env.local` 中的端口配置
2. **依赖问题**: 删除 `node_modules` 和 `package-lock.json` 重新安装
3. **类型错误**: 运行 `npm run type-check` 检查类型问题
4. **样式问题**: 检查 Tailwind CSS 配置和类名

### 获取帮助
- 查看相关文档章节
- 检查控制台错误信息
- 查看项目 Issue 和 PR
- 联系项目维护者

---

**最后更新**: 2025-08-08
**文档版本**: v1.0.0
