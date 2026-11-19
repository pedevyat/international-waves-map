import { useEffect, useMemo, useState } from 'react'
import { isOnAir } from '../lib/onAir'
import type { SiteGroup } from '../types'

interface Props {
  group: SiteGroup
  now: Date
  onClose: () => void
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** Окно со списком частот выбранного передатчика: можно свернуть или закрыть (кнопка ×, клавиша Esc). */
export function SitePanel({ group, now, onClose }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [onlyOnAir, setOnlyOnAir] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = useMemo(() => {
    const list = group.broadcasts.map((b) => ({ b, on: isOnAir(b, now) }))
    // сначала те, что в эфире, затем по частоте и времени начала
    list.sort(
      (x, y) => Number(y.on) - Number(x.on) || x.b.freqKhz - y.b.freqKhz || x.b.start - y.b.start,
    )
    return list
  }, [group, now])

  const onAirCount = rows.reduce((n, r) => n + (r.on ? 1 : 0), 0)
  const shown = onlyOnAir ? rows.filter((r) => r.on) : rows

  return (
    <section className="sp" aria-label="Частоты передатчика">
      <header className="sp-head">
        <div className="sp-heading">
          <h2 className="sp-title">{group.names.join(' / ')}</h2>
          <p className="sp-sub">
            {group.country}. Сейчас в эфире: {onAirCount} из {rows.length}
          </p>
        </div>
        <button
          type="button"
          className="sp-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <Icon d={collapsed ? 'M2.5 9 7 4.5 11.5 9' : 'M2.5 5 7 9.5 11.5 5'} />
        </button>
        <button type="button" className="sp-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть (Esc)">
          <Icon d="M3 3 11 11M11 3 3 11" />
        </button>
      </header>

      {!collapsed && (
        <div className="sp-body">
          {group.approximate && (
            <p className="sp-note">
              Площадка передатчика в списке не указана, точка стоит в центре известных передатчиков страны.
            </p>
          )}

          <label className="sp-filter">
            <input type="checkbox" checked={onlyOnAir} onChange={(e) => setOnlyOnAir(e.target.checked)} />
            Только те, что сейчас в эфире
          </label>

          {shown.length === 0 ? (
            <p className="sp-empty">Сейчас на этой площадке ничего не вещает.</p>
          ) : (
            <div className="sp-scroll">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th aria-label="Статус" />
                    <th>кГц</th>
                    <th>UTC</th>
                    <th>Дни</th>
                    <th>Станция</th>
                    <th>Язык</th>
                    <th>Цель</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ b, on }) => (
                    <tr key={b.id} className={on ? 'on' : undefined}>
                      <td>
                        <span
                          className={on ? 'sp-dot on' : 'sp-dot'}
                          title={on ? 'В эфире' : 'Не в эфире'}
                          role="img"
                          aria-label={on ? 'В эфире' : 'Не в эфире'}
                        />
                      </td>
                      <td className="num">{b.freq}</td>
                      <td className="num">{b.timeLabel}</td>
                      <td>{b.daysLabel}</td>
                      <td>{b.station}</td>
                      <td>{b.lang}</td>
                      <td>{b.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}