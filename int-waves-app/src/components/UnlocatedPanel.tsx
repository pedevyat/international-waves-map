import { useEffect, useMemo, useState } from 'react'
import { isOnAir } from '../lib/onAir'
import type { Broadcast } from '../types'

const PAGE_SIZE = 500

interface Props {
  broadcasts: Broadcast[]
  now: Date
  onClose: () => void
}

/** Окно со списком передач, для которых не удалось определить координаты передатчика. */
export function UnlocatedPanel({ broadcasts, now, onClose }: Props) {
  const [onlyOnAir, setOnlyOnAir] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = useMemo(() => {
    const list = broadcasts.map((b) => ({ b, on: isOnAir(b, now) }))
    list.sort(
      (x, y) => Number(y.on) - Number(x.on) || x.b.freqKhz - y.b.freqKhz || x.b.start - y.b.start,
    )
    return list
  }, [broadcasts, now])

  const onAirCount = rows.reduce((n, r) => n + (r.on ? 1 : 0), 0)
  const shown = onlyOnAir ? rows.filter((r) => r.on) : rows
  const visible = shown.slice(0, limit)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label="Передачи без координат"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-head">
          <h2 className="hud-title">Передачи без координат</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть">
            ×
          </button>
        </div>

        <div className="sp">
          <p className="sp-sub">
            Всего: {rows.length}, сейчас в эфире: {onAirCount}. Для этих передач в списке EiBi не указан
            передатчик, либо его кода нет в таблице координат.
          </p>

          <label className="sp-filter">
            <input
              type="checkbox"
              checked={onlyOnAir}
              onChange={(e) => {
                setOnlyOnAir(e.target.checked)
                setLimit(PAGE_SIZE)
              }}
            />
            Только те, что сейчас в эфире
          </label>

          {shown.length === 0 ? (
            <p className="sp-empty">Нет подходящих передач.</p>
          ) : (
            <div className="sp-scroll tall">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th aria-label="Статус" />
                    <th>кГц</th>
                    <th>UTC</th>
                    <th>Дни</th>
                    <th>Станция</th>
                    <th>Страна</th>
                    <th>Язык</th>
                    <th>Цель</th>
                    <th>Код передатчика</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(({ b, on }) => (
                    <tr key={b.id} className={on ? 'on' : undefined}>
                      <td>
                        <span
                          className={on ? 'sp-dot on' : 'sp-dot'}
                          role="img"
                          aria-label={on ? 'В эфире' : 'Не в эфире'}
                          title={on ? 'В эфире' : 'Не в эфире'}
                        />
                      </td>
                      <td className="num">{b.freq}</td>
                      <td className="num">{b.timeLabel}</td>
                      <td>{b.daysLabel}</td>
                      <td>{b.station}</td>
                      <td>{b.itu}</td>
                      <td>{b.lang}</td>
                      <td>{b.target}</td>
                      <td>{b.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {shown.length > visible.length && (
            <button type="button" className="btn" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              Показать ещё ({shown.length - visible.length})
            </button>
          )}
        </div>
      </section>
    </div>
  )
}