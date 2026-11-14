/** Сезон EiBi: bXX — зима (с конца октября), aXX — лето (с конца марта). Следующий сезон: a27. */
export const EIBI_SEASON = 'b26'

export const FREQ_URL = `/eibi/freq-${EIBI_SEASON}.txt`
/** В README.TXT лежит таблица передатчиков с координатами. */
export const README_URL = '/eibi/README.TXT'

/** Как часто пересчитывать «в эфире / не в эфире». */
export const TICK_MS = 30_000