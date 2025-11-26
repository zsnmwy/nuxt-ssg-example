import express from 'express'
import fastq from 'fastq'
import { randomUUID } from 'crypto'
import { handleBuild } from './build.processor.js'
import { config } from './config.js'

console.log('Starting build server...')
console.log('Using port:', config.port)
console.log('Project path:', config.projectPath)

const app = express()
app.use(express.json())

// 创建 Fastq 队列（concurrency: 1 确保串行执行）
console.log('Creating task queue...')
const queue: fastq.queueAsPromised<{ taskId: string; landingPageId: string }, { success: boolean; outputPath: string }> = fastq.promise(handleBuild, 1)
console.log('Queue created, current length:', queue.length())

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 启动服务器并捕获错误
console.log('Attempting to start server on port:', config.port)
const server = app.listen(config.port, () => {
  console.log(`Build server running on http://localhost:${config.port}`)
  console.log('Press Ctrl+C to stop')
}).on('error', (err: Error) => {
  console.error('Server failed to start:', err.message)
  console.error('Error code:', (err as any).code)
  process.exit(1)
})

// 防止进程意外退出
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Rejection:', err?.message || err)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.close(() => {
    console.log('Server stopped')
    process.exit(0)
  })
})
