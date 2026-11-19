import { MAX_KHZ } from '../lib/freqRange'

interface Props {
  from: string
  to: string
  onFrom: (value: string) => void
  onTo: (value: string) => void
  onReset: () => void
}

/** Два поля ввода диапазона частот (кГц). Подсказки в полях показывают, чем заменяется пустое значение. */
export function FreqFilter({ from, to, onFrom, onTo, onReset }: Props) {
  const active = from !== '' || to !== ''

  return (
    <form className="ff" onSubmit={(e) => e.preventDefault()} aria-label="Диапазон частот">
      <label className="ff-field">
        <span>От, кГц</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="0"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
        />
      </label>
      <label className="ff-field">
        <span>До, кГц</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={String(MAX_KHZ)}
          value={to}
          onChange={(e) => onTo(e.target.value)}
        />
      </label>
      {active && (
        <button type="button" className="ff-reset" onClick={onReset}>
          Сбросить
        </button>
      )}
    </form>
  )
}