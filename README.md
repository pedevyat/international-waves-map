# international-waves-map

Интерактивная карта коротковолновых передатчиков по расписанию [EiBi](http://www.eibispace.de/dx/).

**Сайт:** https://pedevyat.github.io/international-waves-map/

На карте — площадки передатчиков. Цвет точки показывает, вещает ли площадка прямо сейчас (по UTC):

- 🟢 зелёная с ореолом — в эфире есть хотя бы одна передача;
- 🟡 жёлтая — сейчас все передачи молчат;
- пунктирный контур — точное место площадки неизвестно, точка стоит в центре известных передатчиков страны.

Клик по точке открывает расписание: частота (кГц), время UTC, дни недели, станция, язык и направление вещания. Время пересчитывается каждые 30 секунд.

## Данные

Источник — сезонный список частот EiBi (Eike Bierwirth), который автор разрешает свободно копировать и распространять.

| Файл | Что внутри |
| --- | --- |
| `freq-<сезон>.txt` | Расписание: частота, время UTC, дни, ITU-код, станция, язык, цель, код площадки |
| `README.TXT` | Координаты площадок и расшифровка кодов |

- Текущий сезон задаётся одной константой `EIBI_SEASON` в [`int-waves-app/src/config.ts`](int-waves-app/src/config.ts): `bXX` — зима (с конца октября), `aXX` — лето (с конца марта).
- Файлы не хранятся в репозитории: `scripts/fetch-eibi.mjs` скачивает их при сборке в `int-waves-app/public/eibi/` (каталог в `.gitignore`).
- GitHub Actions обновляет данные раз в неделю, по понедельникам в 05:00 UTC.

## Как это работает

1. При сборке `fetch-eibi.mjs` читает сезон из `config.ts` и скачивает `freq-*.txt` и `README.TXT` с `eibispace.de`.
2. В браузере `useEibiData` загружает оба файла и определяет кодировку: пробует UTF-8, при ошибке — windows-1252.
3. `parseSchedule` разбирает файл по фиксированным колонкам, `parseDays` — правила дней (`Mo-Fr`, `1.Sa`, `Last7`, `15Sep`, `irr`/`alt` и т.п.).
4. `parseSites` вытаскивает координаты площадок из `README.TXT` (формат `34N32-69E20`).
5. `resolveSite` привязывает передачу к площадке по коду из поля Remarks, в том числе к передатчику в другой стране (`/CYP`, `/BLR-mo`). Если площадка не указана — берётся центр площадок страны (приблизительная точка).
6. `buildGroups` объединяет передачи, стоящие в одной точке.
7. `isOnAir` проверяет время и день недели по UTC, включая передачи через полночь; `useNow` обновляет состояние раз в 30 секунд.
8. `EibiMap` рисует Leaflet-карту: слой ореолов и слой точек на canvas (`preferCanvas`).

## Стек

- React 19 + TypeScript
- Vite 8
- Leaflet 1.9 + react-leaflet 5
- oxlint
- GitHub Pages для хостинга

## Локальный запуск

Нужен Node.js 22 (та же версия используется в CI).

```bash
cd int-waves-app
npm ci
npm run dev
```

В dev-режиме запросы к `/eibi/*` проксируются на `http://www.eibispace.de/dx/*` — сайт EiBi отдаёт файлы по HTTP и без CORS-заголовков (см. `vite.config.ts`).

Если данных нет или нужен офлайн-режим:

```bash
npm run fetch:eibi
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Дев-сервер Vite с прокси на eibispace.de |
| `npm run build` | Проверка типов (`tsc -b`) и сборка в `dist/` |
| `npm run preview` | Просмотр собранной версии (тоже с прокси) |
| `npm run lint` | oxlint |
| `npm run fetch:eibi` | Скачать файлы текущего сезона в `public/eibi/` |

## Сборка и BASE_PATH

На GitHub Pages проект живёт в подкаталоге `/international-waves-map/`, поэтому путь задаётся переменной окружения `BASE_PATH`:

```powershell
cd int-waves-app
$env:BASE_PATH = "/international-waves-map/"
npm run build
```

```bash
# то же в bash
BASE_PATH=/international-waves-map/ npm run build
```

Без переменной используется `/` (dev и корень домена).

## Деплой

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) запускается:

- при push в `main`;
- по расписанию — каждый понедельник в 05:00 UTC (заодно подтягиваются свежие файлы EiBi);
- вручную через `workflow_dispatch`.

Он ставит зависимости, скачивает данные, собирает проект, определяет `BASE_PATH` по имени репозитория и публикует `int-waves-app/dist` на GitHub Pages.

## Структура проекта

```
.
├── .github/workflows/deploy.yml   # сборка и публикация на GitHub Pages
└── int-waves-app/
    ├── index.html                 # точка входа
    ├── public/                    # favicon и прочие статические файлы
    ├── scripts/fetch-eibi.mjs     # скачивание данных EiBi при сборке
    └── src/
        ├── App.tsx                # карта + панель со сводкой
        ├── config.ts              # сезон EiBi, URL данных, период обновления
        ├── components/            # карта и попап передатчика
        ├── hooks/                 # загрузка данных, текущее время
        └── lib/                   # парсеры, привязка к площадкам, «в эфире»
```

## Ограничения

- Часть передач не удаётся привязать к координатам (в сезоне b26 — 119 из 8385): они не отображаются на карте.
- Точки с приблизительным положением по умолчанию скрыты — включаются галочкой в панели.
- При смене сезона нужно обновить `EIBI_SEASON` в `src/config.ts`, иначе сборка будет искать несуществующий файл.
- Плитки карты — OpenStreetMap; при публичном использовании действует [политика использования тайлов OSM](https://operations.osmfoundation.org/policies/tiles/).

## Атрибуция

- Расписание и координаты — EiBi Shortwave Frequency List, Eike Bierwirth ([eibispace.de](http://www.eibispace.de/dx/)).
- Карта — © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
