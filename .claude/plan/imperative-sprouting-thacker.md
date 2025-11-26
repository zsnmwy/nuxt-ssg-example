# Express 构建服务器实施计划（Fastq 方案）

## 项目目标
创建一个 Express 服务器，接收包含 LANDING_PAGE_ID 的 POST 请求，使用 Fastq 队列管理构建任务，并通过 zx 执行 Nuxt SSG 构建。

## 架构设计（Fastq 无 Redis 方案）

### 系统组件
1. **Express API Server**: 接收构建请求，返回任务 ID
2. **Fastq 内存队列**: 管理构建任务，确保串行执行（concurrency: 1）
3. **Queue Worker**: 处理队列任务，使用 zx 执行构建命令

### 技术栈
- Express.js: Web 框架
- **Fastq**: 内存队列（无需 Redis）
- zx: JavaScript shell 脚本执行

## 详细实施步骤

### 步骤 1: 安装依赖

```bash
pnpm add express fastq zx
pnpm add -D @types/node @types/express typescript tsx
```

### 步骤 2: 创建 Express 服务器

**文件**: `server/index.ts`
- 创建 Express 应用
- POST /api/build 端点
- 使用 Fastq 队列管理构建任务
- 返回任务 ID 和状态

**关键代码**:
```typescript
import fastq from 'fastq'

// 创建队列（concurrency: 1 确保串行执行）
const queue = fastq.promise(handleBuild, 1)

// POST /api/build
app.post('/api/build', (req, res) => {
  const { landingPageId } = req.body
  const taskId = generateTaskId()

  // 添加到队列
  queue.push({ taskId, landingPageId })

  res.json({
    taskId,
    status: 'queued',
    message: 'Build request received and queued'
  })
})
```

### 步骤 3: 实现构建处理器

**文件**: `server/build.processor.ts`
- Worker 处理函数
- 使用 zx 执行 nuxt generate
- 环境变量传递（通过 zx 参数）
- 错误处理和日志

**关键代码**:
```typescript
import { $ } from 'zx'

export async function handleBuild(task: { taskId: string; landingPageId: string }) {
  const { taskId, landingPageId } = task

  console.log(`[${taskId}] Starting build for landing page:`, landingPageId)

  try {
    // 使用 zx 的 env 参数传递环境变量
    await $({
      env: {
        LANDING_PAGE_ID: landingPageId,
        BaseURL: `/landing-page/${landingPageId}`
      },
      cwd: config.projectPath
    })`npx nuxt generate`

    console.log(`[${taskId}] Build completed successfully`)
    return { success: true, outputPath: '.output/public' }
  } catch (error) {
    console.error(`[${taskId}] Build failed:`, error)
    throw error
  }
}
```

### 步骤 4: 环境变量和配置

**文件**: `server/config.ts`
- 项目路径配置
- 构建超时设置

```typescript
export const config = {
  projectPath: process.env.PROJECT_PATH || process.cwd(),
  port: process.env.PORT || 3000,
  buildTimeout: 10 * 60 * 1000 // 10 分钟
}
```

### 步骤 5: 完整 Express 服务器代码

**文件**: `server/index.ts`

```typescript
import express from 'express'
import fastq from 'fastq'
import { randomUUID } from 'crypto'
import { handleBuild } from './build.processor.js'
import { config } from './config.js'

const app = express()
app.use(express.json())

// 创建 Fastq 队列（concurrency: 1 确保串行）
const queue = fastq.promise(handleBuild, 1)

// POST /api/build - 接收构建请求
app.post('/api/build', (req, res) => {
  const { landingPageId } = req.body

  if (!landingPageId) {
    return res.status(400).json({ error: 'landingPageId is required' })
  }

  const taskId = randomUUID()

  // 添加到队列
  queue.push({ taskId, landingPageId })

  res.status(200).json({
    taskId,
    status: 'queued',
    message: 'Build request received and will be processed in queue'
  })
})

// GET /health - 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    queueLength: queue.length()
  })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(config.port, () => {
  console.log(`Build server running on http://localhost:${config.port}`)
})
```

### 步骤 6: 启动脚本

**文件**: `package.json`（添加 scripts）
```json
{
  "scripts": {
    "server": "tsx server/index.ts",
    "build-server": "tsx server/index.ts"
  }
}
```

---

## 关键实现细节

### 1. 串行处理
Fastq 的 `concurrency: 1` 确保一次只处理一个构建任务，后续任务排队等待。

### 2. 环境变量传递
在 Worker 处理函数中使用 zx 的 env 参数:
```typescript
await $({
  env: {
    LANDING_PAGE_ID: landingPageId,
    BaseURL: `/landing-page/${landingPageId}`
  },
  cwd: config.projectPath
})`npx nuxt generate`
```
这确保构建进程能访问正确的环境变量。

### 3. zx 的使用
zx 允许在 JavaScript 中方便地执行 shell 命令:
```typescript
import { $ } from 'zx'

// 直接执行命令
await $`cd /path/to/project && npx nuxt generate`

// 环境变量已自动传递
```

### 4. 错误处理
- Fastq 捕获构建错误
- 日志记录到控制台
- 任务失败不会影响队列继续处理

---

## 文件结构
```
server/
├── index.ts          # Express API server + Fastq queue
├── build.processor.ts # Build task processor using zx
└── config.ts         # Configuration
```

## 部署说明

### 前置条件
- Node.js 18+ 环境
- 项目源码已部署

### 运行步骤
1. 安装依赖: `pnpm install`
2. 启动服务: `pnpm server`

---

## API 使用示例

### 触发构建
```bash
curl -X POST http://localhost:3000/api/build \
  -H "Content-Type: application/json" \
  -d '{"landingPageId": "prod-page-123"}'
```

**响应**:
```json
{
  "taskId": "uuid-123",
  "status": "queued",
  "message": "Build request received and queued"
}
```

### 健康检查
```bash
curl http://localhost:3000/health
```

**响应**:
```json
{
  "status": "healthy",
  "queueLength": 2
}
```

---

## 测试计划
1. 测试 API 接收请求并返回 200
2. 测试任务进入队列但串行执行
3. 测试环境变量传递到构建过程
4. 测试构建成功和失败场景
5. 测试队列积压时的行为

---

## 注意事项
1. **内存队列**: 服务器重启会丢失所有排队任务
2. **构建目录**: 确保项目路径正确配置
3. **权限**: 确保运行用户有写入 .output 目录的权限
4. **日志**: 建议添加日志记录到文件便于调试
5. **并发控制**: concurrency: 1 确保不并行执行构建
6. **超时**: 为长时间构建设置超时时间
