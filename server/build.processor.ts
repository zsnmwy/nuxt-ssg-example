import { $ } from 'zx'
import { config } from './config.js'

export async function handleBuild(task: { taskId: string; landingPageId: string }) {
  const { taskId, landingPageId } = task

  console.log(`[${taskId}] Starting build for landing page:`, landingPageId)

  try {
    // 使用 zx 的 env 参数传递环境变量
    const $$ = $({
      env: {
        ...process.env,
        LANDING_PAGE_ID: landingPageId,
        BaseURL: `/landing-page/${landingPageId}`
      },
      cwd: config.projectPath
    })

    await $$`npx nuxt generate`

    console.log(`[${taskId}] Build completed successfully`)
    return { success: true, outputPath: '.output/public' }
  } catch (error) {
    console.error(`[${taskId}] Build failed:`, error)
    throw error
  }
}
