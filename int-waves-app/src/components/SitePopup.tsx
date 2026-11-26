import { useMemo, useState } from 'react'
import { languageLabel } from '../lib/languages'
import { targetLabel } from '../lib/targets'
import { countryLabel } from '../lib/countries'
import { isOnAir } from '../lib/onAir'
import type { SiteGroup } from '../types'

interface Props {
  group: SiteGroup
  now: Date
}

export function SitePopup({ group, now }: Props) {
  const [onlyOnAir, setOnlyOnAir] = useState(false)

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
    <div className="sp">
      <h2 className="sp-title">{group.names.join(' / ')}</h2>
      <p className="sp-sub">
        {countryLabel(group.country)}. Сейчас в эфире: {onAirCount} из {rows.length}
      </p>
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
                  <td title={b.lang || undefined}>{languageLabel(b.lang)}</td>
                  <td title={b.target || undefined}>{targetLabel(b.target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}