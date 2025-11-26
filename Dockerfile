# 使用 Node.js 20 作为基础镜像
FROM node:20-alpine

# 安装必要的工具（bash 等）
RUN apk add --no-cache bash

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动构建服务器
CMD ["pnpm", "tsx", "server/index.ts"]
