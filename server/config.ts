export const config = {
  projectPath: process.env.PROJECT_PATH || process.cwd(),
  port: parseInt(process.env.PORT || '3000'),
  buildTimeout: 10 * 60 * 1000 // 10 分钟
}
