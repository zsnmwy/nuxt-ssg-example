<template>
  <div>
    <NuxtRouteAnnouncer />
    <div style="padding: 2rem;">
      <h1>环境变量演示</h1>
      <div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
        <h3>从环境变量读取的 LANDING_PAGE_ID:</h3>
        <p style="font-size: 1.2rem; color: #3b82f6; font-weight: bold;">
          {{ landingPageId }}
        </p>
      </div>
      <div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
        <h3>应用版本:</h3>
        <p style="font-size: 1.2rem; color: #10b981; font-weight: bold;">
          {{ appVersion }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 使用 useRuntimeConfig 读取环境变量
const config = useRuntimeConfig()

// 访问公共运行时配置（将暴露到客户端）
const landingPageId = config.public.landingPageId
const appVersion = config.public.appVersion

// 在控制台输出（仅在构建时可见）
console.log('Landing Page ID:', landingPageId)
console.log('App Version:', appVersion)
</script>
