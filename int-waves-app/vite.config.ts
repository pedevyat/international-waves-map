import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Только для `npm run dev`: eibispace.de отдаёт файлы по http и без CORS-заголовков,
// поэтому /eibi/* проксируется на http://www.eibispace.de/dx/*.
// В продакшене (GitHub Pages) файлы скачиваются при сборке в public/eibi, см. scripts/fetch-eibi.mjs.
const eibiProxy = {
  '/eibi': {
    target: 'http://www.eibispace.de',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/eibi/, '/dx'),
  },
}

export default defineConfig({
  plugins: [react()],
  // На Pages сайт живёт в подкаталоге /<имя-репозитория>/, его задаёт workflow через BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  server: { proxy: eibiProxy },
  preview: { proxy: eibiProxy },
})