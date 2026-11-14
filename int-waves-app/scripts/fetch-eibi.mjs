// Скачивает файлы EiBi в public/eibi/ (их потом Vite кладёт в dist/eibi/).
// Сезон берётся из src/config.ts, чтобы он был указан в одном месте.
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const config = await readFile(new URL('../src/config.ts', import.meta.url), 'utf8')
const season = /EIBI_SEASON\s*=\s*'([^']+)'/.exec(config)?.[1]
if (!season) throw new Error('Не найден EIBI_SEASON в src/config.ts')

const SOURCE = 'http://www.eibispace.de/dx/'
const files = [`freq-${season}.txt`, 'README.TXT']

const outDir = new URL('../public/eibi/', import.meta.url)
await mkdir(outDir, { recursive: true })

for (const name of files) {
  const res = await fetch(SOURCE + name)
  if (!res.ok) throw new Error(`${SOURCE + name}: HTTP ${res.status}`)

  // сохраняем байты как есть, кодировку определит приложение
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 10_000) throw new Error(`${name}: файл подозрительно мал (${buf.length} байт)`)

  await writeFile(new URL(name, outDir), buf)
  console.log(`${name}: ${(buf.length / 1024).toFixed(0)} КБ`)
}
