import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 本地开发使用工作区根目录的公开配置；独立部署时仍支持 VITE_* 变量。
  envDir: new URL('../', import.meta.url).pathname,
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  base: process.env.VITE_BASE_PATH || '/',
})
