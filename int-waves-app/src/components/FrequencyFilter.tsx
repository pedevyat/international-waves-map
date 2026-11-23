import type { FreqRange } from '../lib/freqRange'
import { MAX_KHZ } from '../lib/freqRange'

interface Props {
  from: string
  to: string
  range: FreqRange
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onReset: () => void
}

export function FrequencyFilter({ from, to, range, onFromChange, onToChange, onReset }: Props) {
  const invalid = range.fromInvalid || range.toInvalid

  let hint: string
  if (invalid) hint = 'Введите число, например 5950 или 9500.5'
  else if (range.active) hint = `Показаны частоты от ${range.min} до ${range.max} кГц`
  else hint = `Пустые поля — без ограничения: от 0 до ${MAX_KHZ} кГц`

  return (
    <section className="panel freq" aria-label="Диапазон частот">
      <h2 className="freq-title">Диапазон частот, кГц</h2>

      <div className="freq-row">
        <label className="freq-field">
          <span>от</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={from}
            aria-invalid={range.fromInvalid}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </label>
        <label className="freq-field">
          <span>до</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={String(MAX_KHZ)}
            value={to}
            aria-invalid={range.toInvalid}
            onChange={(e) => onToChange(e.target.value)}
          />
        </label>
      </div>

      <p className={invalid ? 'freq-hint error' : 'freq-hint'}>{hint}</p>

      {(from !== '' || to !== '') && (
        <button type="button" className="link-btn" onClick={onReset}>
          Сбросить
        </button>
      )}
    </section>
  )
}