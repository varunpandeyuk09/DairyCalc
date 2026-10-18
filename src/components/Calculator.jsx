import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db.js'
import { makeT, productName } from '../i18n.js'
import {
  fmtGrams,
  fmtRupees,
  gramsToRupees,
  rupeesToGrams,
  todayISO,
} from '../utils/format.js'

const RUPEE_PRESETS = [10, 20, 50, 100, 200]
const GRAM_PRESETS = [100, 250, 500, 1000]

export default function Calculator({ lang }) {
  const t = makeT(lang)

  const products =
    useLiveQuery(() => db.products.orderBy('id').toArray(), []) || []
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('rupees')
  const [value, setValue] = useState('')
  const [toast, setToast] = useState('')

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) || null,
    [products, selectedId],
  )

  useEffect(() => {
    if (!selected && products.length) setSelectedId(products[0].id)
  }, [products, selected])

  const num = Number(value) || 0
  const grams = selected && mode === 'rupees' ? rupeesToGrams(num, selected.rate) : num
  const rupees = selected && mode === 'grams' ? gramsToRupees(num, selected.rate) : num
  const canSave = !!selected && num > 0

  const addPreset = (n) => setValue((v) => String((Number(v) || 0) + n))

  const reset = () => {
    setValue('')
  }

  const save = async () => {
    if (!canSave) return
    await db.entries.add({
      date: todayISO(),
      productId: selected.id,
      nameHi: selected.nameHi,
      nameEn: selected.nameEn,
      emoji: selected.emoji,
      rate: selected.rate,
      rupees: mode === 'rupees' ? num : Math.round(rupees * 100) / 100,
      grams: mode === 'grams' ? num : Math.round(grams * 10) / 10,
      createdAt: Date.now(),
    })
    setValue('')
    setToast(t('savedToast'))
    setTimeout(() => setToast(''), 1800)
  }

  const presets = mode === 'rupees' ? RUPEE_PRESETS : GRAM_PRESETS
  const example = selected
    ? `${t('example')}: ${productName(selected, lang)} ${t('rupeeSign')}${selected.rate}${t('perKilo')} → ${t('rupeeSign')}30 = ${fmtGrams(rupeesToGrams(30, selected.rate))} ${t('gramsShort')}`
    : ''

  return (
    <div className="calc">
      <div className="cat-grid">
        {products.map((p) => {
          const active = selected?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              className={`prod-chip ${active ? 'active' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <span className="prod-name">
                {p.emoji} {productName(p, lang)} ({t('rupeeSign')}
                {p.rate})
              </span>
              <span className="prod-rate">
                {t('rupeeSign')}
                {p.rate}
                {t('perKilo')}
              </span>
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="calc-card">
          <p className="calc-selected">
            {productName(selected, lang)} · {t('rupeeSign')}
            {selected.rate}
            {t('perKilo')}
          </p>

          <div className="segmented">
            <button
              type="button"
              className={mode === 'rupees' ? 'active' : ''}
              onClick={() => {
                setMode('rupees')
                setValue('')
              }}
            >
              {t('rupeeSign')}
            </button>
            <button
              type="button"
              className={mode === 'grams' ? 'active' : ''}
              onClick={() => {
                setMode('grams')
                setValue('')
              }}
            >
              {t('gramsShort')}
            </button>
          </div>

          <label className="field-label" htmlFor="calc-input">
            {mode === 'rupees' ? t('rupeesHowMuch') : t('gramsHowMuch')}
          </label>
          <input
            id="calc-input"
            className="calc-input"
            type="text"
            inputMode="decimal"
            placeholder={mode === 'rupees' ? 'जैसे 30' : 'जैसे 500'}
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
          />

          <div className="result-pill">
            {mode === 'rupees' ? (
              <>
                <span className="result-num">{fmtGrams(grams)}</span>
                <span className="result-unit">{t('gramsShort')}</span>
              </>
            ) : (
              <>
                <span className="result-unit">{t('rupeeSign')}</span>
                <span className="result-num">{fmtRupees(rupees)}</span>
              </>
            )}
          </div>

          <div className="preset-row">
            {presets.map((n) => (
              <button key={n} type="button" className="preset-chip" onClick={() => addPreset(n)}>
                {mode === 'rupees' ? `+₹${n}` : `+${n}g`}
              </button>
            ))}
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-outline grow" onClick={reset}>
              {t('reset')}
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={save}
              disabled={!canSave}
            >
              {t('saveEntry')}
            </button>
          </div>

          {toast && <div className="toast">{toast}</div>}
          <p className="hint">{example}</p>
        </div>
      ) : (
        <p className="hint center">{t('pickProduct')}</p>
      )}
    </div>
  )
}
