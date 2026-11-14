import { useMemo, useState } from 'react'
import './App.css'
import { EibiMap } from './components/EibiMap'
import { EIBI_SEASON } from './config'
import { useEibiData } from './hooks/useEibiData'
import { useNow } from './hooks/useNow'
import { isOnAir } from './lib/onAir'
import type { SiteGroup } from './types'

const NO_GROUPS: SiteGroup[] = []

export default function App() {
  const state = useEibiData()
  const now = useNow()
  const [showApprox, setShowApprox] = useState(false)

  const allGroups = state.status === 'ready' ? state.data.groups : NO_GROUPS

  const groups = useMemo(
    () => (showApprox ? allGroups : allGroups.filter((g) => !g.approximate)),
    [allGroups, showApprox],
  )
  const approxCount = useMemo(() => allGroups.filter((g) => g.approximate).length, [allGroups])

  const onAir = useMemo(
    () => groups.map((g) => g.broadcasts.some((b) => isOnAir(b, now))),
    [groups, now],
  )
  const greenCount = onAir.reduce((n, v) => n + (v ? 1 : 0), 0)

  return (
    <div className="app">
      <EibiMap groups={groups} onAir={onAir} now={now} />

      <aside className="hud">
        <h1 className="hud-title">Передатчики EiBi {EIBI_SEASON.toUpperCase()}</h1>
        <p className="hud-time">Сейчас {now.toISOString().slice(11, 16)} UTC</p>

        {state.status === 'loading' && <p className="hud-text">Загружаю расписание…</p>}
        {state.status === 'error' && <p className="hud-error">{state.message}</p>}

        {state.status === 'ready' && (
          <>
            <ul className="legend">
              <li>
                <span className="swatch on" />
                В эфире сейчас: {greenCount}
              </li>
              <li>
                <span className="swatch idle" />
                Сейчас молчат: {groups.length - greenCount}
              </li>
            </ul>

            <p className="hud-text">
              Передач в файле: {state.data.total}. Не удалось определить передатчик у{' '}
              {state.data.unresolved}.
            </p>

            {approxCount > 0 && (
              <label className="hud-check">
                <input
                  type="checkbox"
                  checked={showApprox}
                  onChange={(e) => setShowApprox(e.target.checked)}
                />
                <span>
                  Показать точки с приблизительным положением ({approxCount}). У них в списке не указана
                  площадка, пунктирный контур.
                </span>
              </label>
            )}
          </>
        )}
      </aside>
    </div>
  )
}