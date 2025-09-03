// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/addiction-forum-schedule/',   // ← 저장소 이름과 100% 일치, 앞뒤 슬래시 포함
  plugins: [react()],
})
