// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  nitro: {
    preset: 'static'
  },
  runtimeConfig: {
    // 仅服务器端可用的私有配置
    apiSecret: process.env.API_SECRET,

    // 客户端也能访问的公共配置
    public: {
      landingPageId: process.env.LANDING_PAGE_ID || 'default-landing-page',
      appVersion: process.env.npm_package_version || '1.0.0'
    }
  }
})
