import { useDeferredValue, useMemo, useState } from 'react'
import './App.css'
import { EibiMap } from './components/EibiMap'
import { FrequencyFilter } from './components/FrequencyFilter'
import { UnlocatedPanel } from './components/UnlocatedPanel'
import { EIBI_SEASON } from './config'
import { useEibiData } from './hooks/useEibiData'
import { useNow } from './hooks/useNow'
import { inFreqRange, parseFreqRange } from './lib/freqRange'
import { isOnAir } from './lib/onAir'
import type { Broadcast, SiteGroup } from './types'

const NO_GROUPS: SiteGroup[] = []
const NO_BROADCASTS: Broadcast[] = []

export default function App() {
  const state = useEibiData()
  const now = useNow()

  // на узких экранах панель по умолчанию свёрнута, чтобы не закрывать карту
  const [hudOpen, setHudOpen] = useState(() => !window.matchMedia('(max-width: 640px)').matches)
  const [unlocatedOpen, setUnlocatedOpen] = useState(false)
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')

  const range = useMemo(() => parseFreqRange(fromText, toText), [fromText, toText])
  // пока человек печатает, карта перерисовывается с небольшим запаздыванием
  const appliedRange = useDeferredValue(range)

  const allGroups = state.status === 'ready' ? state.data.groups : NO_GROUPS

  // оставляем только передачи из выбранного диапазона частот
  const rangeGroups = useMemo(() => {
    if (!appliedRange.active) return allGroups
    const result: SiteGroup[] = []
    for (const g of allGroups) {
      const broadcasts = g.broadcasts.filter((b) => inFreqRange(b.freqKhz, appliedRange))
      if (broadcasts.length > 0) result.push({ ...g, broadcasts })
    }
    return result
  }, [allGroups, appliedRange])

  // передачи без координат тоже подчиняются фильтру по частоте
  const unlocated = useMemo(() => {
    if (state.status !== 'ready') return NO_BROADCASTS
    const list = state.data.unresolvedList
    return appliedRange.active ? list.filter((b) => inFreqRange(b.freqKhz, appliedRange)) : list
  }, [state, appliedRange])

  const approxCount = useMemo(() => rangeGroups.filter((g) => g.approximate).length, [rangeGroups])

  const groups = rangeGroups

  const onAir = useMemo(
    () => groups.map((g) => g.broadcasts.some((b) => isOnAir(b, now))),
    [groups, now],
  )
  const greenCount = onAir.reduce((n, v) => n + (v ? 1 : 0), 0)
  const visibleBroadcasts = useMemo(
    () => groups.reduce((n, g) => n + g.broadcasts.length, 0),
    [groups],
  )

  return (
    <div className="app">
      <EibiMap groups={groups} onAir={onAir} now={now} />

      <FrequencyFilter
        from={fromText}
        to={toText}
        range={range}
        onFromChange={setFromText}
        onToChange={setToText}
        onReset={() => {
          setFromText('')
          setToText('')
        }}
      />

      {unlocatedOpen && (
        <UnlocatedPanel broadcasts={unlocated} now={now} onClose={() => setUnlocatedOpen(false)} />
      )}

      {hudOpen ? (
        <aside className="panel hud">
          <div className="hud-head">
            <h1 className="hud-title">Передатчики EiBi {EIBI_SEASON.toUpperCase()}</h1>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setHudOpen(false)}
              aria-label="Скрыть панель"
              title="Скрыть панель"
            >
              ×
            </button>
          </div>
          <p className="hud-time">Сейчас {now.toISOString().slice(11, 16)} UTC</p>

          {state.status === 'loading' && <p className="hud-text">Загружаю расписание…</p>}
          {state.status === 'error' && <p className="hud-error">{state.message}</p>}

          {state.status === 'ready' && (
            <>
              <ul className="legend">
                <li>
                  <span className="swatch on" />
                  В эфире: {greenCount}
                </li>
                <li>
                  <span className="swatch idle" />
                  Молчат: {groups.length - greenCount}
                </li>
              </ul>

              <p className="hud-text">
                Передач на карте: {visibleBroadcasts}/{state.data.total}.
              </p>

              <button
                type="button"
                className="btn"
                onClick={() => setUnlocatedOpen(true)}
                disabled={unlocated.length === 0}
              >
                Передачи без координат ({unlocated.length})
              </button>

              {approxCount > 0 && (
                <p className="hud-text">
                  Точек с приблизительным положением: {approxCount}.
                </p>
              )}
            </>
          )}
        </aside>
      ) : (
        <button type="button" className="panel hud-reopen" onClick={() => setHudOpen(true)}>
          Информация
        </button>
      )}
    </div>
  )
}