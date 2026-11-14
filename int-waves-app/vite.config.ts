import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// eibispace.de отдаёт файлы по http и без CORS-заголовков,
// поэтому в браузере ходим через прокси: /eibi/* -> http://www.eibispace.de/dx/*
const eibiProxy = {
  '/eibi': {
    target: 'http://www.eibispace.de',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/eibi/, '/dx'),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: eibiProxy },
  preview: { proxy: eibiProxy },
})