import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 주소: https://estarry0224.github.io/addiction-forum-schedule/
// 따라서 base는 '/addiction-forum-schedule/' 이어야 함
export default defineConfig({
  base: '/addiction-forum-schedule/',
  plugins: [react()],
})
