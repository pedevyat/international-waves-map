/** Сезон EiBi: bXX — зима (с конца октября), aXX — лето (с конца марта). Следующий сезон: a27. */
export const EIBI_SEASON = 'b26'

// BASE_URL: '/' в dev, '/<репозиторий>/' на GitHub Pages.
// В dev запросы уходят на прокси из vite.config.ts, в продакшене — на файлы, скачанные при сборке.
const DATA_URL = `${import.meta.env.BASE_URL}eibi/`

export const FREQ_URL = `${DATA_URL}freq-${EIBI_SEASON}.txt`
/** В README.TXT лежит таблица передатчиков с координатами. */
export const README_URL = `${DATA_URL}README.TXT`

/** Как часто пересчитывать «в эфире / не в эфире». */
export const TICK_MS = 30_000